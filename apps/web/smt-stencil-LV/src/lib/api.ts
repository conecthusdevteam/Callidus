/**
 * Cliente HTTP para consumir a API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ApiResponse<T> {
  data: T;
  status: number;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Endpoints para Stencils
export const stencilsApi = {
  getAll: () => apiRequest('/stencils'),
  getById: (id: string) => apiRequest(`/stencils/${id}`),
  create: (data: unknown) => apiRequest('/stencils', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: unknown) => apiRequest(`/stencils/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/stencils/${id}`, {
    method: 'DELETE',
  }),
};

// Endpoints para Plates
export const platesApi = {
  getAll: () => apiRequest('/plates'),
  getById: (id: string) => apiRequest(`/plates/${id}`),
  create: (data: unknown) => apiRequest('/plates', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: unknown) => apiRequest(`/plates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/plates/${id}`, {
    method: 'DELETE',
  }),
};
