import axios from 'axios';

// Use environment variable if set, otherwise try to detect if we're in browser or container
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // If running in browser, use localhost (backend is exposed on host)
  // If running in container, this would be http://backend:4000/api, but we're in browser
  return window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? 'http://localhost:4000/api'
    : `${window.location.protocol}//${window.location.hostname}:4000/api`;
};

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token from localStorage if available
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

