import type { Metadata } from "next"
import "./globals.css";

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
        <div className="w-full h-8 bg-slate-700 flex flex-row px-4 pt-2 ">
          <a href="/">HOME</a>
        </div>
        {children}
      </body>
    </html>
  );
}
