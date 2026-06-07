import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Engineer — AI Prompt Orchestration",
  description: "Engineer professional, model-specific prompts from natural language. Powered by Groq, Cerebras, Gemini, and Claude.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-neu-bg text-neu-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
