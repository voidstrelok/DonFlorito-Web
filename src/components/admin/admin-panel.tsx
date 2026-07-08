'use client';

import { useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { useLoading } from '@/components/providers/loading-provider';
import { useTranslations } from '@/lib/i18n';
import { useCreatePersonaMutation, usePersonasQuery } from '@/lib/hooks/usePersonas';
import {
  useCancelarReservaEspecialMutation,
  useCancelarReservaMutation,
  useIngresarReservaEspecialMutation,
  useReservasEspecialesQuery,
  useReservasQuery,
} from '@/lib/hooks/useReservas';
import { useConfigQuery, useAdminLoginMutation, useGuardarConfigMutation, useLogout, useSessionIsValidQuery } from '@/lib/hooks/useSession';
import { useAllTipoServiciosQuery, useServiciosQuery } from '@/lib/hooks/useServicios';
import { getSessionToken } from '@/lib/utils/storage';
import { formatShortDate, getReservationTotal } from '@/lib/utils/format';
import type { ConfigDTO, PersonaCreacionDTO, ReservaEspecialCreacionDTO } from '@/lib/types/models';
import { useAppLocale } from '@/components/providers/locale-provider';

function currentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function AdminPanel() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const { setManualLoading } = useLoading();
  const [monthState, setMonthState] = useState(currentMonth());
  const [loginForm, setLoginForm] = useState({ usuario: '', password: '' });
  const [personaForm, setPersonaForm] = useState<PersonaCreacionDTO>({
    rut: '',
    nombre: '',
    segundoNombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    telefono: 0,
  });
  const [reservaEspecialForm, setReservaEspecialForm] = useState<ReservaEspecialCreacionDTO>({
    idServicio: null,
    idTipoServicio: null,
    fechaComienzo: '',
    fechaTermino: '',
    isCanchas: false,
    isCamping: false,
  });
  const [message, setMessage] = useState<string | null>(null);
  const hasToken = Boolean(getSessionToken());

  const loginMutation = useAdminLoginMutation();
  const isValidQuery = useSessionIsValidQuery(hasToken);
  const logout = useLogout();
  const authenticated = Boolean(hasToken && isValidQuery.data);

  const configQuery = useConfigQuery(authenticated);
  const personasQuery = usePersonasQuery(authenticated);
  const reservasQuery = useReservasQuery(monthState.year, monthState.month, 1, 10, authenticated);
  const reservasEspecialesQuery = useReservasEspecialesQuery(monthState.year, monthState.month, authenticated);
  const serviciosQuery = useServiciosQuery(authenticated);
  const tipoServiciosQuery = useAllTipoServiciosQuery(authenticated);

  const guardarConfig = useGuardarConfigMutation();
  const createPersona = useCreatePersonaMutation();
  const cancelarReserva = useCancelarReservaMutation();
  const ingresarReservaEspecial = useIngresarReservaEspecialMutation();
  const cancelarReservaEspecial = useCancelarReservaEspecialMutation();

  const pendingPayments = useMemo(
    () => (reservasQuery.data ?? []).filter((reserva) => reserva.idEstadoReserva === 1),
    [reservasQuery.data],
  );

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setManualLoading(true);
    try {
      await loginMutation.mutateAsync(loginForm);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error');
    } finally {
      setManualLoading(false);
    }
  }

  async function handleSaveConfig(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextConfig: ConfigDTO = {
      hApertura: Number(formData.get('hApertura')),
      mApertura: Number(formData.get('mApertura')),
      hCierre: Number(formData.get('hCierre')),
      mCierre: Number(formData.get('mCierre')),
      reservasEnabled: formData.get('reservasEnabled') === 'on',
      piscinasEnabled: formData.get('piscinasEnabled') === 'on',
      servicios: configQuery.data?.servicios ?? [],
    };
    await guardarConfig.mutateAsync(nextConfig);
    setMessage('Configuración guardada.');
  }

  if (!authenticated) {
    return (
      <div className="admin-login mx-auto">
        <h1 className="titulo-1 text-center azul mb-4">{t('admin')}</h1>
        {message ? <div className="alert alert-danger">{message}</div> : null}
        <form onSubmit={handleLogin} className="reservation-block">
          <div className="mb-3">
            <label className="form-label">Usuario</label>
            <input
              className="form-control"
              value={loginForm.usuario}
              onChange={(event) => setLoginForm((current) => ({ ...current, usuario: event.target.value }))}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={loginForm.password}
              onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
            />
          </div>
          <Button type="submit" className="btn-azul w-100" disabled={loginMutation.isPending}>
            Ingresar
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="titulo-1 azul mb-0">Panel de administración</h1>
        <Button variant="outline-secondary" onClick={logout}>
          Cerrar sesión
        </Button>
      </div>
      {message ? <div className="alert alert-info">{message}</div> : null}

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <label className="form-label">Año</label>
          <input
            className="form-control"
            type="number"
            value={monthState.year}
            onChange={(event) => setMonthState((current) => ({ ...current, year: Number(event.target.value) }))}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Mes</label>
          <input
            className="form-control"
            type="number"
            min={1}
            max={12}
            value={monthState.month}
            onChange={(event) => setMonthState((current) => ({ ...current, month: Number(event.target.value) }))}
          />
        </div>
      </div>

      <Tabs defaultActiveKey="config" className="mb-3" fill>
        <Tab eventKey="config" title="Config">
          {configQuery.data ? (
            <form className="reservation-block" onSubmit={handleSaveConfig}>
              <div className="row g-3">
                <div className="col-md-3"><label className="form-label">Hora apertura</label><input name="hApertura" defaultValue={configQuery.data.hApertura} type="number" className="form-control" /></div>
                <div className="col-md-3"><label className="form-label">Min apertura</label><input name="mApertura" defaultValue={configQuery.data.mApertura} type="number" className="form-control" /></div>
                <div className="col-md-3"><label className="form-label">Hora cierre</label><input name="hCierre" defaultValue={configQuery.data.hCierre} type="number" className="form-control" /></div>
                <div className="col-md-3"><label className="form-label">Min cierre</label><input name="mCierre" defaultValue={configQuery.data.mCierre} type="number" className="form-control" /></div>
                <div className="col-md-6"><Form.Check name="reservasEnabled" defaultChecked={configQuery.data.reservasEnabled} label="Reservas habilitadas" /></div>
                <div className="col-md-6"><Form.Check name="piscinasEnabled" defaultChecked={configQuery.data.piscinasEnabled} label="Piscinas habilitadas" /></div>
              </div>
              <div className="text-end mt-3"><Button className="btn-azul" type="submit">{t('guardar')}</Button></div>
            </form>
          ) : null}
        </Tab>
        <Tab eventKey="pagos" title="Pagos">
          <div className="reservation-block">
            <h3>Reservas con pago pendiente</h3>
            <ul className="list-group list-group-flush">
              {pendingPayments.map((reserva) => (
                <li key={reserva.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <span>DF{reserva.id} · {reserva.persona.nombre} · {formatShortDate(reserva.fechaReserva, locale)}</span>
                  <span>${getReservationTotal(reserva.reservaServicio)}</span>
                </li>
              ))}
              {!pendingPayments.length ? <li className="list-group-item">Sin pagos pendientes.</li> : null}
            </ul>
          </div>
        </Tab>
        <Tab eventKey="personas" title="Personas">
          <div className="row g-4">
            <div className="col-lg-5">
              <form
                className="reservation-block"
                onSubmit={async (event) => {
                  event.preventDefault();
                  await createPersona.mutateAsync(personaForm);
                  setMessage('Persona creada.');
                }}
              >
                <h3>Nueva persona</h3>
                {Object.keys(personaForm).map((key) => (
                  <div key={key} className="mb-2">
                    <label className="form-label">{key}</label>
                    <input
                      className="form-control"
                      value={String(personaForm[key as keyof PersonaCreacionDTO])}
                      onChange={(event) =>
                        setPersonaForm((current) => ({
                          ...current,
                          [key]: key === 'telefono' ? Number(event.target.value) : event.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
                <Button className="btn-azul" type="submit">Crear persona</Button>
              </form>
            </div>
            <div className="col-lg-7">
              <div className="reservation-block">
                <h3>Listado</h3>
                <div className="table-responsive">
                  <table className="table">
                    <thead><tr><th>RUT</th><th>Nombre</th><th>Email</th><th>Teléfono</th></tr></thead>
                    <tbody>
                      {(personasQuery.data ?? []).map((persona) => (
                        <tr key={persona.id}><td>{persona.rut}</td><td>{persona.nombre} {persona.apellidoPaterno}</td><td>{persona.email}</td><td>{persona.telefono}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </Tab>
        <Tab eventKey="reservas" title="Reservas">
          <div className="reservation-block table-responsive">
            <table className="table">
              <thead><tr><th>ID</th><th>Persona</th><th>Fecha</th><th>Estado</th><th>Total</th><th /></tr></thead>
              <tbody>
                {(reservasQuery.data ?? []).map((reserva) => (
                  <tr key={reserva.id}>
                    <td>DF{reserva.id}</td>
                    <td>{reserva.persona.nombre} {reserva.persona.apellidoPaterno}</td>
                    <td>{formatShortDate(reserva.fechaReserva, locale)}</td>
                    <td>{reserva.estadoReserva.nombre}</td>
                    <td>${getReservationTotal(reserva.reservaServicio)}</td>
                    <td>
                      <Button size="sm" variant="outline-danger" onClick={() => cancelarReserva.mutate(reserva.id)}>
                        Cancelar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tab>
        <Tab eventKey="reservas-especiales" title="Reservas especiales">
          <div className="row g-4">
            <div className="col-lg-5">
              <form
                className="reservation-block"
                onSubmit={async (event) => {
                  event.preventDefault();
                  await ingresarReservaEspecial.mutateAsync(reservaEspecialForm);
                  setMessage('Reserva especial ingresada.');
                }}
              >
                <h3>Nueva reserva especial</h3>
                <div className="mb-2"><label className="form-label">ID Servicio</label><input className="form-control" value={reservaEspecialForm.idServicio ?? ''} onChange={(event) => setReservaEspecialForm((current) => ({ ...current, idServicio: Number(event.target.value) || null }))} /></div>
                <div className="mb-2"><label className="form-label">ID Tipo Servicio</label><input className="form-control" value={reservaEspecialForm.idTipoServicio ?? ''} onChange={(event) => setReservaEspecialForm((current) => ({ ...current, idTipoServicio: Number(event.target.value) || null }))} /></div>
                <div className="mb-2"><label className="form-label">Fecha inicio</label><input type="date" className="form-control" value={String(reservaEspecialForm.fechaComienzo)} onChange={(event) => setReservaEspecialForm((current) => ({ ...current, fechaComienzo: event.target.value }))} /></div>
                <div className="mb-2"><label className="form-label">Fecha término</label><input type="date" className="form-control" value={String(reservaEspecialForm.fechaTermino)} onChange={(event) => setReservaEspecialForm((current) => ({ ...current, fechaTermino: event.target.value }))} /></div>
                <Form.Check label="Canchas" checked={reservaEspecialForm.isCanchas} onChange={(event) => setReservaEspecialForm((current) => ({ ...current, isCanchas: event.target.checked }))} />
                <Form.Check label="Camping" checked={reservaEspecialForm.isCamping} onChange={(event) => setReservaEspecialForm((current) => ({ ...current, isCamping: event.target.checked }))} />
                <Button className="btn-azul mt-3" type="submit">Guardar</Button>
              </form>
            </div>
            <div className="col-lg-7">
              <div className="reservation-block table-responsive">
                <table className="table">
                  <thead><tr><th>ID</th><th>Servicio</th><th>Desde</th><th>Hasta</th><th /></tr></thead>
                  <tbody>
                    {(reservasEspecialesQuery.data ?? []).map((reserva) => (
                      <tr key={reserva.id}>
                        <td>{reserva.id}</td>
                        <td>{reserva.servicio?.nombre ?? reserva.tipoServicio?.nombre ?? '—'}</td>
                        <td>{formatShortDate(reserva.fechaComienzo, locale)}</td>
                        <td>{formatShortDate(reserva.fechaTermino, locale)}</td>
                        <td><Button size="sm" variant="outline-danger" onClick={() => cancelarReservaEspecial.mutate(reserva.id)}>Cancelar</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Tab>
        <Tab eventKey="servicios" title="Servicios">
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="reservation-block table-responsive">
                <h3>Tipos de servicio</h3>
                <table className="table">
                  <thead><tr><th>ID</th><th>Nombre</th><th>Servicios</th></tr></thead>
                  <tbody>
                    {(tipoServiciosQuery.data ?? []).map((tipo) => (
                      <tr key={tipo.id}><td>{tipo.id}</td><td>{tipo.nombre}</td><td>{tipo.servicio.length}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="reservation-block table-responsive">
                <h3>Servicios activos</h3>
                <table className="table">
                  <thead><tr><th>ID</th><th>Nombre</th><th>Precio</th></tr></thead>
                  <tbody>
                    {(serviciosQuery.data ?? []).flatMap((tipo) => tipo.servicio).map((servicio) => (
                      <tr key={servicio.id}><td>{servicio.id}</td><td>{servicio.nombre}</td><td>${servicio.precio}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
