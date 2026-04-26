"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Search, Upload, Menu, X, LayoutGrid, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { NotificationBell } from "./notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-neutral-100 shadow-sm">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
        <div className="flex h-16 items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/logo-icon.png"
              alt="Pinsora Icon"
              width={38}
              height={38}
              className="rounded-xl object-contain"
            />
            <span className="hidden sm:block text-xl font-black tracking-tight">
              <span className="text-neutral-900">Pin</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600">sora</span>
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search images, tags, categories..."
                className="w-full h-11 pl-11 pr-4 rounded-full bg-neutral-100 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all font-medium"
                aria-label="Search"
              />
            </div>
          </form>

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/explore"
              className="px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/categories"
              className="px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
            >
              Categories
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {session ? (
              <>
                <Link href="/upload">
                  <Button size="sm" className="hidden sm:flex gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    Upload
                  </Button>
                </Link>

                <NotificationBell />

                <Link href="/messages" className="p-2 rounded-full hover:bg-neutral-100 transition-all active:scale-95">
                  <MessageSquare className="h-5 w-5 text-neutral-600" />
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                      aria-label="User menu"
                    >
                      <UserAvatar
                        name={session.user.name}
                        image={session.user.image}
                        size="sm"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="mt-2 w-52 rounded-2xl bg-white shadow-xl border border-neutral-100 p-1.5 z-50"
                  >
                    <div className="px-3 py-2 mb-1">
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">{session.user.email}</p>
                    </div>
                    <DropdownMenuSeparator className="my-1 h-px bg-neutral-100" />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 rounded-xl hover:bg-neutral-50 cursor-pointer"
                      >
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/messages"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 rounded-xl hover:bg-neutral-50 cursor-pointer"
                      >
                        Messages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/boards"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 rounded-xl hover:bg-neutral-50 cursor-pointer"
                      >
                        My Boards
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/upload"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 rounded-xl hover:bg-neutral-50 cursor-pointer sm:hidden"
                      >
                        Upload Image
                      </Link>
                    </DropdownMenuItem>
                    {session.user.role === "ADMIN" && (
                      <>
                        <DropdownMenuSeparator className="my-1 h-px bg-neutral-100" />
                        <DropdownMenuItem asChild>
                          <Link
                            href="/admin"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer"
                          >
                            <LayoutGrid className="h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 rounded-xl hover:bg-neutral-50 cursor-pointer"
                      >
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 h-px bg-neutral-100" />
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-xl hover:bg-red-50 cursor-pointer"
                    >
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-neutral-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-100 py-3 space-y-1">
            <Link
              href="/explore"
              className="block px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-xl"
              onClick={() => setMobileMenuOpen(false)}
            >
              Explore
            </Link>
            <Link
              href="/categories"
              className="block px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-xl"
              onClick={() => setMobileMenuOpen(false)}
            >
              Categories
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
