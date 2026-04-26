"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

function MessagesContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("userId");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle auto-starting chat from URL
  useEffect(() => {
    const startChat = async () => {
      if (targetUserId) {
        setLoading(true);
        try {
          const res = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipientId: targetUserId }),
          });
          const data = await res.json();
          if (data.success) {
            setSelectedChat(data.data);
            setConversations(prev => {
              if (prev.some(c => c.id === data.data.id)) return prev;
              return [data.data, ...prev];
            });
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };

    startChat();
  }, [targetUserId]);

  // Poll for new messages when a chat is selected
  useEffect(() => {
    if (selectedChat?.id) {
      fetchMessages(selectedChat.id);
      const interval = setInterval(() => fetchMessages(selectedChat.id), 4000);
      return () => clearInterval(interval);
    }
  }, [selectedChat?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = async (userId: string) => {
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: userId }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedChat(data.data);
        // Only add to list if not already there
        if (!conversations.some(c => c.id === data.data.id)) {
          setConversations([data.data, ...conversations]);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const res = await fetch(`/api/messages/${chatId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || isSending) return;

    const content = newMessage;
    setNewMessage("");
    setIsSending(true);

    try {
      const res = await fetch(`/api/messages/${selectedChat.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        fetchConversations(); // Update last message in sidebar
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  if (!session) return null;

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 h-[calc(100vh-120px)] py-4">
      <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm h-full flex overflow-hidden">

        {/* Sidebar */}
        <div className={`w-full md:w-80 border-r border-neutral-100 flex flex-col shrink-0 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-neutral-100">
            <h1 className="text-xl font-bold text-neutral-900">Messages</h1>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-10 text-center space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-16 w-full bg-neutral-50 animate-pulse rounded-2xl" />)}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-10 text-center">
                <div className="h-16 w-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-neutral-200" />
                </div>
                <p className="text-sm text-neutral-400 font-medium">No conversations yet</p>
              </div>
            ) : (
              conversations.map((chat) => {
                const recipient = chat.participants.find((p: any) => p.userId !== session.user.id)?.user;
                const lastMsg = chat.messages?.[0];
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-50 ${
                      selectedChat?.id === chat.id ? "bg-rose-50/50" : ""
                    }`}
                  >
                    <UserAvatar name={recipient?.name} image={recipient?.image} size="md" />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="font-bold text-sm text-neutral-900 truncate">{recipient?.name}</p>
                        <span className="text-[10px] text-neutral-400">{lastMsg ? formatDate(lastMsg.createdAt) : ""}</span>
                      </div>
                      <p className="text-xs text-neutral-500 truncate">
                        {lastMsg ? lastMsg.content : "New conversation"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`flex-1 flex flex-col bg-neutral-50/30 min-w-0 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="bg-white p-4 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 -ml-2 text-neutral-400">
                    <Loader2 className="h-5 w-5 rotate-180" />
                  </button>
                  {(() => {
                    const recipient = selectedChat.participants.find((p: any) => p.userId !== session.user.id)?.user;
                    return (
                      <>
                        <UserAvatar name={recipient?.name} image={recipient?.image} size="sm" />
                        <p className="font-bold text-neutral-900">{recipient?.name}</p>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-neutral-400">
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <MessageSquare className="h-6 w-6 text-rose-300" />
                    </div>
                    <p className="text-sm">This is the start of your conversation.</p>
                    <p className="text-xs">Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === session.user.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all hover:shadow-md ${
                          isMine
                            ? "bg-rose-500 text-white rounded-tr-none"
                            : "bg-white text-neutral-800 border border-neutral-100 rounded-tl-none"
                        }`}>
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className={`text-[9px] mt-1 font-bold uppercase ${isMine ? "text-rose-100/70 text-right" : "text-neutral-400"}`}>
                            {formatDate(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="bg-white p-4 border-t border-neutral-100">
                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 h-12 bg-neutral-100 rounded-full px-6 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all border-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isSending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-12 w-12 shrink-0 shadow-lg"
                    disabled={!newMessage.trim() || isSending}
                    loading={isSending}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <div className="h-24 w-24 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
                <MessageSquare className="h-10 w-10 text-rose-200" />
              </div>
              <h3 className="text-xl font-bold text-neutral-800">Select a message</h3>
              <p className="text-sm text-neutral-500 max-w-xs mt-2 leading-relaxed">
                Choose a conversation from the sidebar or go to a user's profile to start a new chat.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center animate-pulse text-neutral-400">Loading messenger...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
