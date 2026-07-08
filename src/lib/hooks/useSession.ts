'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionApi } from '@/lib/api/session';
import { clearSessionToken, setSessionToken } from '@/lib/utils/storage';
import type { ConfigDTO } from '@/lib/types/models';

export function useParametrosQuery() {
  return useQuery({ queryKey: ['session', 'parametros'], queryFn: sessionApi.getParametros });
}

export function useSessionIsValidQuery(enabled = true) {
  return useQuery({
    queryKey: ['session', 'is-valid'],
    queryFn: sessionApi.sessionIsValid,
    enabled,
    retry: false,
  });
}

export function useConfigQuery(enabled = true) {
  return useQuery({ queryKey: ['session', 'config'], queryFn: sessionApi.getConfig, enabled });
}

export function useAdminLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ usuario, password }: { usuario: string; password: string }) =>
      sessionApi.adminLogin(usuario, password),
    onSuccess: (token) => {
      setSessionToken(token);
      void queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });
}

export function useGuardarConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: ConfigDTO) => sessionApi.guardarConfig(config),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['session', 'config'] });
      await queryClient.invalidateQueries({ queryKey: ['session', 'parametros'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return () => {
    clearSessionToken();
    void queryClient.invalidateQueries({ queryKey: ['session'] });
  };
}
