import { useState, useEffect, useRef } from "react";
import { Cloud, CloudOff, RefreshCw, Unlink, AlertCircle } from "lucide-react";
import {
  getStoredAuth, saveAuth, clearAuth,
  getAuthUrl, parseTokenFromHash,
  listCSVFiles, downloadFile,
} from "../data/dropbox.js";
import { parseAppleWalletCSV } from "../data/appleWallet.js";

export default function DropboxSync({ onImport }) {
  const [auth, setAuth]       = useState(() => getStoredAuth());
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(() => getStoredAuth()?.lastSync ?? null);
  const [newCount, setNewCount] = useState(null);
  const [error, setError]     = useState("");
  const didMount = useRef(false);

  useEffect(() => {
    if (didMount.current) return;
    didMount.current = true;

    const fromOAuth = parseTokenFromHash();
    if (fromOAuth) {
      const fresh = { token: fromOAuth.token, importedIds: [], lastSync: null };
      saveAuth(fresh);
      setAuth(fresh);
      runSync(fromOAuth.token, []);
    } else if (auth?.token) {
      runSync(auth.token, auth.importedIds ?? []);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function runSync(token, alreadyImported) {
    setSyncing(true);
    setError("");
    setNewCount(null);
    try {
      const files = await listCSVFiles(token);
      const fresh = files.filter(f => !alreadyImported.includes(f.id));

      let imported = 0;
      const updatedIds = [...alreadyImported];

      for (const file of fresh) {
        const text = await downloadFile(token, file.path_lower);
        const { rows } = parseAppleWalletCSV(text);
        if (rows.length) {
          const clean = rows.map(({ _original, ...r }) => r);
          onImport(clean);
          imported += rows.length;
        }
        updatedIds.push(file.id);
      }

      const now = new Date().toISOString();
      const updated = { token, importedIds: updatedIds, lastSync: now };
      saveAuth(updated);
      setAuth(updated);
      setLastSync(now);
      setNewCount(imported);
    } catch (err) {
      if (err.message === "TOKEN_EXPIRED") {
        clearAuth();
        setAuth(null);
        setError("Session expired — please reconnect.");
      } else {
        setError(err.message);
      }
    } finally {
      setSyncing(false);
    }
  }

  function handleConnect() {
    const url = getAuthUrl();
    if (!url) {
      setError("Add VITE_DROPBOX_APP_KEY to your .env file first.");
      return;
    }
    window.location.href = url;
  }

  function handleDisconnect() {
    clearAuth();
    setAuth(null);
    setNewCount(null);
    setError("");
  }

  function handleSyncNow() {
    if (!auth?.token || syncing) return;
    runSync(auth.token, auth.importedIds ?? []);
  }

  const fmtTime = (iso) => {
    if (!iso) return "Never";
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60)  return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="dbx-root">
        <div className="dbx-label">Dropbox Sync</div>

        {!auth ? (
          <button className="dbx-connect-btn" onClick={handleConnect}>
            <Cloud size={13} />
            Connect Dropbox
          </button>
        ) : (
          <div className="dbx-connected">
            <div className="dbx-status-row">
              <span className={`dbx-dot${syncing ? " dbx-dot--spin" : ""}`}>
                {syncing
                  ? <RefreshCw size={11} />
                  : <Cloud size={11} />
                }
              </span>
              <span className="dbx-status-text">
                {syncing ? "Syncing…" : `Synced ${fmtTime(lastSync)}`}
              </span>
              <button
                className="dbx-sync-btn"
                onClick={handleSyncNow}
                disabled={syncing}
                aria-label="Sync now"
              >
                <RefreshCw size={12} className={syncing ? "dbx-spinning" : ""} />
              </button>
            </div>

            {newCount !== null && newCount > 0 && (
              <div className="dbx-new-badge">
                +{newCount} transaction{newCount !== 1 ? "s" : ""} imported
              </div>
            )}
            {newCount === 0 && !syncing && (
              <div className="dbx-up-to-date">Up to date</div>
            )}

            <button className="dbx-disconnect-btn" onClick={handleDisconnect}>
              <Unlink size={11} />
              Disconnect
            </button>
          </div>
        )}

        {error && (
          <div className="dbx-error">
            <AlertCircle size={11} />
            {error}
          </div>
        )}
      </div>
    </>
  );
}

const styles = `
  .dbx-root {
    margin-top: 10px;
    padding: 11px 13px;
    background: #0f0e0d;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.06);
  }

  .dbx-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #555;
    margin-bottom: 9px;
  }

  .dbx-connect-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    color: #a09890;
    font-size: 12.5px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }

  .dbx-connect-btn:hover {
    border-color: rgba(212,168,67,0.4);
    color: #d4a843;
  }

  .dbx-connected {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .dbx-status-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dbx-dot {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4caf8a;
    flex-shrink: 0;
  }

  .dbx-status-text {
    flex: 1;
    font-size: 12px;
    color: #a09890;
  }

  .dbx-sync-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    color: #666;
    cursor: pointer;
    border-radius: 6px;
    transition: color 0.12s, background 0.12s;
    flex-shrink: 0;
  }

  .dbx-sync-btn:hover:not(:disabled) {
    color: #d4a843;
    background: rgba(212,168,67,0.08);
  }

  .dbx-sync-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .dbx-spinning {
    animation: dbx-spin 0.8s linear infinite;
  }

  @keyframes dbx-spin {
    to { transform: rotate(360deg); }
  }

  .dbx-new-badge {
    font-size: 11px;
    color: #4caf8a;
    padding-left: 17px;
  }

  .dbx-up-to-date {
    font-size: 11px;
    color: #444;
    padding-left: 17px;
  }

  .dbx-disconnect-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: transparent;
    border: none;
    color: #444;
    font-size: 11px;
    font-family: inherit;
    cursor: pointer;
    padding: 0;
    padding-left: 17px;
    transition: color 0.12s;
  }

  .dbx-disconnect-btn:hover {
    color: #e07060;
  }

  .dbx-error {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    margin-top: 7px;
    font-size: 11px;
    color: #e07060;
    line-height: 1.4;
  }
`;
