"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faCode } from "@fortawesome/free-solid-svg-icons";

export function Footer() {
  return (
    <footer className="mt-8 mb-6 mx-4 px-6 py-4 th-surface th-raised rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-200">
      <div className="text-xs th-muted flex items-center gap-1.5 font-medium">
        <FontAwesomeIcon icon={faCode} className="th-accent" />
        <span>
          © {new Date().getFullYear()} Prompt Engineer. All rights reserved.
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs font-semibold">
        <a 
          href="https://github.com/devtmj1123/prompt-engineer/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
          className="th-muted hover:th-accent transition-colors duration-150"
        >
          MIT License
        </a>
        <a
          href="https://github.com/devtmj1123/prompt-engineer"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 th-muted hover:th-accent transition-colors duration-150"
        >
          <FontAwesomeIcon icon={faGithub} className="w-4 h-4" />
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
}
