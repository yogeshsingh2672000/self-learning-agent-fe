/**
 * Chat page content component
 * Displays real-time chat with the Query Agent
 */
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  ChevronUp,
} from "lucide-react";
import { chatApi, ChatMessage, tasksApi } from "@/api";
import { useAuthStore } from "@/store/auth-store";

interface Message extends ChatMessage {
  isLoading?: boolean;
  _voted?: boolean;
}

export default function ChatContent() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [lastTaskCreated, setLastTaskCreated] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation history on component mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        if (!user?.id) return;

        // Use user ID as the session ID
        const currentSessionId = user.id;
        setSessionId(currentSessionId);

        const response = await chatApi.getHistory(currentSessionId, 50, 0);
        setMessages(response.messages);
      } catch (err) {
        console.error("Error loading chat history:", err);
        setError("Failed to load conversation history");
      }
    };

    loadHistory();
  }, [user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => setShowNotification(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !sessionId) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setError(null);

    // Add user message immediately
    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        message: userMessage,
        timestamp: new Date().toISOString(),
      },
    ]);

    // Add loading message
    const loadingMsgId = `loading-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: loadingMsgId,
        role: "agent",
        message: "Thinking...",
        timestamp: new Date().toISOString(),
        isLoading: true,
      },
    ]);

    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(userMessage, sessionId);

      // Remove loading message
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMsgId));

      // Add agent response
      setMessages((prev) => [
        ...prev,
        {
          id: response.agent_message_id,
          role: "agent" as const,
          message: response.agent_response,
          timestamp: response.timestamp,
          is_capability_gap: response.gap_detected,
        },
      ]);

      // Show notification if task was created
      if (response.task_created) {
        setLastTaskCreated(response.task_created);
        setShowNotification(true);
      }
    } catch (err) {
      // Remove loading message
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingMsgId));

      const errorMessage =
        err instanceof Error ? err.message : "Failed to send message";
      setError(errorMessage);

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "system" as const,
          message: `Error: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatApi.deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (err) {
      console.error("Error deleting message:", err);
      setError("Failed to delete message");
    }
  };

  const handleVoteTask = async (taskId: string) => {
    try {
      await tasksApi.voteTask(taskId);
      // Update vote count display in messages that reference this task
      setMessages((prev) =>
        prev.map((msg) =>
          msg.task_id === taskId ? ({ ...msg, _voted: true } as Message) : msg,
        ),
      );
    } catch (err) {
      console.error("Error voting on task:", err);
      setError("Failed to register vote");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Query Agent Chat</h1>
        <p className="text-gray-600 mt-2">
          Ask questions and get answers. If I can't help, I'll suggest a new
          feature.
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">No messages yet</p>
              <p className="text-sm">
                Start a conversation by typing a question below
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : msg.role === "system"
                      ? "bg-red-100 text-red-900 rounded-bl-none"
                      : "bg-gray-100 text-gray-900 rounded-bl-none"
                }`}
              >
                {msg.isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{msg.message}</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    {msg.is_capability_gap && (
                      <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                        <div className="flex items-start space-x-2 text-xs">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold">
                              Capability Gap Detected
                            </p>
                            {msg.gap_description && (
                              <p className="mt-1 opacity-90">
                                {msg.gap_description}
                              </p>
                            )}
                            {msg.suggested_tool && (
                              <p className="mt-1 opacity-75">
                                Suggested: <strong>{msg.suggested_tool}</strong>
                              </p>
                            )}
                            {msg.task_id && (
                              <button
                                onClick={() => handleVoteTask(msg.task_id!)}
                                disabled={msg._voted}
                                className="mt-2 flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronUp className="w-3 h-3" />
                                {msg._voted ? "Voted!" : "Upvote this request"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {msg.role === "user" && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="mt-1 text-xs opacity-70 hover:opacity-100 transition-opacity flex items-center space-x-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Notification */}
      {showNotification && lastTaskCreated && (
        <div className="border-t border-gray-200 bg-green-50 px-6 py-4">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">New Task Created</p>
              <p className="text-sm text-green-700 mt-1">
                {lastTaskCreated.title}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Status:{" "}
                <span className="font-semibold">{lastTaskCreated.status}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="border-t border-red-200 bg-red-50 px-6 py-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="border-t border-gray-200 bg-white p-6">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="text-black flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
