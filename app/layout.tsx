import type { Metadata } from "next"
import "./globals.css";
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: "Video Player",
  description: "Anchor box labeling tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased w-full h-full bg-gray-950 text-white">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
