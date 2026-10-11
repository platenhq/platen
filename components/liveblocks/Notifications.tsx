"use client";

import React from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell } from "lucide-react";
import {
  useInboxNotifications,
  useUnreadInboxNotificationsCount,
} from "@liveblocks/react/suspense";
import { InboxNotification, InboxNotificationList, LiveblocksUiConfig } from "@liveblocks/react-ui";
import Image from "next/image";

const Notifications = () => {
  const { inboxNotifications } = useInboxNotifications();
  const { count } = useUnreadInboxNotificationsCount();

  const unreadNotifications = inboxNotifications.filter((notification) => !notification.readAt);

  return (
    <Popover>
      <PopoverTrigger className="text-foreground hover:bg-surface-hover relative flex size-10 items-center justify-center rounded-lg transition-colors">
        <Bell className="size-5" />

        {count > 0 && (
          <div className="bg-primary absolute top-2 right-2 z-20 size-2 rounded-full"></div>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="border-border bg-surface ml-3 flex w-full max-w-87.5 flex-col gap-2 shadow-lg sm:max-w-115"
      >
        <LiveblocksUiConfig
          overrides={{
            INBOX_NOTIFICATION_TEXT_MENTION: (user: React.ReactNode) => <>{user} mentioned you.</>,
          }}
        >
          <InboxNotificationList className="flex flex-col gap-2">
            {unreadNotifications.length === 0 && (
              <p className="text-muted p-2 text-center text-sm">No new notifications</p>
            )}
            {unreadNotifications.length > 0 &&
              unreadNotifications.map((notification) => (
                <InboxNotification
                  key={notification.id}
                  inboxNotification={notification}
                  className="border-border bg-surface-hover text-foreground flex flex-col gap-2 rounded border py-3 sm:flex-row md:gap-3"
                  href={`/documents/${notification.roomId}`}
                  showActions={false}
                  kinds={{
                    thread: (props) => (
                      <InboxNotification.Thread
                        {...props}
                        showActions={false}
                        showRoomName={true}
                      />
                    ),
                    textMention: (props) => (
                      <InboxNotification.TextMention {...props} showRoomName={false} />
                    ),
                    $documentAccess: (props) => (
                      <InboxNotification.Custom
                        {...props}
                        title={
                          <p className="text-sm">
                            {props.inboxNotification.activities[0].data.title}
                          </p>
                        }
                        aside={
                          <InboxNotification.Icon className="bg-transparent">
                            <Image
                              src={
                                (props.inboxNotification.activities[0].data.avatar as string) || ""
                              }
                              alt="avatar"
                              width={36}
                              height={36}
                              className="rounded-full"
                            />
                          </InboxNotification.Icon>
                        }
                      >
                        {props.children}
                      </InboxNotification.Custom>
                    ),
                  }}
                />
              ))}
          </InboxNotificationList>
        </LiveblocksUiConfig>
      </PopoverContent>
    </Popover>
  );
};

export default Notifications;
