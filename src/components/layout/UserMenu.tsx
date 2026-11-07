"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type HeaderUser = {
  name: string;
  avatarUrl: string | null;
  isHost: boolean;
  isAdmin: boolean;
};

/**
 * Authenticated account control shown in the established header position
 * (same geometry/style as the source header). Replaces the old hard-coded
 * demo names: only the actual signed-in user is shown here.
 */
export default function UserMenu({ user }: { user: HeaderUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const initial = user.name?.trim()?.[0] ?? "ک";

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    startTransition(() => {
      router.push("/");
      router.refresh();
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-full bg-primary-soft/70 hover:bg-primary-soft transition-all border border-purple-100"
          aria-label="منوی حساب کاربری"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
            <AvatarFallback className="bg-primary text-white text-xs font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-bold text-primary whitespace-nowrap max-w-[110px] truncate">
            {user.name}
          </span>
          <svg
            className={`w-3.5 h-3.5 text-primary transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
        <DropdownMenuItem
          className="rounded-xl text-xs cursor-pointer"
          onClick={() => router.push("/account-settings")}
        >
          حساب کاربری و تنظیمات
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-xl text-xs cursor-pointer"
          onClick={() => router.push("/rentals")}
        >
          اجاره‌های من
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-xl text-xs cursor-pointer"
          onClick={() => router.push("/live-chat")}
        >
          گفتگوها
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-xl text-xs cursor-pointer"
          onClick={() => router.push("/wallet")}
        >
          کیف پول
        </DropdownMenuItem>
        {user.isHost && (
          <>
            <DropdownMenuItem
              className="rounded-xl text-xs cursor-pointer"
              onClick={() => router.push("/host-dashboard")}
            >
              پنل میزبان
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-xl text-xs cursor-pointer"
              onClick={() => router.push("/my-items")}
            >
              وسایل من
            </DropdownMenuItem>
          </>
        )}
        {user.isAdmin && (
          <DropdownMenuItem
            className="rounded-xl text-xs cursor-pointer"
            onClick={() => router.push("/admin-dashboard")}
          >
            پنل مدیریت
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-xl text-xs cursor-pointer text-red-600 focus:text-red-600"
          disabled={pending}
          onClick={signOut}
        >
          خروج از حساب
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
