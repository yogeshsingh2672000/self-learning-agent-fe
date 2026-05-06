/**
 * Dashboard page component
 */
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/api";
import { User } from "@/types";
import { AlertCircle, Loader } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    tasksCreated: 0,
    tasksApproved: 0,
    featuresDeployed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // TODO: Fetch real stats from backend endpoints in Phase 2
        // For now, display placeholder stats
        setStats({
          tasksCreated: 0,
          tasksApproved: 0,
          featuresDeployed: 0,
        });
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.full_name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your AI agent tasks and capabilities here.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tasks created card */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Tasks Created
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.tasksCreated}
                </p>
              </div>
              <div className="text-blue-500 text-3xl opacity-20">📋</div>
            </div>
          </div>

          {/* Tasks approved card */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Tasks Approved
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.tasksApproved}
                </p>
              </div>
              <div className="text-green-500 text-3xl opacity-20">✅</div>
            </div>
          </div>

          {/* Features deployed card */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Features Deployed
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.featuresDeployed}
                </p>
              </div>
              <div className="text-purple-500 text-3xl opacity-20">🚀</div>
            </div>
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h2 className="font-semibold text-blue-900 mb-3">
          Phase 1 - Authentication
        </h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>✅ User registration and login</li>
          <li>✅ JWT token-based authentication</li>
          <li>✅ Protected routes and role-based access</li>
          <li className="text-blue-600">
            → Phase 2: Query Agent & Task Manager
          </li>
          <li className="text-blue-600">→ Phase 3: Approval System</li>
          <li className="text-blue-600">→ Phase 4: Coding Agent</li>
          <li className="text-blue-600">→ Phase 5: Testing & Deployment</li>
        </ul>
      </div>
    </div>
  );
}
