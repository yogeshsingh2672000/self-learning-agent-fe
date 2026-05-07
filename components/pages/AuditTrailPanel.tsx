import { useState, useEffect } from "react";
import { AlertCircle, TrendingUp, Zap, Lock } from "lucide-react";
import { adminApi } from "@/api";

interface AuditLog {
  id: string;
  agent_type: string;
  task_id: string | null;
  action: string;
  status: string;
  created_at: string;
  details: Record<string, any>;
  error_message?: string;
}

interface DailyReport {
  date: string;
  tasks: Record<string, number>;
  costs: {
    tokens_used: number;
    budget_remaining: number;
    cost_usd: number;
    percent_used: number;
    is_over_budget: boolean;
  };
  rate_limit: {
    current_count: number;
    remaining: number;
    is_limited: boolean;
  };
  circuit_breaker: {
    escalations_count: number;
    failure_threshold: number;
  };
  notifications: {
    sent_today: number;
  };
}

export function AuditTrailPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "success" | "failure"
  >("all");

  useEffect(() => {
    loadAuditData();
  }, []);

  const loadAuditData = async () => {
    setLoading(true);
    try {
      const [logsRes, reportRes] = await Promise.all([
        adminApi.getAuditTrail(100, 0),
        adminApi.getDailyReport(),
      ]);

      let logs = logsRes.logs || [];

      if (statusFilter !== "all") {
        logs = logs.filter((log: AuditLog) =>
          statusFilter === "success"
            ? log.status === "success"
            : log.status === "failure",
        );
      }

      setLogs(logs);
      setDailyReport(reportRes);
    } catch (error) {
      console.error("Failed to load audit data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return "text-green-600 bg-green-50 border-green-200";
      case "failure":
        return "text-red-600 bg-red-50 border-red-200";
      case "in_progress":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getAgentTypeColor = (agentType: string) => {
    const colors: Record<string, string> = {
      query: "bg-blue-100 text-blue-800",
      coding: "bg-purple-100 text-purple-800",
      testing: "bg-green-100 text-green-800",
      default: "bg-gray-100 text-gray-800",
    };
    return colors[agentType] || colors.default;
  };

  return (
    <div className="space-y-6">
      {/* Daily Report Summary */}
      {dailyReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cost Tracking */}
          <div
            className={`p-4 rounded-lg border-2 ${
              dailyReport.costs.is_over_budget
                ? "border-red-300 bg-red-50"
                : dailyReport.costs.percent_used > 75
                  ? "border-yellow-300 bg-yellow-50"
                  : "border-blue-300 bg-blue-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Token Budget
                </p>
                <p
                  className={`text-2xl font-bold ${
                    dailyReport.costs.is_over_budget
                      ? "text-red-600"
                      : dailyReport.costs.percent_used > 75
                        ? "text-yellow-600"
                        : "text-blue-600"
                  }`}
                >
                  {dailyReport.costs.percent_used.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  ${dailyReport.costs.cost_usd} / $
                  {(dailyReport.costs.tokens_used +
                    dailyReport.costs.budget_remaining) *
                    0.00002}
                </p>
              </div>
              <Zap
                className={`w-8 h-8 ${
                  dailyReport.costs.is_over_budget
                    ? "text-red-600"
                    : "text-orange-600"
                }`}
              />
            </div>
          </div>

          {/* Rate Limiting */}
          <div
            className={`p-4 rounded-lg border-2 ${
              dailyReport.rate_limit.is_limited
                ? "border-red-300 bg-red-50"
                : "border-green-300 bg-green-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Gap Tasks Today
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {dailyReport.rate_limit.current_count}/{10}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {dailyReport.rate_limit.remaining} remaining
                </p>
              </div>
              <Lock className="w-8 h-8 text-gray-600" />
            </div>
          </div>

          {/* Circuit Breaker */}
          <div
            className={`p-4 rounded-lg border-2 ${
              dailyReport.circuit_breaker.escalations_count > 0
                ? "border-red-300 bg-red-50"
                : "border-green-300 bg-green-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Escalations Today
                </p>
                <p
                  className={`text-2xl font-bold ${
                    dailyReport.circuit_breaker.escalations_count > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {dailyReport.circuit_breaker.escalations_count}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Threshold: {dailyReport.circuit_breaker.failure_threshold}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Notifications */}
          <div className="p-4 rounded-lg border-2 border-purple-300 bg-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Notifications Sent
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {dailyReport.notifications.sent_today}
                </p>
                <p className="text-xs text-gray-600 mt-1">Today</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Audit Trail</h3>
          <button
            onClick={loadAuditData}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search by action..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-black flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-black px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Time
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Agent
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Action
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Status
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-gray-500"
                  >
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs
                  .filter(
                    (log) =>
                      filter === "" ||
                      log.action.toLowerCase().includes(filter.toLowerCase()),
                  )
                  .map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-3 py-2 text-gray-600">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getAgentTypeColor(log.agent_type)}`}
                        >
                          {log.agent_type}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900">
                        {log.action}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(log.status)}`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {log.error_message ? (
                          <span className="text-red-600">
                            {log.error_message}
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            {Object.keys(log.details).slice(0, 2).join(", ")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Showing {logs.length} recent audit log entries
        </div>
      </div>
    </div>
  );
}
