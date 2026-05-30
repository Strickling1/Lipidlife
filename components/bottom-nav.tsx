"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Pill, Utensils, Calendar, Activity } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/medications", icon: Pill, label: "Meds" },
  { href: "/food-diary", icon: Utensils, label: "Food" },
  { href: "/appointments", icon: Calendar, label: "Appts" },
  { href: "/risk", icon: Activity, label: "Risk" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-primary pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 transition-opacity",
                isActive ? "opacity-100" : "opacity-50 hover:opacity-75"
              )}
            >
              <Icon className="size-5 text-primary-foreground" />
              <span className="text-[10px] font-medium text-primary-foreground">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
