import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { Analytics } from "@vercel/analytics/react"

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
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans overflow-x-hidden">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <footer className="bg-blue-600 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="text-center">
                <p className="text-sm font-bold text-white mb-1">알레띠 KR</p>
                <p className="text-xs text-blue-100">&copy; {new Date().getFullYear()} Alleti KR. All rights reserved.</p>
              </div>

              <div className="flex flex-col items-center gap-2">
                <p className="text-[11px] font-bold text-blue-200 uppercase tracking-widest">Contact & Feedback</p>
                <a
                  href="mailto:upscman@gmail.com"
                  className="text-sm font-medium text-white hover:text-blue-200 transition-colors border-b border-blue-300 hover:border-blue-100 pb-0.5"
                >
                  upscman@gmail.com
                </a>
              </div>

              <p className="text-[11px] italic text-blue-200">
                "위 메일로 연락주시길 바랍니다."
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
