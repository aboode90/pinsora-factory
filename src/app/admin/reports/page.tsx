"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Flag, Trash2, ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default function AdminReportsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    fetchReports();
  }, [session, router]);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/admin/reports");
      const data = await res.json();
      if (data.success) {
        setReports(data.data);
      }
    } catch (error) {
      console.error("Fetch reports error:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageId: string, reportId: string) => {
    if (!confirm("Are you sure you want to delete this image and resolve the report?")) return;

    try {
      const res = await fetch(`/api/images/${imageId}`, { method: "DELETE" });
      if (res.ok) {
        setReports(reports.filter(r => r.id !== reportId));
      }
    } catch (error) {
      alert("Error deleting image");
    }
  };

  if (loading) return <div className="p-10 text-center text-neutral-500">Loading reports...</div>;

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Flag className="h-6 w-6 text-amber-500" />
          Content Reports
        </h1>
        <p className="text-sm text-neutral-500">{reports.length} total reports received.</p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
          <ShieldCheck className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-neutral-700">No pending reports</h2>
          <p className="text-sm text-neutral-500">Everything looks clean!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm flex flex-col md:flex-row gap-6">
              {/* Image Preview */}
              <div className="relative h-40 w-full md:w-60 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                <Image
                  src={report.image.imageUrl}
                  alt={report.image.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase mb-1">
                      {report.reason}
                    </span>
                    <h3 className="font-bold text-neutral-900">{report.image.title}</h3>
                  </div>
                  <p className="text-xs text-neutral-400">{formatDate(report.createdAt)}</p>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 text-sm text-neutral-600 border border-neutral-100">
                  <p className="font-semibold text-xs uppercase text-neutral-400 mb-1">Reported by {report.user.name}</p>
                  {report.details || "No specific details provided."}
                </div>

                <div className="flex items-center gap-3">
                  <Link href={`/images/${report.image.id}`} target="_blank">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Image
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => deleteImage(report.image.id, report.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Image
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
