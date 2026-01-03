import type { Metadata } from "next";
import "./globals.css";
import { NavigationWrapper } from "@/components/navigation/NavigationWrapper";

export const metadata: Metadata = {
  title: "如故 - 寻找一见如故的朋友",
  description: "为内向者打造的社交匹配应用，帮助您找到真正灵魂共鸣的朋友",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <head>
        <script async crossOrigin="anonymous" src="https://tweakcn.com/live-preview.min.js"></script>
      </head>
      <body className="antialiased bg-gray-50">
        <NavigationWrapper>{children}</NavigationWrapper>
      </body>
    </html>
  );
}
