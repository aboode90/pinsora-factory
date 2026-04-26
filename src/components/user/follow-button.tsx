"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";

interface FollowButtonProps {
  userId: string;
  initialFollowed?: boolean;
  followerCount: number;
}

export function FollowButton({
  userId,
  initialFollowed = false,
  followerCount: initialCount,
}: FollowButtonProps) {
  const { data: session } = useSession();
  const [isFollowed, setIsFollowed] = useState(initialFollowed);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (!session) {
      window.location.href = "/auth/login";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/user/${userId}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setIsFollowed(data.followed);
        setCount((prev) => (data.followed ? prev + 1 : prev - 1));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (session?.user?.id === userId) return null;

  return (
    <Button
      onClick={handleFollow}
      variant={isFollowed ? "secondary" : "default"}
      loading={loading}
      className="rounded-full px-8 font-bold h-11"
    >
      {isFollowed ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
}
