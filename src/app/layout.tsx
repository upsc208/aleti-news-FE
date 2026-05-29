import type { Metadata } from "next";
import { Bebas_Neue, Kanit } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ThemeProvider from "@/components/ThemeProvider";
import DarkModeToggle from "@/components/DarkModeToggle";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas-neue",
  subsets: ["latin"],
});

const kanit = Kanit({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-kanit",
  subsets: ["latin", "thai"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://atleti.kr'),
  title: {
    default: "아틀레티 KR | 아틀레티코 마드리드 뉴스 포털",
    template: "%s | 아틀레티 KR"
  },
  description: "아틀레티코 마드리드 팬들을 위한 최신 뉴스, 경기 정보 및 분석. 사울과 코레아가 전해주는 가장 빠른 소식.",
  keywords: ["아틀레티코 마드리드", "Atlético de Madrid", "아틀레티", "Atleti", "라리가", "Laliga", "축구 뉴스", "아틀마", "마드리드", "로히블랑코", "꼬마"],
  authors: [{ name: "아틀레티 KR" }],
  creator: "아틀레티 KR",
  publisher: "아틀레티 KR",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://atleti.kr",
    siteName: "아틀레티 KR",
    title: "아틀레티 KR | 아틀레티코 마드리드 뉴스 포털",
    description: "아틀레티코 마드리드 팬들을 위한 최신 뉴스, 경기 정보 및 분석.",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "아틀레티 KR 로고",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "아틀레티 KR | 아틀레티코 마드리드 뉴스 포털",
    description: "아틀레티코 마드리드 팬들을 위한 최신 뉴스, 경기 정보 및 분석.",
    images: ["/icon.png"],
  },
  alternates: {
    canonical: "/",
  },
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
      className={`${bebasNeue.variable} ${kanit.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0a0b10] text-gray-950 dark:text-gray-100 font-sans overflow-x-hidden transition-colors duration-300 dark-geo-pattern antialiased">
        <ThemeProvider>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Analytics />
          <SpeedInsights />
          <footer className="bg-blue-600 dark:bg-[#0d0e14] text-white py-12 dark:border-t dark:border-volt/10 relative z-10">
            <div className="container mx-auto px-4">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="text-center">
                  <p className="text-sm font-bold text-white mb-1">아틀레티 KR</p>
                  <p className="text-xs text-blue-100 dark:text-gray-500">&copy; {new Date().getFullYear()} Atleti KR. All rights reserved.</p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <p className="text-[11px] font-bold text-blue-200 dark:text-volt/30 uppercase tracking-widest">Contact & Feedback</p>
                  <a
                    href="mailto:upscman@gmail.com"
                    className="text-sm font-medium text-white hover:text-blue-200 transition-colors border-b border-blue-300 hover:border-blue-100 pb-0.5"
                  >
                    upscman@gmail.com
                  </a>
                </div>

                <p className="text-[11px] italic text-blue-200 dark:text-gray-600">
                  &quot;위 메일로 연락주시길 바랍니다.&quot;
                </p>
              </div>
            </div>
          </footer>
          <DarkModeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
