import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutGrid, Images, FolderOpen, Users, Tag, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
  { href: "/admin/images", label: "Images", icon: Images },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/tags", label: "Tags", icon: Tag },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-neutral-100 flex flex-col">
        <div className="p-5 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <Image src="/logo-icon.png" alt="Pinsora" width={34} height={34} className="rounded-lg object-contain" />
            <div>
              <p className="text-sm font-bold text-neutral-900">Admin Panel</p>
              <p className="text-xs text-neutral-500">Pinsora</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-neutral-100">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
          >
            ← Back to Site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
