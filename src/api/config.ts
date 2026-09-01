export const API_BASE = typeof window !== 'undefined' && window.location.port && window.location.port !== '3001' && window.location.port !== '4173' && window.location.port !== '5173'
    ? `http://${window.location.hostname}:3001`
    : '';
