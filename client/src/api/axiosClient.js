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
  const csrf = getGlobalCsrfToken();

  // Apply CSRF token to state-changing methods
  const methodsRequiringCSRF = ['post', 'put', 'patch', 'delete'];

  if (methodsRequiringCSRF.includes(config.method) && csrf) {
    config.headers['X-CSRF-Token'] = csrf;
  }

  return config;
});

export default axiosClient;