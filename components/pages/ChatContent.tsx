/**
 * Chat content component - Phase 2 placeholder
 */
"use client";

import { AlertCircle } from "lucide-react";

export default function ChatContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Chat with Query Agent
        </h1>
        <p className="text-gray-600 mt-2">
          Interact with the Query Agent to detect system improvements and gaps.
        </p>
      </div>

      <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
        <div className="flex gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-900">Phase 2 Feature</h3>
            <p className="text-sm text-yellow-800 mt-1">
              This page will provide a chat interface to the Query Agent. Users
              can ask questions and receive task recommendations based on system
              capability gaps.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 h-96 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chat interface coming in Phase 2</p>
          <p className="text-sm text-gray-500 mt-2">
            This will include real-time messages from the Query Agent
          </p>
        </div>
      </div>
    </div>
  );
}
