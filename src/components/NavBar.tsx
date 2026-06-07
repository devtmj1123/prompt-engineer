"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBrain, faBolt, faBook, faGear, faSun, faMoon, faClockRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

export function NavBar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  const LINKS = [
    { href: "/", label: "Workspace", icon: faBolt },
    { href: "/history", label: "History", icon: faClockRotateLeft },
    { href: "/knowledge", label: "Knowledge", icon: faBook },
    { href: "/settings", label: "Settings", icon: faGear },
  ];

  return (
    <nav className="flex items-center justify-between px-6 py-3
      th-surface th-raised rounded-2xl mx-4 mt-4 transition-all duration-200">
      <Link href="/" className="flex items-center gap-2 text-sm font-bold th-accent tracking-tight hover:opacity-80 transition-opacity">
        <FontAwesomeIcon icon={faBrain} className="w-4 h-4" />
        <span>Prompt Engineer</span>
      </Link>
      
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                pathname === link.href
                  ? "th-inset th-accent"
                  : "th-muted hover:th-accent hover:th-raised"
              }`}
            >
              <FontAwesomeIcon icon={link.icon} className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="w-px h-6 bg-slate-700/20 dark:bg-slate-300/20" />

        <button
          onClick={toggle}
          className="p-2 rounded-xl text-xs font-medium th-muted hover:th-accent hover:th-raised transition-all w-8 h-8 flex items-center justify-center cursor-pointer"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} className="w-4 h-4" />
        </button>

        <a
          href="https://github.com/devtmj1123/prompt-engineer"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl text-xs font-medium th-muted hover:th-accent hover:th-raised transition-all w-8 h-8 flex items-center justify-center"
          title="View on GitHub"
        >
          <FontAwesomeIcon icon={faGithub} className="w-4 h-4" />
        </a>
      </div>
    </nav>
  );
}

