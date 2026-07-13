// Shared API config — reads from env var in production, falls back to localhost
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
