import { Metadata } from "next";
import { ChatWindow } from "@/components/chat/chat-window";

export const metadata: Metadata = {
  title: "Pinsora AI Assistant",
  description: "Chat with Pinsora AI for inspiration, prompts, and creative ideas.",
};

export default function ChatPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 min-h-[calc(100vh-200px)]">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black tracking-tight mb-2">
          <span className="text-neutral-900">Pinsora</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600"> AI Assistant</span>
        </h1>
        <p className="text-neutral-500">
          Your creative companion for image ideas, prompts, and more.
        </p>
      </div>

      <ChatWindow />
    </div>
  );
}
