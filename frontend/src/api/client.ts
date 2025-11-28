import axios from "axios";

/*
In dev, /api is proxied to the backend server by Vite dev server.
In production, the frontend is served by the backend, so /api works there too.

Could remove axios and just use fetch
*/
export const apiClient = axios.create({
  baseURL: "/api",
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};
