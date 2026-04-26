import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Users, Image as ImageIcon, Flag, Tag, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Admin Dashboard — Pinsora",
};

async function getStats() {
  const [userCount, imageCount, reportCount, tagCount] = await Promise.all([
    prisma.user.count(),
    prisma.image.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.tag.count(),
  ]);
  return { userCount, imageCount, reportCount, tagCount };
}

export default async function AdminDashboard() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/");
  }

  const stats = await getStats();

  return (
    <div className="mx-auto max-w-screen-xl px-4 sm:px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="text-neutral-500 mt-1">Manage users, images, and reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard
          title="Total Users"
          value={stats.userCount}
          icon={<Users className="h-6 w-6 text-blue-500" />}
          href="/admin/users"
        />
        <StatCard
          title="Total Images"
          value={stats.imageCount}
          icon={<ImageIcon className="h-6 w-6 text-rose-500" />}
          href="/admin/images"
        />
        <StatCard
          title="Pending Reports"
          value={stats.reportCount}
          icon={<Flag className="h-6 w-6 text-amber-500" />}
          href="/admin/reports"
        />
        <StatCard
          title="Total Tags"
          value={stats.tagCount}
          icon={<Tag className="h-6 w-6 text-emerald-500" />}
          href="/admin/tags"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-2xl border border-neutral-100 p-6 bg-white shadow-sm">
          <h2 className="text-lg font-bold mb-4">Quick Links</h2>
          <div className="space-y-3">
            <Link href="/admin/users" className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors border border-neutral-100 group">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-neutral-400" />
                <span className="font-medium">Manage Users</span>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/admin/reports" className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors border border-neutral-100 group">
              <div className="flex items-center gap-3">
                <Flag className="h-5 w-5 text-neutral-400" />
                <span className="font-medium">View Reports</span>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/admin/tags" className="flex items-center justify-between p-4 rounded-xl hover:bg-neutral-50 transition-colors border border-neutral-100 group">
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-neutral-400" />
                <span className="font-medium">Manage Tags</span>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, href }: { title: string, value: number, icon: React.ReactNode, href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-neutral-100 p-6 bg-white shadow-sm hover:border-rose-200 transition-colors group">
      <div className="flex items-center justify-between mb-4">
        <div className="h-12 w-12 rounded-xl bg-neutral-50 flex items-center justify-center group-hover:bg-rose-50 transition-colors">
          {icon}
        </div>
        <ArrowRight className="h-4 w-4 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-sm font-medium text-neutral-500">{title}</p>
      <p className="text-3xl font-bold text-neutral-900 mt-1">{value.toLocaleString()}</p>
    </Link>
  );
}
