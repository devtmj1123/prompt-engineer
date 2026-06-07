"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "⚡ Workspace" },
  { href: "/knowledge", label: "📚 Knowledge" },
  { href: "/settings", label: "⚙️ Settings" },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center justify-between px-6 py-3
      bg-neu-bg shadow-neu-raised rounded-2xl mx-4 mt-4">
      <span className="text-sm font-bold text-neu-accent tracking-tight">
        🧠 Prompt Engineer
      </span>
      <div className="flex gap-1">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-xs px-4 py-2 rounded-xl font-medium transition-all ${
              pathname === link.href
                ? "shadow-neu-inset text-neu-accent"
                : "text-neu-text-muted hover:text-neu-accent hover:shadow-neu-raised"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
