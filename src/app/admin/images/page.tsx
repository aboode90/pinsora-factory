import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { formatDate, formatNumber } from "@/lib/utils";
import { AdminImageActions } from "@/components/admin/image-actions";
import { Plus, Eye, Heart, Bookmark } from "lucide-react";

interface AdminImage {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  viewCount: number;
  likeCount: number;
  saveCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Date;
  category: { name: string; slug: string };
  user: { name: string | null; email: string };
  _count: { likes: number; saves: number };
}

export const metadata: Metadata = { title: "Manage Images — Admin" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function AdminImagesPage({ searchParams }: PageProps) {
  const { page: pageStr = "1", search } = await searchParams;
  const page = Math.max(1, parseInt(pageStr));
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [images, total] = await Promise.all([
    prisma.image.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true, slug: true } },
        user: { select: { name: true, email: true } },
        _count: { select: { likes: true, saves: true } },
      },
    }),
    prisma.image.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Images</h1>
          <p className="text-sm text-neutral-500">{total.toLocaleString()} total images</p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Image
        </Link>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search images..."
          className="flex-1 h-10 px-4 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Image</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Creator</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Stats</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {(images as AdminImage[]).map((img) => (
                <tr key={img.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-neutral-100">
                      <Image
                        src={img.thumbnailUrl ?? img.imageUrl}
                        alt={img.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/images/${img.id}`}
                      className="font-medium text-neutral-900 hover:text-rose-500 transition-colors line-clamp-1 max-w-[200px] block"
                    >
                      {img.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{img.category.name}</td>
                  <td className="px-4 py-3 text-neutral-500">{img.user.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatNumber(img.viewCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {formatNumber(img._count.likes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="h-3 w-3" />
                        {formatNumber(img._count.saves)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      img.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-neutral-100 text-neutral-600"
                    }`}>
                      {img.isPublished ? "Published" : "Draft"}
                    </span>
                    {img.isFeatured && (
                      <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">{formatDate(img.createdAt)}</td>
                  <td className="px-4 py-3">
                    <AdminImageActions imageId={img.id} isPublished={img.isPublished} isFeatured={img.isFeatured} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
            <p className="text-xs text-neutral-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/images?page=${page - 1}${search ? `&search=${search}` : ""}`}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium hover:bg-neutral-50 transition-colors"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/images?page=${page + 1}${search ? `&search=${search}` : ""}`}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium hover:bg-neutral-50 transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
