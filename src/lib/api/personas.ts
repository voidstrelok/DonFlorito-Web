import { apiRequest, createFormData } from '@/lib/api/client';
import type { PersonaCreacionDTO, PersonaDTO } from '@/lib/types/models';

export const personasApi = {
  getPersonaByRut: (rut: string) =>
    apiRequest<PersonaDTO>('personas/GetPersonaByRut', {
      method: 'POST',
      body: createFormData({ RUT: rut }),
    }),
  getPersonas: () => apiRequest<PersonaDTO[]>('personas/getPersonas'),
  createPersona: (persona: PersonaCreacionDTO) =>
    apiRequest<PersonaDTO>('personas', {
      method: 'POST',
      body: persona,
    }),
};
