/**
 * Type definitions for API requests/responses and domain models
 */

// User types
export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// Auth types
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginRequest {
  username: string; // email
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// Task types
export enum TaskStatus {
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  IN_DEVELOPMENT = "in_development",
  TESTING = "testing",
  IN_REVIEW = "in_review",
  PENDING_DEPLOYMENT = "pending_deployment",
  DEPLOYED = "deployed",
  REJECTED = "rejected",
  ESCALATED = "escalated",
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority_score: number;
  acceptance_criteria: string[];
  vote_count: number;
  requested_by: string;
  required_capabilities: string[];
  approved_at: string | null;
  deployed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskCreateRequest {
  title: string;
  description: string;
  acceptance_criteria: string[];
  required_capabilities: string[];
}

// Feature types
export enum FeatureStatus {
  DEVELOPMENT = "development",
  TESTING = "testing",
  IN_REVIEW = "in_review",
  DEPLOYED = "deployed",
  FAILED = "failed",
}

export interface Feature {
  id: string;
  task_id: string;
  branch_name: string;
  tool_name: string;
  tool_code: string;
  test_code: string;
  test_results: Record<string, unknown>;
  pr_url: string | null;
  status: FeatureStatus;
  retry_count: number;
  merged_at: string | null;
  created_at: string;
  updated_at: string;
}

// Agent log types
export enum AgentType {
  QUERY = "query",
  TASK_MANAGER = "task_manager",
  CODING = "coding",
  TESTING = "testing",
}

export interface AgentLog {
  id: string;
  agent_type: AgentType;
  task_id: string | null;
  action: string;
  details: Record<string, unknown>;
  status: "success" | "failure" | "in_progress";
  error_message: string | null;
  created_at: string;
}

// Tool registry types
export interface ToolRegistryEntry {
  id: string;
  tool_name: string;
  version: string;
  deployed_at: string;
  previous_version: string | null;
  created_at: string;
  updated_at: string;
}

// API Response wrappers
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiListResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

// Error types
export interface ApiError {
  detail: string | { msg: string }[];
}
