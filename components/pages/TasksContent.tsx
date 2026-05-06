/**
 * Tasks content component - Phase 3 placeholder
 */
"use client";

import { AlertCircle } from "lucide-react";

export default function TasksContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-600 mt-2">
          View and manage system improvement tasks detected by AI agents.
        </p>
      </div>

      <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
        <div className="flex gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-900">Phase 3 Feature</h3>
            <p className="text-sm text-yellow-800 mt-1">
              This page will display tasks created by the Query Agent in Phase
              2. It will include task creation, voting, approval workflow, and
              implementation tracking.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900">Pending Approval</h3>
          <p className="text-gray-600 text-sm mt-1">0 tasks</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900">In Development</h3>
          <p className="text-gray-600 text-sm mt-1">0 tasks</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900">In Testing</h3>
          <p className="text-gray-600 text-sm mt-1">0 tasks</p>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900">Deployed</h3>
          <p className="text-gray-600 text-sm mt-1">0 tasks</p>
        </div>
      </div>
    </div>
  );
}
