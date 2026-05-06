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
  listTasks: async (skip: number = 0, limit: number = 10): Promise<ApiListResponse<Task>> => {
    const response = await apiClient.get<ApiListResponse<Task>>("/api/tasks", {
      params: { skip, limit },
    });
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
    const response = await apiClient.post<Task>(`/api/tasks/${taskId}/approve`, {
      comment,
    });
    return response.data;
  },

  rejectTask: async (taskId: string, comment?: string): Promise<Task> => {
    const response = await apiClient.post<Task>(`/api/tasks/${taskId}/reject`, {
      comment,
    });
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
