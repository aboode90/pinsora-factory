import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { InfiniteScrollGrid } from "@/components/images/infinite-scroll";
import { CategoryCard } from "@/components/categories/category-card";
import { ChevronRight } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getCategory(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      _count: { select: { images: true } },
      children: {
        include: { _count: { select: { images: true } } },
        orderBy: { name: "asc" },
      },
      parent: { select: { id: true, name: true, slug: true } },
    },
  });
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Category Not Found" };

  return {
    title: `${category.name} Images`,
    description:
      category.description ??
      `Browse ${category._count.images} stunning ${category.name} images on PixelVault.`,
    openGraph: {
      title: `${category.name} — PixelVault`,
      description: category.description ?? `Browse ${category.name} images`,
      images: category.coverImage ? [{ url: category.coverImage }] : [],
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) notFound();

  const images = await prisma.image.findMany({
    where: { categoryId: category.id, isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, username: true, image: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { likes: true, saves: true, comments: true } },
    },
  });

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-neutral-500 mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-neutral-900 transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/categories" className="hover:text-neutral-900 transition-colors">Categories</Link>
        {category.parent && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href={`/categories/${category.parent.slug}`}
              className="hover:text-neutral-900 transition-colors"
            >
              {category.parent.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-neutral-900 font-medium">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-neutral-500 max-w-2xl">{category.description}</p>
        )}
        <p className="text-sm text-neutral-400 mt-2">
          {category._count.images.toLocaleString()} images
        </p>
      </div>

      {/* Subcategories with cover images */}
      {category.children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-neutral-700 mb-3">Subcategories</h2>
          <div className="flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/categories/${child.slug}`}
                className="px-4 py-2 rounded-full border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-colors"
              >
                {child.name}
                <span className="ml-1.5 text-neutral-400 text-xs">
                  ({child._count.images})
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Images */}
      <InfiniteScrollGrid
        initialImages={images as Parameters<typeof InfiniteScrollGrid>[0]["initialImages"]}
        fetchUrl={`/api/images?category=${slug}`}
      />
    </div>
  );
}
