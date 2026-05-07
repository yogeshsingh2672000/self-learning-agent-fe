/**
 * API service functions for backend communication
 */
import apiClient from "@/lib/api-client";
import {
  User,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  Task,
  TaskCreateRequest,
  ApiListResponse,
} from "@/types";

// Auth endpoints
export const authApi = {
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await apiClient.post<User>("/api/auth/register", data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>("/api/auth/login", data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>("/api/auth/me");
    return response.data;
  },
};

// Task endpoints
export const tasksApi = {
  listTasks: async (
    skip: number = 0,
    limit: number = 100,
    taskStatus?: string
  ): Promise<{ tasks: Task[]; total: number; limit: number; offset: number }> => {
    const response = await apiClient.get<{ tasks: Task[]; total: number; limit: number; offset: number }>(
      "/api/tasks",
      { params: { offset: skip, limit, ...(taskStatus && { status: taskStatus }) } }
    );
    return response.data;
  },

  getTask: async (taskId: string): Promise<Task> => {
    const response = await apiClient.get<Task>(`/api/tasks/${taskId}`);
    return response.data;
  },

  createTask: async (data: TaskCreateRequest): Promise<Task> => {
    const response = await apiClient.post<Task>("/api/tasks", data);
    return response.data;
  },

  approveTask: async (taskId: string, comment?: string): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/api/tasks/${taskId}/approve`, {
      comment: comment || null,
    });
    return response.data;
  },

  rejectTask: async (taskId: string, comment?: string): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/api/tasks/${taskId}/reject`, {
      comment: comment || null,
    });
    return response.data;
  },

  voteTask: async (taskId: string): Promise<{ vote_count: number; task_id: string }> => {
    const response = await apiClient.post<{ vote_count: number; task_id: string }>(
      `/api/tasks/${taskId}/vote`
    );
    return response.data;
  },

  retriggerTask: async (taskId: string): Promise<{ retriggered: boolean; task_id: string; status: string }> => {
    const response = await apiClient.post<{ retriggered: boolean; task_id: string; status: string }>(
      `/api/tasks/${taskId}/retrigger`
    );
    return response.data;
  },

  processTask: async (
    taskId: string
  ): Promise<{ processed: boolean; is_duplicate: boolean; duplicate_id?: string; task: Task }> => {
    const response = await apiClient.post<{
      processed: boolean;
      is_duplicate: boolean;
      duplicate_id?: string;
      task: Task;
    }>(`/api/tasks/process`, null, { params: { task_id: taskId } });
    return response.data;
  },

  getExecutionLog: async (
    taskId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    logs: Array<{
      id: string;
      agent_type: "query" | "task_manager" | "coding" | "testing";
      action: string;
      status: "success" | "failure" | "in_progress";
      details: Record<string, any>;
      error_message: string | null;
      timestamp: string;
    }>;
    total: number;
    limit: number;
    offset: number;
    task_status: string;
  }> => {
    const response = await apiClient.get<any>(
      `/api/tasks/${taskId}/execution-log`,
      { params: { limit, offset } }
    );
    return response.data;
  },

  getTestResults: async (
    taskId: string
  ): Promise<{
    task_id: string;
    task_status: string;
    escalation_reason: string | null;
    feature: {
      id: string;
      branch_name: string | null;
      tool_name: string | null;
      status: string;
      retry_count: number;
      test_results: {
        passed: boolean;
        total: number;
        passed_count: number;
        failed_count: number;
        coverage_percent: number;
        tests: Array<{
          name: string;
          outcome: "passed" | "failed" | "error" | "skipped";
          duration: number;
          message: string;
        }>;
        bug_report: {
          summary: string;
          failing_tests: Array<{ name: string; message: string }>;
          suggested_fixes: string[];
          root_cause: string;
        } | null;
        stdout: string;
        stderr: string;
      } | null;
    } | null;
  }> => {
    const response = await apiClient.get<any>(`/api/tasks/${taskId}/test-results`);
    return response.data;
  },

  getPRStatus: async (
    taskId: string
  ): Promise<{
    task_id: string;
    pr_url: string | null;
    pr_number: number | null;
    pr_status: string | null;
    merged: boolean;
  }> => {
    const response = await apiClient.get<any>(`/api/tasks/${taskId}/pr-status`);
    return response.data;
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<{ status: string; database: string }> => {
    const response = await apiClient.get<{ status: string; database: string }>("/health");
    return response.data;
  },
};

