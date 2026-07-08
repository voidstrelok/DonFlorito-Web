import { getSessionToken } from '@/lib/utils/storage';

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

type ResponseType = 'json' | 'text' | 'blob' | 'void';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: BodyInit | FormData | object | null;
  headers?: HeadersInit;
  responseType?: ResponseType;
}

function buildUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL(path.replace(/^\//, ''), normalizedBase).toString();
}

async function parseError(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getSessionToken();

  if (token) {
    headers.set('Authorization', ['Bearer', token].join(' '));
  }

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body && typeof options.body === 'object') {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  } else if (typeof options.body === 'string') {
    body = options.body;
  }

  const response = await fetch(buildUrl(path), {
    method: options.method ?? 'GET',
    body,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = await parseError(response);
    const message = typeof payload === 'string' ? payload : response.statusText;
    throw new ApiError(message || 'HTTP error', response.status, payload);
  }

  switch (options.responseType ?? 'json') {
    case 'text':
      return (await response.text()) as T;
    case 'blob':
      return (await response.blob()) as T;
    case 'void':
      return undefined as T;
    default:
      return (await response.json()) as T;
  }
}

export function createFormData(values: Record<string, string | number | boolean>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.append(key, String(value));
  }
  return formData;
}
