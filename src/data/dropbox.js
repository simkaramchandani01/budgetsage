const STORAGE_KEY = "budgetsage_dropbox_auth";

export function getStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveAuth(auth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getAuthUrl() {
  const appKey = import.meta.env.VITE_DROPBOX_APP_KEY;
  if (!appKey) return null;
  const redirectUri = window.location.origin;
  const params = new URLSearchParams({
    response_type: "token",
    client_id: appKey,
    redirect_uri: redirectUri,
    token_access_type: "legacy",
  });
  return `https://www.dropbox.com/oauth2/authorize?${params}`;
}

// Called on app load — returns parsed token data if we just returned from OAuth
export function parseTokenFromHash() {
  if (!window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get("access_token");
  if (!token) return null;
  // Clean the hash from the URL without triggering navigation
  history.replaceState(null, "", window.location.pathname + window.location.search);
  return { token };
}

export async function listCSVFiles(token) {
  const res = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path: "", recursive: false }),
  });
  if (res.status === 401) throw new Error("TOKEN_EXPIRED");
  if (!res.ok) throw new Error(`Dropbox error ${res.status}`);
  const data = await res.json();
  return data.entries
    .filter(e => e[".tag"] === "file" && e.name.toLowerCase().endsWith(".csv"))
    .sort((a, b) => b.client_modified.localeCompare(a.client_modified));
}

export async function downloadFile(token, path) {
  const res = await fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify({ path }),
    },
  });
  if (res.status === 401) throw new Error("TOKEN_EXPIRED");
  if (!res.ok) throw new Error(`Dropbox download error ${res.status}`);
  return res.text();
}
