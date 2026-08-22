import axios from "axios";
import { fetchCsrfToken } from "./csrf";

const BASE = `${import.meta.env.VITE_IMMERCALC_API_URL}/pullcalc`;

async function post(path, data) {
  const csrfToken = await fetchCsrfToken();
  const res = await axios.post(`${BASE}${path}`, data, {
    withCredentials: true,
    headers: { "X-XSRF-TOKEN": csrfToken },
  });
  return res.data;
}

export function getGenshinEndDate({ startDate, mode, value }) {
  return post("/genshin/end-date", { startDate, mode, value });
}

export function calculateGenshinPulls(payload) {
  return post("/genshin/calculate", payload);
}
