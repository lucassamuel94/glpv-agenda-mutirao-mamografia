"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SubNavItem {
  label: string;
  href: string;
}

interface SubNavProps {
  items: SubNavItem[];
}

export function SubNav({ items }: SubNavProps) {
  const pathname = usePathname();

  return (
    <nav className="border-b mb-6">
      <div className="flex gap-1 overflow-x-auto">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              pathname === item.href || (pathname?.startsWith(item.href + "/") ?? false)
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
