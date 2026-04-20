import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinPrep — Finance Interview Practice",
  description: "Practice finance interview questions with instant grading and feedback.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}