// Chat endpoints
export interface ChatMessage {
  id: string;
  role: "user" | "agent" | "system";
  message: string;
  timestamp: string;
  is_capability_gap?: boolean;
  gap_description?: string;
  suggested_tool?: string;
  task_id?: string;
}

export interface ChatResponse {
  agent_response: string;
  gap_detected: boolean;
  task_created?: {
    id: string;
    title: string;
    status: string;
    created_at: string;
  };
  session_id: string;
  user_message_id: string;
  agent_message_id: string;
  timestamp: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  total: number;
  session_id: string;
  limit: number;
  offset: number;
}

export interface ChatSessionsResponse {
  sessions: Array<{
    session_id: string;
    message_count: number;
    last_message: string | null;
  }>;
  total: number;
}

export const chatApi = {
  sendMessage: async (
    message: string,
    sessionId?: string
  ): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>("/api/chat/", null, {
      params: {
        message,
        ...(sessionId && { session_id: sessionId }),
      },
    });
    return response.data;
  },

  getHistory: async (
    sessionId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ChatHistoryResponse> => {
    const response = await apiClient.get<ChatHistoryResponse>("/api/chat/history", {
      params: {
        ...(sessionId && { session_id: sessionId }),
        limit,
        offset,
      },
    });
    return response.data;
  },

  getSessions: async (limit: number = 20): Promise<ChatSessionsResponse> => {
    const response = await apiClient.get<ChatSessionsResponse>("/api/chat/sessions", {
      params: { limit },
    });
    return response.data;
  },

  deleteMessage: async (messageId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(
      `/api/chat/${messageId}`
    );
    return response.data;
  },
};

// Admin / Audit endpoints (Phase 8)
export const adminApi = {
  getAuditTrail: async (
    limit: number = 100,
    offset: number = 0,
    taskId?: string,
    agentType?: string,
    status?: string
  ): Promise<{
    total: number;
    limit: number;
    offset: number;
    logs: Array<{
      id: string;
      agent_type: string;
      task_id: string | null;
      action: string;
      status: string;
      created_at: string;
      details: Record<string, any>;
      error_message?: string;
    }>;
  }> => {
    const response = await apiClient.get<any>("/api/admin/audit-trail", {
      params: { limit, offset, ...(taskId && { task_id: taskId }), ...(agentType && { agent_type: agentType }), ...(status && { status }) },
    });
    return response.data;
  },

  getTaskAuditTrail: async (
    taskId: string
  ): Promise<{
    task_id: string;
    task_title: string;
    task_status: string;
    logs: Array<{
      id: string;
      agent_type: string;
      action: string;
      status: string;
      created_at: string;
      details: Record<string, any>;
      error_message?: string;
    }>;
  }> => {
    const response = await apiClient.get<any>(`/api/admin/audit-trail/${taskId}`);
    return response.data;
  },

  getCostTracking: async (
    hours?: number
  ): Promise<{
    window_hours: number;
    daily_budget: number;
    tokens_used: number;
    percent_used: number;
    cost_usd: number;
    is_over_budget: boolean;
    breakdown: Record<string, { tokens: number; cost_usd: number }>;
  }> => {
    const response = await apiClient.get<any>("/api/admin/cost-tracking", {
      params: { ...(hours && { hours }) },
    });
    return response.data;
  },

  getRateLimiting: async (): Promise<{
    daily_limit: number;
    current_count: number;
    remaining: number;
    window_hours: number;
    is_limited: boolean;
    reset_at?: string;
  }> => {
    const response = await apiClient.get<any>("/api/admin/rate-limiting");
    return response.data;
  },

  getDailyReport: async (): Promise<any> => {
    const response = await apiClient.get<any>("/api/admin/daily-report");
    return response.data;
  },

  getCircuitBreakerStatus: async (
    taskId: string
  ): Promise<{
    task_id: string;
    failure_count: number;
    failure_threshold: number;
    should_escalate: boolean;
    reason?: string;
  }> => {
    const response = await apiClient.get<any>(`/api/admin/circuit-breaker/${taskId}`);
    return response.data;
  },

  getEscalations: async (
    status?: string,
    limit?: number
  ): Promise<{
    total: number;
    tasks: Array<{
      id: string;
      title: string;
      status: string;
      escalation_reason: string;
      escalated_at?: string;
      failure_count: number;
    }>;
  }> => {
    const response = await apiClient.get<any>("/api/admin/escalations", {
      params: { ...(status && { status }), ...(limit && { limit }) },
    });
    return response.data;
  },
};
