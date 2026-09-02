import axios from 'axios';
import type { ApiResponse } from '@interview-quiz/shared';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message ?? err.message;
    console.error('[API Error]', msg);

    if (err.response?.status >= 400 && err.response?.status < 500) {
      const event = new CustomEvent('toast', {
        detail: { message: msg, type: 'error' },
      });
      window.dispatchEvent(event);
    }

    return Promise.reject(err);
  },
);

export default request;
