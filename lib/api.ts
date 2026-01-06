export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3900/api';

export const apiClient = {
  async fetch(endpoint: string, options?: RequestInit) {
    const url = `${API_BASE_URL}${endpoint}`;
    return fetch(url, options);
  }
};
