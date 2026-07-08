'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { personasApi } from '@/lib/api/personas';
import type { PersonaCreacionDTO } from '@/lib/types/models';

export function usePersonaByRutMutation() {
  return useMutation({ mutationFn: (rut: string) => personasApi.getPersonaByRut(rut) });
}

export function usePersonasQuery(enabled = true) {
  return useQuery({ queryKey: ['personas'], queryFn: personasApi.getPersonas, enabled });
}

export function useCreatePersonaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (persona: PersonaCreacionDTO) => personasApi.createPersona(persona),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
}
