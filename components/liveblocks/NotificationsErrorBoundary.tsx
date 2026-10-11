"use client";

import React, { Component } from "react";
import { Bell } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Wraps <Notifications /> to catch errors thrown by the Liveblocks suspense
 * hooks (useInboxNotifications, useUnreadInboxNotificationsCount) when the
 * Liveblocks API is temporarily unreachable.
 *
 * Without this boundary a 503 from api.liveblocks.io propagates up and crashes
 * the entire page tree, putting in-flight editor state at risk.
 */
export class NotificationsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface to Sentry/console without crashing the app
    console.warn(
      "[Notifications] Liveblocks notification service unavailable:",
      error.message,
      info,
    );
  }

  render() {
    if (this.state.hasError) {
      // Silent fallback — a plain, non-interactive bell so the header layout is preserved
      return (
        <div
          aria-label="Notifications unavailable"
          title="Notifications temporarily unavailable"
          className="text-muted flex size-10 items-center justify-center rounded-lg opacity-50"
        >
          <Bell className="size-5" />
        </div>
      );
    }

    return this.props.children;
  }
}

export default NotificationsErrorBoundary;
