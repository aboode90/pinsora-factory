"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Image from "next/image";

export default function AdminAiLogsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, [session, router]);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/ai-logs");
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-neutral-400">Loading AI factory logs...</div>;

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-violet-500" />
          AI Factory Logs
        </h1>
        <p className="text-sm text-neutral-500">Monitor the automatic generation process in real-time.</p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Result</th>
                <th className="px-6 py-4">Prompt Excerpt</th>
                <th className="px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {log.status === 'COMPLETED' ? (
                      <span className="inline-flex items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-red-600 font-bold text-[10px] uppercase bg-red-50 px-2 py-1 rounded-full">
                        <XCircle className="h-3 w-3" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {log.resultUrl ? (
                      <a href={log.resultUrl} target="_blank" className="relative h-12 w-12 rounded-lg overflow-hidden block border border-neutral-100 hover:scale-105 transition-transform">
                        <Image src={log.resultUrl} alt="Result" fill className="object-cover" />
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-400 italic">No image</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-neutral-600 line-clamp-1 max-w-md">
                      {log.status === 'FAILED' ? log.errorMessage : log.prompt}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-xs text-neutral-500 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(log.createdAt)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="py-20 text-center text-neutral-400 italic">
            Waiting for the first AI generation...
          </div>
        )}
      </div>
    </div>
  );
}
