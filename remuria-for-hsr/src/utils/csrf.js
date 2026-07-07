import axios from "axios";

export async function fetchCsrfToken() {
  const res = await axios.get(`${import.meta.env.VITE_AUTH_API_URL}/api/csrf-token`, {
    withCredentials: true,
  });
  return res.data?.token ?? '';
}
