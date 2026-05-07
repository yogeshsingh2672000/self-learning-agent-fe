/**
 * Tasks page — Phase 3
 *
 * Full human-in-the-loop approval dashboard:
 * - Table of tasks with status filter tabs
 * - Priority score + AI rationale
 * - Approve / Reject with optional comment
 * - Upvote button
 * - Task detail slide-over panel with acceptance criteria
 * - Run Task Manager Agent enrichment
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  ChevronUp,
  Loader2,
  AlertCircle,
  ChevronRight,
  X,
  RefreshCw,
  Plus,
  Clock,
  Zap,
  CheckCheck,
  Ban,
  GitBranch,
  ExternalLink,
} from "lucide-react";
import { tasksApi } from "@/api";
import { Task, TaskStatus } from "@/types";
import { AuditTrailPanel } from "./AuditTrailPanel";

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending_approval: "Pending Approval",
  approved: "Approved",
  in_development: "In Development",
  testing: "Testing",
  in_review: "In Review",
  deployed: "Deployed",
  rejected: "Rejected",
  escalated: "Escalated",
};

const STATUS_COLORS: Record<string, string> = {
  pending_approval: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  in_development: "bg-blue-100 text-blue-800 border-blue-200",
  testing: "bg-purple-100 text-purple-800 border-purple-200",
  in_review: "bg-indigo-100 text-indigo-800 border-indigo-200",
  deployed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  escalated: "bg-orange-100 text-orange-800 border-orange-200",
};

const PRIORITY_COLOR = (score: number | null): string => {
  if (score === null || score === undefined) return "text-gray-400";
  if (score >= 7) return "text-red-600 font-bold";
  if (score >= 4) return "text-yellow-600 font-semibold";
  return "text-green-600";
};

// ── Filter tabs ────────────────────────────────────────────────────────────────

const TABS: { label: string; value: string | null }[] = [
  { label: "All", value: null },
  { label: "Pending", value: "pending_approval" },
  { label: "Approved", value: "approved" },
  { label: "In Development", value: "in_development" },
  { label: "Testing", value: "testing" },
  { label: "In Review", value: "in_review" },
  { label: "Pending Deployment", value: "pending_deployment" },
  { label: "Deployed", value: "deployed" },
  { label: "Escalated", value: "escalated" },
  { label: "Rejected", value: "rejected" },
  { label: "Audit & Metrics", value: "audit" },
];

// ── Execution log component ────────────────────────────────────────────────────

interface ExecutionLog {
  id: string;
  agent_type: "query" | "task_manager" | "coding" | "testing";
  action: string;
  status: "success" | "failure" | "in_progress";
  details: Record<string, any>;
  error_message: string | null;
  timestamp: string;
}

function ExecutionLogs({ taskId }: { taskId: string }) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const fetchLogs = async () => {
      try {
        const response = await tasksApi.getExecutionLog(taskId, 50, 0);
        setLogs(response.logs);
        setError(null);
      } catch (err) {
        setError("Failed to load execution logs");
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchLogs();

    // Poll every 2 seconds
    intervalId = setInterval(fetchLogs, 2000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [taskId]);

  if (isLoading) {
    return <Loader2 className="w-4 h-4 animate-spin text-gray-500" />;
  }

  if (error) {
    return <p className="text-xs text-red-600">{error}</p>;
  }

  if (logs.length === 0) {
    return <p className="text-xs text-gray-400">No execution logs yet</p>;
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const icon =
          log.status === "success" ? (
            <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
          ) : log.status === "failure" ? (
            <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          ) : (
            <Loader2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 animate-spin" />
          );

        return (
          <div key={log.id} className="flex gap-2 text-xs">
            {icon}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-700">{log.action}</p>
              <p className="text-gray-500 text-xs">
                {new Date(log.timestamp).toLocaleTimeString()}
              </p>
              {log.error_message && (
                <p className="text-red-600 mt-1 break-words">
                  {log.error_message}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Test Results component ─────────────────────────────────────────────────────

function TestResults({ taskId }: { taskId: string }) {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof tasksApi.getTestResults>
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const fetchResults = async () => {
      try {
        const response = await tasksApi.getTestResults(taskId);
        setData(response);
        setError(null);
      } catch {
        setError("Failed to load test results");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
    // Poll every 3 seconds while tests may still be running
    intervalId = setInterval(fetchResults, 3000);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [taskId]);

  if (isLoading) {
    return <Loader2 className="w-4 h-4 animate-spin text-gray-500" />;
  }

  if (error) {
    return <p className="text-xs text-red-600">{error}</p>;
  }

  const feature = data?.feature;
  const tr = feature?.test_results;

  if (!feature || !tr) {
    return <p className="text-xs text-gray-400">No test results yet</p>;
  }

  const coverageColor =
    tr.coverage_percent >= 80
      ? "text-green-600"
      : tr.coverage_percent >= 50
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="space-y-3">
      {/* Summary row */}
      <div className="flex items-center gap-4 text-sm">
        <span
          className={`flex items-center gap-1 font-semibold ${tr.passed ? "text-green-600" : "text-red-600"}`}
        >
          {tr.passed ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {tr.passed ? "PASS" : "FAIL"}
        </span>
        <span className="text-gray-600">
          {tr.passed_count}/{tr.total} tests passed
        </span>
        <span className={`font-medium ${coverageColor}`}>
          {tr.coverage_percent.toFixed(1)}% coverage
        </span>
        {feature.retry_count > 0 && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-200">
            Attempt {feature.retry_count + 1}
          </span>
        )}
      </div>

      {/* Coverage bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${
            tr.coverage_percent >= 80
              ? "bg-green-500"
              : tr.coverage_percent >= 50
                ? "bg-yellow-500"
                : "bg-red-500"
          }`}
          style={{ width: `${Math.min(tr.coverage_percent, 100)}%` }}
        />
      </div>

      {/* Per-test list */}
      {tr.tests.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {tr.tests.map((t, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {t.outcome === "passed" ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-mono text-gray-700 truncate">
                  {t.name.split("::").pop()}
                </p>
                {t.message && (
                  <p className="text-red-600 mt-0.5 line-clamp-2">
                    {t.message}
                  </p>
                )}
              </div>
              <span className="text-gray-400 flex-shrink-0">
                {t.duration.toFixed(2)}s
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bug report (when tests failed) */}
      {!tr.passed && tr.bug_report && (
        <div className="bg-red-50 border border-red-200 rounded p-3 space-y-2">
          <p className="text-xs font-semibold text-red-700">Bug Report</p>
          <p className="text-xs text-red-600">{tr.bug_report.summary}</p>
          {tr.bug_report.root_cause && (
            <p className="text-xs text-red-500">{tr.bug_report.root_cause}</p>
          )}
          {tr.bug_report.suggested_fixes?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-700 mb-1">
                Suggested fixes:
              </p>
              <ul className="space-y-0.5">
                {tr.bug_report.suggested_fixes.map((fix, i) => (
                  <li key={i} className="text-xs text-red-600 flex gap-1">
                    <span className="flex-shrink-0">•</span>
                    {fix}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Escalation notice */}
      {data?.task_status === "escalated" && (
        <div className="bg-orange-50 border border-orange-200 rounded p-3 flex gap-2">
          <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-orange-700">
              Escalated — Human Review Required
            </p>
            {data.escalation_reason && (
              <p className="text-xs text-orange-600 mt-0.5">
                {data.escalation_reason}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── PR status component (Phase 6) ──────────────────────────────────────────────

function PRStatus({ taskId }: { taskId: string }) {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof tasksApi.getPRStatus>
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPRStatus = async () => {
      try {
        const response = await tasksApi.getPRStatus(taskId);
        setData(response);
        setError(null);
      } catch {
        setError("Failed to load PR status");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPRStatus();
    // Poll every 5 seconds for PR status updates
    const intervalId = setInterval(fetchPRStatus, 5000);
    return () => clearInterval(intervalId);
  }, [taskId]);

  if (isLoading) {
    return <Loader2 className="w-4 h-4 animate-spin text-gray-500" />;
  }

  if (error || !data?.pr_url) {
    return <p className="text-xs text-gray-400">No PR created yet</p>;
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    open: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    merged: "bg-emerald-100 text-emerald-700",
  };

  const statusColor =
    statusColors[data.pr_status || ""] || "bg-gray-100 text-gray-700";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">GitHub PR</span>
        <a
          href={data.pr_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          #{data.pr_number}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor}`}
        >
          {data.pr_status?.toUpperCase() || "UNKNOWN"}
        </span>
        {data.merged && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            ✓ Merged
          </span>
        )}
      </div>
    </div>
  );
}

// ── Task detail panel ──────────────────────────────────────────────────────────

interface DetailPanelProps {
  task: Task;
  onClose: () => void;
  onApprove: (id: string, comment: string) => Promise<void>;
  onReject: (id: string, comment: string) => Promise<void>;
  onVote: (id: string) => Promise<void>;
  onProcess: (id: string) => Promise<void>;
  actionLoading: string | null;
}

function TaskDetailPanel({
  task,
  onClose,
  onApprove,
  onReject,
  onVote,
  onProcess,
  actionLoading,
}: DetailPanelProps) {
  const [comment, setComment] = useState("");
  const isPending = task.status === TaskStatus.PENDING_APPROVAL;
  const isRejected = task.status === TaskStatus.REJECTED;
  const loading = actionLoading === task.id;

  // Parse acceptance criteria
  let criteria: string[] = [];
  if (Array.isArray(task.acceptance_criteria)) {
    criteria = task.acceptance_criteria;
  } else if (typeof task.acceptance_criteria === "string") {
    try {
      criteria = JSON.parse(task.acceptance_criteria);
    } catch {
      criteria = [task.acceptance_criteria];
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-xl bg-white shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <div className="flex-1 pr-4">
            <h2 className="text-lg font-semibold text-gray-900 leading-snug">
              {task.title}
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  STATUS_COLORS[task.status] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {STATUS_LABELS[task.status] ?? task.status}
              </span>
              {task.priority_score !== null && (
                <span
                  className={`text-sm ${PRIORITY_COLOR(task.priority_score)}`}
                >
                  Priority: {task.priority_score?.toFixed(1)} / 10
                </span>
              )}
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <ChevronUp className="w-4 h-4" />
                {task.vote_count} vote{task.vote_count !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Description
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>

          {/* Acceptance Criteria */}
          {criteria.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Acceptance Criteria
              </h3>
              <ul className="space-y-1.5">
                {criteria.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <CheckCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Required capabilities */}
          {task.required_capabilities?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Required Capabilities
              </h3>
              <div className="flex flex-wrap gap-2">
                {task.required_capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Execution logs (Phase 4 - during development) */}
          {[
            TaskStatus.IN_DEVELOPMENT,
            TaskStatus.TESTING,
            TaskStatus.IN_REVIEW,
            TaskStatus.DEPLOYED,
          ].includes(task.status) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                Agent Execution
              </h3>
              <div className="bg-gray-50 rounded p-3 border border-gray-100">
                <ExecutionLogs taskId={task.id} />
              </div>
            </div>
          )}

          {/* Test results (Phase 5 - testing, in_review, deployed, escalated) */}
          {[
            TaskStatus.TESTING,
            TaskStatus.IN_REVIEW,
            TaskStatus.DEPLOYED,
            TaskStatus.ESCALATED,
          ].includes(task.status) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-purple-600" />
                Test Results
              </h3>
              <div className="bg-gray-50 rounded p-3 border border-gray-100">
                <TestResults taskId={task.id} />
              </div>
            </div>
          )}

          {/* PR Status (Phase 6) */}
          {[
            TaskStatus.IN_REVIEW,
            TaskStatus.PENDING_DEPLOYMENT,
            TaskStatus.DEPLOYED,
          ].includes(task.status) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-600" />
                GitHub Pull Request
              </h3>
              <div className="bg-gray-50 rounded p-3 border border-gray-100">
                <PRStatus taskId={task.id} />
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-gray-400 space-y-1 border-t pt-3">
            <p>Requested by: {task.requested_by || "—"}</p>
            <p>Created: {new Date(task.created_at).toLocaleString()}</p>
            {task.approved_at && (
              <p>Approved: {new Date(task.approved_at).toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Actions footer */}
        <div className="border-t border-gray-200 p-5 space-y-3">
          {/* Comment field (only for pending) */}
          {isPending && (
            <textarea
              placeholder="Optional comment for approval / rejection…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="text-black w-full text-sm border border-gray-300 rounded px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          <div className="flex flex-wrap gap-2">
            {/* Upvote */}
            {!isRejected && (
              <button
                onClick={() => onVote(task.id)}
                disabled={!!actionLoading}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
                Upvote ({task.vote_count})
              </button>
            )}

            {/* Enrich with AI (only if no priority yet) */}
            {isPending && task.priority_score === null && (
              <button
                onClick={() => onProcess(task.id)}
                disabled={!!actionLoading}
                className="flex items-center gap-1 px-3 py-2 text-sm border border-purple-300 text-purple-700 rounded hover:bg-purple-50 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                AI Enrich
              </button>
            )}

            {/* Approve */}
            {isPending && (
              <button
                onClick={() => onApprove(task.id, comment)}
                disabled={!!actionLoading}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Approve
              </button>
            )}

            {/* Reject */}
            {isPending && (
              <button
                onClick={() => onReject(task.id, comment)}
                disabled={!!actionLoading}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TasksContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load tasks whenever tab changes
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await tasksApi.listTasks(0, 100, activeTab ?? undefined);
      setTasks(res.tasks);
      setTotal(res.total);
    } catch {
      setError("Failed to load tasks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Flash a success message
  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Approve
  const handleApprove = async (id: string, comment: string) => {
    setActionLoading(id);
    try {
      const updated = await tasksApi.approveTask(id, comment);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (selectedTask?.id === id) setSelectedTask(updated);
      flash("Task approved successfully.");
    } catch {
      setError("Failed to approve task.");
    } finally {
      setActionLoading(null);
    }
  };

  // Reject
  const handleReject = async (id: string, comment: string) => {
    setActionLoading(id);
    try {
      const updated = await tasksApi.rejectTask(id, comment);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (selectedTask?.id === id) setSelectedTask(updated);
      flash("Task rejected.");
    } catch {
      setError("Failed to reject task.");
    } finally {
      setActionLoading(null);
    }
  };

  // Upvote
  const handleVote = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await tasksApi.voteTask(id);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, vote_count: res.vote_count } : t,
        ),
      );
      if (selectedTask?.id === id)
        setSelectedTask((prev) =>
          prev ? { ...prev, vote_count: res.vote_count } : prev,
        );
      flash("Vote registered!");
    } catch {
      setError("Failed to vote.");
    } finally {
      setActionLoading(null);
    }
  };

  // AI enrich (process)
  const handleProcess = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await tasksApi.processTask(id);
      const updated = res.task;
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (selectedTask?.id === id) setSelectedTask(updated);
      if (res.is_duplicate) {
        flash(`Marked as duplicate of task ${res.duplicate_id?.slice(0, 8)}…`);
      } else {
        flash("Task enriched with AI analysis.");
      }
    } catch {
      setError("Failed to run AI enrichment.");
    } finally {
      setActionLoading(null);
    }
  };

  // Status summary counts
  const pendingCount = tasks.filter(
    (t) => t.status === TaskStatus.PENDING_APPROVAL,
  ).length;
  const approvedCount = tasks.filter(
    (t) => t.status === TaskStatus.APPROVED,
  ).length;
  const devCount = tasks.filter(
    (t) => t.status === TaskStatus.IN_DEVELOPMENT,
  ).length;
  const deployedCount = tasks.filter(
    (t) => t.status === TaskStatus.DEPLOYED,
  ).length;
  const escalatedCount = tasks.filter(
    (t) => t.status === TaskStatus.ESCALATED,
  ).length;
  const pendingDeploymentCount = tasks.filter(
    (t) => t.status === TaskStatus.PENDING_DEPLOYMENT,
  ).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">
            Review, prioritize, and approve AI-detected capability improvements.
          </p>
        </div>
        <button
          onClick={loadTasks}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">{successMsg}</p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          {
            label: "Pending Approval",
            count: pendingCount,
            icon: Clock,
            color: "text-yellow-600",
          },
          {
            label: "Approved",
            count: approvedCount,
            icon: CheckCircle,
            color: "text-green-600",
          },
          {
            label: "In Development",
            count: devCount,
            icon: Zap,
            color: "text-blue-600",
          },
          {
            label: "Pending Deployment",
            count: pendingDeploymentCount,
            icon: Clock,
            color: "text-indigo-600",
          },
          {
            label: "Deployed",
            count: deployedCount,
            icon: CheckCheck,
            color: "text-emerald-600",
          },
          {
            label: "Escalated",
            count: escalatedCount,
            icon: AlertCircle,
            color: "text-orange-600",
          },
        ].map(({ label, count, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-lg p-5 border border-gray-200"
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-sm text-gray-500">{label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.value
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task table or Audit Dashboard */}
      {activeTab === "audit" ? (
        <AuditTrailPanel />
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Ban className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No tasks found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                  Votes
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">
                  Requested by
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task) => {
                const isPending = task.status === TaskStatus.PENDING_APPROVAL;
                const isRejected = task.status === TaskStatus.REJECTED;
                const loading = actionLoading === task.id;

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedTask(task)}
                  >
                    {/* Title */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {task.description.slice(0, 80)}…
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                          STATUS_COLORS[task.status] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {STATUS_LABELS[task.status] ?? task.status}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span
                        className={`text-sm ${PRIORITY_COLOR(task.priority_score)}`}
                      >
                        {task.priority_score !== null
                          ? `${task.priority_score.toFixed(1)}`
                          : "—"}
                      </span>
                    </td>

                    {/* Votes */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">
                        {task.vote_count}
                      </span>
                    </td>

                    {/* Requested by */}
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-gray-500">
                        {task.requested_by || "—"}
                      </span>
                    </td>

                    {/* Inline actions — stop propagation so clicks don't open panel */}
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        {/* Upvote */}
                        {!isRejected && (
                          <button
                            title="Upvote"
                            disabled={!!actionLoading}
                            onClick={() => handleVote(task.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-40"
                          >
                            {loading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {/* Approve */}
                        {isPending && (
                          <button
                            title="Approve"
                            disabled={!!actionLoading}
                            onClick={() => handleApprove(task.id, "")}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-40"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Reject */}
                        {isPending && (
                          <button
                            title="Reject"
                            disabled={!!actionLoading}
                            onClick={() => handleReject(task.id, "")}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-40"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Open detail */}
                        <button
                          title="View details"
                          onClick={() => setSelectedTask(task)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer row */}
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {tasks.length} of {total} tasks
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onVote={handleVote}
          onProcess={handleProcess}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}
