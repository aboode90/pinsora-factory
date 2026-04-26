import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-neutral-100 bg-white mt-16">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-3">
              <Image src="/logo-icon.png" alt="Pinsora Icon" width={34} height={34} className="rounded-xl object-contain" />
              <span className="text-lg font-black tracking-tight">
                <span className="text-neutral-900">Pin</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600">sora</span>
              </span>
            </Link>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Discover and share beautiful creative images. Powered by AI.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Explore</h3>
            <ul className="space-y-2">
              {[
                { label: "Home", href: "/" },
                { label: "Categories", href: "/categories" },
                { label: "Trending", href: "/explore?sort=popular" },
                { label: "New", href: "/explore?sort=new" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Account</h3>
            <ul className="space-y-2">
              {[
                { label: "Sign Up", href: "/auth/register" },
                { label: "Log In", href: "/auth/login" },
                { label: "Upload", href: "/upload" },
                { label: "My Boards", href: "/boards" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">Company</h3>
            <ul className="space-y-2">
              {[
                { label: "About", href: "/about" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} Pinsora. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
