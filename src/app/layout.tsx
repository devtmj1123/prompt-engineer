import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

config.autoAddCss = false;

export const metadata: Metadata = {
  title: "Prompt Engineer — AI Prompt Orchestration",
  description: "Engineer professional, model-specific prompts from natural language. Powered by Groq, Cerebras, Gemini, and Claude.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen th-bg th-text font-sans antialiased transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

