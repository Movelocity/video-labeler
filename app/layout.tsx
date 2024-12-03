import type { Metadata } from "next"
import "./globals.css";
import Link from 'next/link';

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
    <html lang="en">
      <body className="antialiased w-full h-full bg-zinc-900 text-white">
        <nav className="w-full h-12 bg-slate-800 border-b border-slate-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center">
            <a 
              href="/config" 
              className="text-sm font-medium text-slate-200 hover:text-white transition-colors duration-200 px-3 py-2 rounded-md hover:bg-slate-700"
              tabIndex={0}
              aria-label="返回首页"
            >
              修改配置
            </a>

            <Link
              href="/list-files"
              className="px-6 py-2 text-sm font-medium text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              文件列表
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
