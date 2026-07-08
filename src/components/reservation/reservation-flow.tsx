'use client';

import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatRut, isRutValid, RutModel } from '@ftapiat/js-rut-utils';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { TimedServiceCard } from '@/components/reservation/timed-service-card';
import { useAppLocale } from '@/components/providers/locale-provider';
import { useLoading } from '@/components/providers/loading-provider';
import { usePersonaByRutMutation } from '@/lib/hooks/usePersonas';
import { useNuevaReservaMutation } from '@/lib/hooks/useReservas';
import { useParametrosQuery } from '@/lib/hooks/useSession';
import { useCatalogoQuery } from '@/lib/hooks/useServicios';
import { useTranslations } from '@/lib/i18n';
import type { PersonaDTO, ReservaCreacionDTO, ReservaServicioCreacionDTO } from '@/lib/types/models';
import { EnumTipoServicio } from '@/lib/types/enums';
import { getReservationTotal, isBookableDate, toApiDate } from '@/lib/utils/format';
import { setStoredReservation } from '@/lib/utils/storage';

const personaSchema = z.object({
  rut: z.string().min(1),
  nombre: z.string().min(1),
  segundoNombre: z.string().min(1),
  apellidoPaterno: z.string().min(1),
  apellidoMaterno: z.string().min(1),
  email: z.email(),
  telefono: z
    .string()
    .regex(/^\d{8,}$/),
});

type PersonaFormValues = z.infer<typeof personaSchema>;

const EMPTY_PERSONA: PersonaFormValues = {
  rut: '',
  nombre: '',
  segundoNombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  email: '',
  telefono: '',
};

function getDefaultDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

function ReservationRow({ service, locale, t }: { service: ReservaServicioCreacionDTO; locale: string; t: ReturnType<typeof useTranslations> }) {
  const timeLabel = service.horaComienzo
    ? `${t('desde')} ${new Date(service.horaComienzo).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} - ${service.minutos * service.cantidad} min.`
    : null;

  return (
    <div className="summary-row row align-items-center g-3">
      <div className="col-lg-8">
        <h5 className="mb-1">{service.cantidad} x {t(service.nombre)}</h5>
        {timeLabel ? <div className="text-muted small">{timeLabel}</div> : null}
      </div>
      <div className="col-lg-4 text-lg-end">
        <strong>${service.precio * service.cantidad}</strong>
      </div>
    </div>
  );
}

