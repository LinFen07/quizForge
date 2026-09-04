import axios from 'axios';
import type { ApiResponse } from '@interview-quiz/shared';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

request.interceptors.response.use(
  (res) => res.data.data ?? res.data,
  (err) => {
    const raw = err.response?.data?.message ?? err.message;
    const msg = Array.isArray(raw) ? raw.join(', ') : String(raw);

    if (err.response?.status >= 400 && err.response?.status < 500) {
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: msg, type: 'error' },
        }),
      );
    }

    return Promise.reject(err);
  },
);

export default request;
