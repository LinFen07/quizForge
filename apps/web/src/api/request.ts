import axios from 'axios';
import type { ApiResponse } from '@interview-quiz/shared';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message ?? err.message;
    console.error('[API Error]', msg);
    return Promise.reject(err);
  },
);

export default request;
