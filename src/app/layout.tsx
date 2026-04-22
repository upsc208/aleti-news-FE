import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "알레띠 KR | 아틀레티코 마드리드 뉴스 포털",
  description: "아틀레티코 마드리드 팬들을 위한 최신 뉴스, 경기 정보 및 분석. 사울과 코레아가 전해주는 가장 빠른 소식.",
  other: {
    referrer: 'no-referrer',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <footer className="border-t border-gray-200 bg-white py-8">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500">
            <p>&copy; 2024 알레띠 KR. All rights reserved.</p>
            <p className="mt-2 italic">"사울(Seoul)과 코레아(Korea)를 잇는 아틀레티코의 다리"</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
