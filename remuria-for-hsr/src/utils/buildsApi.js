import axios from "axios";
import { fetchCsrfToken } from "./csrf";

const BASE = `${import.meta.env.VITE_CELESTIA_API_URL}/build`;

export async function getBuilds(uid, page, { filterByAvatarId, filterByPath, filterByElement, order } = {}) {
  const params = {};
  if (filterByAvatarId) params.filterByAvatarId = filterByAvatarId;
  if (filterByPath) params.filterByPath = filterByPath;
  if (filterByElement) params.filterByElement = filterByElement;
  if (order) params.order = order;
  const res = await axios.get(`${BASE}/get-list/${uid}/${page}`, { params });
  return res.data;
}

export async function getAllBuilds(uid) {
  const res = await axios.get(`${BASE}/get-list/all/${uid}`, { withCredentials: true });
  return res.data;
}

async function mutate(method, path, params) {
  const csrfToken = await fetchCsrfToken();
  const res = await axios.request({
    method,
    url: `${BASE}${path}`,
    params,
    withCredentials: true,
    headers: { "X-XSRF-TOKEN": csrfToken },
  });
  return res.data;
}

export function createBuild({ uid, avatarId, buildName }) {
  return mutate("post", "/create", { uid, avatarId, buildName });
}

export function renameBuild({ uid, avatarId, buildNameOld, buildNameNew }) {
  return mutate("patch", "/rename", { uid, avatarId, buildNameOld, buildNameNew });
}

export function deleteBuild({ uid, avatarId, buildName }) {
  return mutate("delete", "/delete", { uid, avatarId, buildName });
}

export function hideBuild({ uid, avatarId, buildName, isStatic, hide }) {
  return mutate("patch", "/hide", { uid, avatarId, buildName, isStatic, hide });
}
