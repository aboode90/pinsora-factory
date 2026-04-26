import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminCategoryManager } from "@/components/admin/category-manager";

export const metadata: Metadata = { title: "Manage Categories — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { images: true } },
      parent: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Categories</h1>
        <p className="text-sm text-neutral-500">{categories.length} categories</p>
      </div>
      <AdminCategoryManager initialCategories={categories} />
    </div>
  );
}
