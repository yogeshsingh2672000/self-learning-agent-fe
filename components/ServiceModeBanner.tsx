/**
 * ServiceModeBanner — renders a sticky banner above the chat when the
 * backend reports a degraded service mode (P1A.10/.11).
 *
 *   FULL       → nothing rendered (banner hidden)
 *   NO_TOOLS   → yellow: tools unavailable, LLM still answering
 *   READ_ONLY  → orange: replies not being saved to history
 *   OFFLINE    → red:    LLM unreachable, only canned responses
 */
"use client";

import { AlertTriangle, AlertCircle, AlertOctagon } from "lucide-react";
import type { ServiceMode } from "@/api";

const MODE_CONFIG: Record<
  Exclude<ServiceMode, "FULL">,
  {
    bg: string;
    text: string;
    icon: typeof AlertTriangle;
    title: string;
    body: string;
  }
> = {
  NO_TOOLS: {
    bg: "bg-yellow-50 border-yellow-300",
    text: "text-yellow-900",
    icon: AlertTriangle,
    title: "Tools temporarily unavailable",
    body:
      "I can answer from general knowledge but can't use external tools right now. " +
      "Tool-backed questions may not get the best answer until this clears.",
  },
  READ_ONLY: {
    bg: "bg-orange-50 border-orange-300",
    text: "text-orange-900",
    icon: AlertCircle,
    title: "Read-only mode",
    body:
      "I'm answering but couldn't save your message to history. Please retry " +
      "in a few moments if you want this conversation persisted.",
  },
  OFFLINE: {
    bg: "bg-red-50 border-red-300",
    text: "text-red-900",
    icon: AlertOctagon,
    title: "Chat backend degraded",
    body:
      "The language model is unreachable. You're getting canned responses. " +
      "Please retry in a minute or two — recovery is automatic.",
  },
};

export interface ServiceModeBannerProps {
  mode: ServiceMode | undefined;
}

export default function ServiceModeBanner({ mode }: ServiceModeBannerProps) {
  if (!mode || mode === "FULL") return null;
  const cfg = MODE_CONFIG[mode];
  const Icon = cfg.icon;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`border-b ${cfg.bg} ${cfg.text} px-6 py-3`}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-sm">{cfg.title}</p>
          <p className="text-xs mt-1 opacity-90">{cfg.body}</p>
        </div>
        <span className="text-xs font-mono uppercase tracking-wide opacity-70">
          {mode}
        </span>
      </div>
    </div>
  );
}
