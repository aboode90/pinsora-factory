"use client";

import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { UserAvatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter((n: any) => !n.isRead).length);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  const getNotificationText = (type: string) => {
    switch (type) {
      case "LIKE": return "liked your image";
      case "SAVE": return "saved your image";
      case "COMMENT": return "commented on your image";
      case "FOLLOW": return "started following you";
      default: return "interacted with you";
    }
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && markAsRead()}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-neutral-100 transition-all active:scale-95">
          <Bell className="h-5 w-5 text-neutral-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="mt-2 w-80 rounded-2xl bg-white shadow-xl border border-neutral-100 p-1.5 z-50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="font-bold text-sm">Notifications</h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-neutral-400 text-xs">
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem key={n.id} asChild>
                <Link
                  href={n.type === 'FOLLOW' ? `/profile/${n.actor.username || n.actorId}` : `/images/${n.resourceId}`}
                  className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer"
                >
                  <UserAvatar name={n.actor.name} image={n.actor.image} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-800 leading-snug">
                      <span className="font-bold">{n.actor.name}</span>{" "}
                      {getNotificationText(n.type)}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-1 uppercase font-bold">
                      {formatDate(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                  )}
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
