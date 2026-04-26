// ─── Extended Types ───────────────────────────────────────────────────────────

export interface ImageWithRelations {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  blurHash: string | null;
  viewCount: number;
  likeCount: number;
  saveCount: number;
  downloadCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count?: {
    likes: number;
    saves: number;
    comments: number;
  };
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  parentId: string | null;
  sortOrder: number;
  _count: {
    images: number;
  };
  children?: CategoryWithCount[];
}

export interface BoardWithImages {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  boardImages: Array<{
    image: ImageWithRelations;
    addedAt: Date;
  }>;
  _count: {
    boardImages: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Extend NextAuth session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}
