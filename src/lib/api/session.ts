import { apiRequest, createFormData } from '@/lib/api/client';
import type { ConfigDTO, ParametrosDTO } from '@/lib/types/models';

export const sessionApi = {
  getParametros: () => apiRequest<ParametrosDTO>('session/GetParametros'),
  adminLogin: (usuario: string, password: string) =>
    apiRequest<string>('session/AdminLogin', {
      method: 'POST',
      body: createFormData({ usuario, password }),
      responseType: 'text',
    }),
  sessionIsValid: () => apiRequest<boolean>('session/SessionIsValid'),
  getConfig: () => apiRequest<ConfigDTO>('session/GetConfig'),
  guardarConfig: (config: ConfigDTO) =>
    apiRequest<unknown>('session/GuardarConfig', {
      method: 'POST',
      body: config,
    }),
};
