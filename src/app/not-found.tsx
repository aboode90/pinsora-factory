import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="text-8xl font-bold text-neutral-100 mb-4">404</div>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">Page not found</h1>
      <p className="text-neutral-500 mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
        <Link href="/explore">
          <Button variant="outline">Explore Images</Button>
        </Link>
      </div>
    </div>
  );
}
