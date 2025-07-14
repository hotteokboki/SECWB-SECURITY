import axios from 'axios';
import { getGlobalCsrfToken } from '../context/CsrfContext';

const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  }
});

axiosClient.interceptors.request.use((config) => {
  if (config.method === 'post') {
    const csrf = getGlobalCsrfToken();
    if (csrf) {
      config.headers['X-CSRF-Token'] = csrf;
    }
  }
  return config;
});

export default axiosClient;