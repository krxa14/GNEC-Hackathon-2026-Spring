import { useEffect, useState } from "react";
import {
  getLogbookEntries,
  deleteLogbookEntry,
  type LogbookEntry,
} from "../storage/logbook";

type LogbookProps = {
  onBack: () => void;
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function Logbook({ onBack }: LogbookProps) {
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [viewing, setViewing] = useState<LogbookEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setEntries(getLogbookEntries());
  }, []);

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      deleteLogbookEntry(id);
      setEntries(getLogbookEntries());
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  }

  // ── View mode ────────────────────────────────────────────────────────────
  if (viewing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent-soft">Shadow Logbook</p>
            <h1 className="mt-2 text-2xl leading-tight">{viewing.sessionType}</h1>
            <p className="text-xs text-ink-400 mt-1">
              {formatDate(viewing.savedAt)} · {formatTime(viewing.savedAt)}
            </p>
          </div>
          <button className="btn-ghost" onClick={() => setViewing(null)}>
            Back to Logbook
          </button>
        </div>

        <div className="space-y-3">
          {viewing.turns.map((turn, i) => (
            <div
              key={i}
              className={turn.role === "user" ? "panel !bg-ink-800" : "panel"}
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-ink-300 mb-2">
                {turn.role === "user" ? "You" : "ShadowFile"}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-sm">{turn.text}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── List mode ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-accent-soft">Shadow Logbook</p>
          <h1 className="mt-2 text-3xl leading-tight">Saved sessions.</h1>
        </div>
        <button className="btn-ghost" onClick={onBack}>
          Back
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="panel text-sm text-ink-300 leading-relaxed space-y-2">
          <p>No saved sessions yet.</p>
          <p>
            After an offshift check-in, use <strong>End &amp; save</strong> to save it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="panel space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-accent-soft">
                      {entry.sessionType}
                    </span>
                    <span className="text-[10px] text-ink-500">
                      {formatDate(entry.savedAt)} · {formatTime(entry.savedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-ink-200 leading-relaxed line-clamp-2">
                    {entry.preview}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  className="btn-ghost !px-3 !py-2 text-xs"
                  onClick={() => setViewing(entry)}
                >
                  View
                </button>
                <button
                  className={
                    confirmDelete === entry.id
                      ? "text-xs text-alert hover:text-alert/80 transition-colors"
                      : "text-xs text-ink-600 hover:text-ink-300 transition-colors"
                  }
                  onClick={() => handleDelete(entry.id)}
                >
                  {confirmDelete === entry.id ? "Confirm delete" : "Delete"}
                </button>
                {confirmDelete === entry.id ? (
                  <button
                    className="text-xs text-ink-500 hover:text-ink-300 transition-colors"
                    onClick={() => setConfirmDelete(null)}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