export function ReservationFlow() {
  const router = useRouter();
  const t = useTranslations();
  const { locale } = useAppLocale();
  const { setManualLoading } = useLoading();
  const [selectedDate, setSelectedDate] = useState(getDefaultDate());
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cart, setCart] = useState<ReservaServicioCreacionDTO[]>([]);
  const [knownPersona, setKnownPersona] = useState<PersonaDTO | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lookupDisabled, setLookupDisabled] = useState(false);

  const fechaApi = useMemo(() => (selectedDate ? toApiDate(selectedDate) : ''), [selectedDate]);
  const { data: parametros } = useParametrosQuery();
  const { data: catalogo = [] } = useCatalogoQuery(fechaApi, Boolean(fechaApi));
  const lookupPersona = usePersonaByRutMutation();
  const nuevaReserva = useNuevaReservaMutation();

  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(personaSchema),
    defaultValues: EMPTY_PERSONA,
  });

  useEffect(() => {
    if (parametros && !parametros.reservasEnabled) {
      router.replace('/403');
    }
  }, [parametros, router]);

  const timedServices = catalogo.filter(
    (item) => item.id !== EnumTipoServicio.Quincho && item.id !== EnumTipoServicio.PiscinaGeneral && item.id !== EnumTipoServicio.PiscinaAM,
  );
  const poolServices = catalogo.filter(
    (item) => item.id === EnumTipoServicio.PiscinaGeneral || item.id === EnumTipoServicio.PiscinaAM,
  );
  const quinchoService = catalogo.find((item) => item.id === EnumTipoServicio.Quincho);

  function replaceCartItem(item: ReservaServicioCreacionDTO | null, typeId: number) {
    setCart((current) => {
      const next = current.filter((entry) => entry.idTipoServicio !== typeId);
      return item ? [...next, item] : next;
    });
  }

  function handlePoolChange(tipoId: number, quantity: number) {
    const service = catalogo.find((item) => item.id === tipoId);
    if (!service) return;
    if (quantity <= 0) {
      replaceCartItem(null, tipoId);
      return;
    }

    replaceCartItem(
      {
        idServicio: service.servicio[0]?.id ?? 0,
        idTipoServicio: service.id,
        idPrecioServicio: service.precioServicio[0]?.id ?? 0,
        cantidad: quantity,
        horaComienzo: undefined,
        nombre: service.servicio[0]?.nombre ?? service.nombre,
        precio: service.precioServicio[0]?.precio ?? 0,
        minutos: 0,
      },
      tipoId,
    );
  }

  function handleQuinchoChange(serviceId: number, quantity: number) {
    if (!quinchoService) return;
    if (!serviceId || quantity <= 0) {
      replaceCartItem(null, quinchoService.id);
      return;
    }

    const selectedService = quinchoService.servicio.find((item) => item.id === serviceId);
    replaceCartItem(
      {
        idServicio: serviceId,
        idTipoServicio: quinchoService.id,
        idPrecioServicio: quinchoService.precioServicio[0]?.id ?? 0,
        cantidad: quantity,
        horaComienzo: undefined,
        nombre: selectedService?.nombre ?? quinchoService.nombre,
        precio: quinchoService.precioServicio[0]?.precio ?? 0,
        minutos: 0,
      },
      quinchoService.id,
    );
  }

  async function handleLookupRut() {
    const rut = form.getValues('rut');
    const formatted = formatRut(rut);
    form.setValue('rut', formatted);

    if (!isRutValid(formatted)) {
      form.setError('rut', { message: t('error-rut') });
      return;
    }

    const rutModel = RutModel.fromString(formatted);
    setManualLoading(true);
    try {
      const persona = await lookupPersona.mutateAsync(`${rutModel.number}-${rutModel.dv}`);
      setKnownPersona(persona);
      setLookupDisabled(true);
      form.reset({
        rut: persona.rut,
        nombre: persona.nombre,
        segundoNombre: persona.segundoNombre,
        apellidoPaterno: persona.apellidoPaterno,
        apellidoMaterno: persona.apellidoMaterno,
        email: persona.email,
        telefono: String(persona.telefono),
      });
    } catch {
      setKnownPersona(null);
      setLookupDisabled(false);
    } finally {
      setManualLoading(false);
    }
  }

  async function submitPersona(values: PersonaFormValues) {
    if (!cart.length) {
      setErrorMessage(t('sin-servicios'));
      return;
    }

    const reservation: ReservaCreacionDTO = {
      idPersona: knownPersona?.id ?? null,
      fechaReserva: new Date(`${selectedDate}T00:00:00`),
      reservaServicio: cart,
      personaCreacion: knownPersona
        ? null
        : {
            rut: (() => {
              const rutModel = RutModel.fromString(values.rut);
              return `${rutModel.number}-${rutModel.dv}`;
            })(),
            nombre: values.nombre,
            segundoNombre: values.segundoNombre,
            apellidoPaterno: values.apellidoPaterno,
            apellidoMaterno: values.apellidoMaterno,
            email: values.email,
            telefono: Number(values.telefono),
          },
      ordenCompra: null,
    };

    form.clearErrors();
    setShowTerms(false);
    setManualLoading(true);
    try {
      const response = await nuevaReserva.mutateAsync(reservation);
      setStoredReservation(response);
      router.push('/mi-reserva');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error');
    } finally {
      setManualLoading(false);
    }
  }

  return (
    <div>
      {errorMessage ? <div className="alert alert-danger">{errorMessage}</div> : null}

      {step === 1 ? (
        <section>
          <h1 className="text-center titulo-1 verde">{t('1-seleccionar-servicios')}</h1>
          <h4 className="text-center azul parrafos">
            <a href="/contacto">{t('reservas-especiales-contacto')}</a>
          </h4>
          <div className="text-center mb-4">
            <h2 className="azul titulo-2">{t('fecha')}</h2>
            <input
              className="form-control form-control-lg date-input"
              type="date"
              value={selectedDate}
              onChange={(event) => {
                const nextDate = event.target.value;
                if (!isBookableDate(nextDate)) {
                  setErrorMessage('Fecha no disponible para la reserva. (Date not available for reservation)');
                  return;
                }
                setErrorMessage(null);
                setSelectedDate(nextDate);
                setCart([]);
              }}
            />
            <div className="mt-3">
              <a href={t('enlace-mapa')} target="_blank" rel="noreferrer" className="btn btn-outline-primary">
                <i className="bi bi-geo-alt-fill rojo" /> {t('ver-mapa')}
              </a>
            </div>
          </div>

          {timedServices.map((tipoServicio) => (
            <div key={tipoServicio.id} className="reservation-block mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h3 className="azul mb-1">{t(tipoServicio.nombre)}</h3>
                  <div className="text-muted">
                    ${tipoServicio.precioServicio[0]?.precio ?? 0} · {t('por-cada-partido-de')} {tipoServicio.precioServicio[0]?.minutos ?? 0} {t('minutos')}
                  </div>
                </div>
                <span className="badge text-bg-light">{tipoServicio.servicio.length} {t('canchas-disponibles')}</span>
              </div>
              <TimedServiceCard
                tipoServicio={tipoServicio}
                fechaReserva={fechaApi}
                locale={locale}
                onChange={(item) => replaceCartItem(item, tipoServicio.id)}
              />
            </div>
          ))}

          {poolServices.length ? (
            <div className="reservation-block mb-4">
              <h3 className="verde">{t('acceso-piscina')}</h3>
              <div className="row g-3">
                {poolServices.map((pool) => (
                  <div key={pool.id} className="col-lg-6">
                    <label className="form-label">
                      {pool.id === EnumTipoServicio.PiscinaGeneral ? t('general') : t('entrada-adulto-mayor')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      defaultValue={0}
                      className="form-control"
                      onChange={(event) => handlePoolChange(pool.id, Number(event.target.value) || 0)}
                    />
                    <div className="small text-muted mt-1">${pool.precioServicio[0]?.precio ?? 0}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {quinchoService ? (
            <div className="reservation-block mb-4">
              <h3 className="verde">{t('reserva-quincho')}</h3>
              <div className="row g-3">
                <div className="col-lg-8">
                  <label className="form-label">{t('zona-quinchos')}</label>
                  <select className="form-select" onChange={(event) => handleQuinchoChange(Number(event.target.value), 1)} defaultValue="0">
                    <option value="0">{t('seleccionar-zona')}</option>
                    {quinchoService.servicio.map((service) => (
                      <option key={service.id} value={service.id}>
                        {t(service.nombre)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-lg-4">
                  <label className="form-label">{t('n-quinchos')}</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    defaultValue={0}
                    className="form-control"
                    onChange={(event) => {
                      const selector = document.querySelector<HTMLSelectElement>('select.form-select');
                      handleQuinchoChange(Number(selector?.value ?? 0), Number(event.target.value) || 0);
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="reservation-block">
            <div className="row align-items-center">
              <div className="col-lg-8">
                <h2>{t('total-reserva')}</h2>
              </div>
              <div className="col-lg-4 text-lg-end">
                <h2>${getReservationTotal(cart)}</h2>
              </div>
            </div>
            <hr className="mt-2" />
            <div className="text-end">
              <Button className="btn-azul" disabled={!cart.length} onClick={() => setStep(2)}>
                {t('continuar')}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section>
          <h1 className="text-center titulo-1 verde">{t('2-datos-cliente')}</h1>
          <h5 className="text-center rojo">{t('datos-obligatorios')}</h5>
          <form onSubmit={form.handleSubmit(() => setStep(3))} className="row g-3">
            <div className="col-12">
              <label className="form-label">RUT</label>
              <div className="input-group">
                <input className="form-control" {...form.register('rut')} disabled={lookupDisabled} />
                <Button type="button" className="btn-azul" onClick={handleLookupRut}>
                  {t('buscar')}
                </Button>
              </div>
              {form.formState.errors.rut ? <div className="lb-error">{form.formState.errors.rut.message}</div> : null}
            </div>
            {(['nombre', 'segundoNombre', 'apellidoPaterno', 'apellidoMaterno', 'email', 'telefono'] as const).map((field) => (
              <div key={field} className="col-lg-6">
                <label className="form-label text-capitalize">{field}</label>
                <input
                  className="form-control"
                  type={field === 'email' ? 'email' : field === 'telefono' ? 'tel' : 'text'}
                  disabled={lookupDisabled}
                  {...form.register(field)}
                />
                {form.formState.errors[field] ? (
                  <div className="lb-error">{form.formState.errors[field]?.message}</div>
                ) : null}
              </div>
            ))}
            <div className="col-12 d-flex justify-content-between">
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                {t('regresar')}
              </Button>
              <Button type="submit" className="btn-azul">
                {t('continuar')}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      {step === 3 ? (
        <section>
          <h1 className="text-center titulo-1 verde">{t('3-resumen-pago')}</h1>
          <h5 className="text-center parrafos azul">{t('resumen-pago')}</h5>
          <h2 className="parrafos azul text-center">{selectedDate}</h2>
          <div className="reservation-block">
            {cart.map((service) => (
              <ReservationRow key={`${service.idTipoServicio}-${service.idServicio}`} service={service} locale={locale} t={t} />
            ))}
            <hr />
            <div className="row align-items-center">
              <div className="col-lg-8">
                <h2>{t('total-reserva')}</h2>
              </div>
              <div className="col-lg-4 text-lg-end">
                <h2>${getReservationTotal(cart)}</h2>
              </div>
            </div>
            <div className="d-flex justify-content-between mt-4">
              <Button variant="secondary" onClick={() => setStep(2)}>
                {t('cancelar')}
              </Button>
              <Button className="btn-azul" onClick={() => setShowTerms(true)}>
                {t('confirmar-reserva')}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <Modal show={showTerms} onHide={() => setShowTerms(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('atencion')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="parrafos azul fs-5 mb-3">{t('leer-terminos')}</div>
          <a className="btn btn-azul" target="_blank" rel="noreferrer" href={t('enlace-terminos')}>
            {t('btn-terminos')}
          </a>
        </Modal.Body>
        <Modal.Footer className="flex-column align-items-stretch">
          <div className="parrafos rojo text-center mb-3">{t('mensaje-confirmar-reserva')}</div>
          <Button className="btn-rojo" onClick={form.handleSubmit(submitPersona)} disabled={nuevaReserva.isPending}>
            {t('confirmar-reserva')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
