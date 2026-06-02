/**
 * Admin overview page — surfaces operator-only data:
 *
 *   StuckTasks   (/api/admin/stuck-tasks)  — escalated / stalled tasks
 *   DeadLetter   (/api/admin/dlq)          — Celery tasks that exhausted retries
 *   ToolKillSwitch (tool executor :8001)    — list / quarantine generated tools
 *
 * All sections poll on mount with a manual refresh button. No new APIs;
 * only consume what already exists.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  AlertOctagon,
  AlertTriangle,
  Power,
  CheckCircle2,
  ShieldOff,
  ShieldCheck,
} from "lucide-react";
import { adminApi, toolExecutorAdminApi, ExecutorTool } from "@/api";

// ── Section 1: Stuck tasks ──────────────────────────────────

interface StuckTask {
  task_id: string;
  title: string;
  status: string;
  escalation_reason?: string | null;
  updated_at: string;
  last_failure: { action: string; error: string; at: string } | null;
}

function StuckTasksSection() {
  const [tasks, setTasks] = useState<StuckTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await adminApi.getStuckTasks(100);
      setTasks(r.tasks);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="border border-gray-200 rounded-lg overflow-hidden">
      <header className="flex items-center justify-between bg-orange-50 border-b border-orange-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <h2 className="font-semibold text-gray-900">Stuck tasks</h2>
          <span className="text-xs text-gray-600">
            (escalated or stalled &gt; 1h in IN_DEVELOPMENT/TESTING)
          </span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      <div className="p-4">
        {error && (
          <p className="text-sm text-red-700 mb-3">Error: {error}</p>
        )}
        {!error && tasks.length === 0 && (
          <p className="text-sm text-gray-500">
            {loading ? "Loading…" : "Nothing stuck. Everything's flowing."}
          </p>
        )}
        {tasks.length > 0 && (
          <ul className="space-y-3">
            {tasks.map((t) => (
              <li
                key={t.task_id}
                className="border border-gray-200 rounded-md p-3 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {t.title}
                    </p>
                    <p className="text-xs font-mono text-gray-500 mt-0.5">
                      {t.task_id}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded font-mono uppercase tracking-wide">
                    {t.status}
                  </span>
                </div>
                {t.escalation_reason && (
                  <p className="text-sm text-orange-800 mt-2 whitespace-pre-wrap">
                    {t.escalation_reason}
                  </p>
                )}
                {t.last_failure && (
                  <div className="mt-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2">
                    <span className="font-semibold">{t.last_failure.action}</span>
                    {" — "}
                    <span>{t.last_failure.error}</span>
                    <span className="ml-2 text-gray-400">
                      at {new Date(t.last_failure.at).toLocaleString()}
                    </span>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  updated {new Date(t.updated_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ── Section 2: Dead-letter queue ──────────────────────────────

interface DLQItem {
  id: string;
  task_name: string;
  error: string;
  details: Record<string, unknown>;
  captured_at: string;
}

function DLQSection() {
  const [items, setItems] = useState<DLQItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await adminApi.getDeadLetterQueue(100);
      setItems(r.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="border border-gray-200 rounded-lg overflow-hidden">
      <header className="flex items-center justify-between bg-red-50 border-b border-red-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-red-600" />
          <h2 className="font-semibold text-gray-900">Dead-letter queue</h2>
          <span className="text-xs text-gray-600">
            (Celery tasks that exhausted retries)
          </span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      <div className="p-4">
        {error && <p className="text-sm text-red-700 mb-3">Error: {error}</p>}
        {!error && items.length === 0 && (
          <p className="text-sm text-gray-500">
            {loading ? "Loading…" : "Empty. No tasks have permanently failed."}
          </p>
        )}
        {items.length > 0 && (
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="border border-gray-200 rounded-md p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-gray-900 truncate">
                    {it.task_name}
                  </p>
                  <span className="text-xs text-gray-400">
                    {new Date(it.captured_at).toLocaleString()}
                  </span>
                </div>
                {it.error && (
                  <p className="text-xs text-red-700 mt-1 break-words">
                    {it.error}
                  </p>
                )}
                {it.details && Object.keys(it.details).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-600 cursor-pointer">
                      details
                    </summary>
                    <pre className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded p-2 mt-1 overflow-x-auto">
                      {JSON.stringify(it.details, null, 2)}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ── Section 3: Tool kill-switch ──────────────────────────────

function ToolKillSwitchSection() {
  const [tools, setTools] = useState<ExecutorTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [executorUp, setExecutorUp] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Health probe lets us distinguish "executor down" from "no tools yet"
      await toolExecutorAdminApi.health();
      setExecutorUp(true);
      const r = await toolExecutorAdminApi.listTools();
      setTools(r.tools);
    } catch (e) {
      setExecutorUp(false);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (name: string, currentlyQuarantined: boolean) => {
    setPending((p) => ({ ...p, [name]: true }));
    try {
      if (currentlyQuarantined) {
        await toolExecutorAdminApi.enable(name);
      } else {
        await toolExecutorAdminApi.disable(name);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending((p) => ({ ...p, [name]: false }));
    }
  };

  return (
    <section className="border border-gray-200 rounded-lg overflow-hidden">
      <header className="flex items-center justify-between bg-blue-50 border-b border-blue-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Power className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Tool kill-switch</h2>
          <span className="text-xs text-gray-600">(Tool Executor :8001)</span>
        </div>
        <div className="flex items-center gap-3">
          {executorUp === false && (
            <span className="text-xs text-red-600 font-semibold">
              Executor unreachable
            </span>
          )}
          {executorUp === true && (
            <span className="text-xs text-green-700 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Executor up
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      <div className="p-4">
        {error && executorUp === false && (
          <p className="text-sm text-red-700 mb-3">
            Cannot reach the Tool Executor at :8001 — make sure it's running.
            Error: {error}
          </p>
        )}
        {executorUp && tools.length === 0 && (
          <p className="text-sm text-gray-500">
            No generated tools deployed yet.
          </p>
        )}
        {tools.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Risk</th>
                <th className="py-2 pr-4">Version</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((t) => {
                const m = t.manifest as Record<string, unknown> & {
                  risk?: string;
                  version?: string;
                  error?: string;
                };
                const isPending = Boolean(pending[t.name]);
                return (
                  <tr
                    key={t.name}
                    className="border-t border-gray-100"
                  >
                    <td className="py-2 pr-4 font-mono">{t.name}</td>
                    <td className="py-2 pr-4">{m.risk ?? "?"}</td>
                    <td className="py-2 pr-4">{m.version ?? "?"}</td>
                    <td className="py-2 pr-4">
                      {t.quarantined ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-semibold">
                          <ShieldOff className="w-3 h-3" /> QUARANTINED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-semibold">
                          <ShieldCheck className="w-3 h-3" /> ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => toggle(t.name, t.quarantined)}
                        disabled={isPending}
                        className={`px-3 py-1 text-xs rounded ${
                          t.quarantined
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-red-600 hover:bg-red-700 text-white"
                        } disabled:opacity-50`}
                      >
                        {isPending
                          ? "..."
                          : t.quarantined
                            ? "Re-enable"
                            : "Disable"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

// ── Page shell ──────────────────────────────────────────────

export default function AdminContent() {
  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="text-gray-600 mt-1">
          Operational surfaces: stuck tasks, dead-letter queue, and tool
          kill-switch. All actions take effect immediately.
        </p>
      </div>

      <StuckTasksSection />
      <DLQSection />
      <ToolKillSwitchSection />
    </div>
  );
}
