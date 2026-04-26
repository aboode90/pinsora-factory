"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldOff } from "lucide-react";

interface AdminUserActionsProps {
  userId: string;
  currentRole: string;
}

export function AdminUserActions({ userId, currentRole }: AdminUserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggleRole = async () => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`Change this user's role to ${newRole}?`)) return;

    setLoading(true);
    try {
      await fetch(`/api/admin/users?id=${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleRole}
      disabled={loading}
      className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${
        currentRole === "ADMIN"
          ? "text-rose-500 hover:bg-rose-50"
          : "text-neutral-400 hover:text-rose-500 hover:bg-rose-50"
      }`}
      title={currentRole === "ADMIN" ? "Remove admin" : "Make admin"}
    >
      {currentRole === "ADMIN" ? (
        <ShieldOff className="h-3.5 w-3.5" />
      ) : (
        <Shield className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
