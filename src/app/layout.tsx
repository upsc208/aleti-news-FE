import type { Metadata } from "next";
import { Bebas_Neue, Kanit } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import MainLayoutWrapper from "@/components/MainLayoutWrapper";
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
  description: "아틀레티코 마드리드(알레띠) 팬들을 위한 최신 뉴스, 경기 정보 및 분석. 사울과 코레아가 전해주는 가장 빠른 소식.",
  keywords: ["아틀레티코 마드리드", "Atlético de Madrid", "아틀레티", "아틀레띠", "알레띠", "알레티", "Atleti", "라리가", "Laliga", "축구 뉴스", "아틀마", "마드리드", "로히블랑코", "꼬마"],
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
    description: "아틀레티코 마드리드(알레띠) 팬들을 위한 최신 뉴스, 경기 정보 및 분석.",
  },
  twitter: {
    card: "summary_large_image",
    title: "아틀레티 KR | 아틀레티코 마드리드 뉴스 포털",
    description: "아틀레티코 마드리드(알레띠) 팬들을 위한 최신 뉴스, 경기 정보 및 분석.",
  },
  alternates: {
    canonical: "/",
  },
  other: {
    referrer: 'no-referrer',
  },
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "NewsMediaOrganization",
      "@id": "https://atleti.kr/#organization",
      name: "아틀레티 KR",
      alternateName: ["알레띠 KR", "아틀레띠 KR", "알레티 KR", "Atleti KR"],
      url: "https://atleti.kr",
      logo: {
        "@type": "ImageObject",
        url: "https://atleti.kr/icon.png",
        width: 512,
        height: 512,
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://atleti.kr/#website",
      name: "아틀레티 KR",
      alternateName: ["알레띠 KR", "아틀레띠 KR", "알레티 KR", "Atleti KR"],
      url: "https://atleti.kr",
      inLanguage: "ko-KR",
      publisher: { "@id": "https://atleti.kr/#organization" },
    },
  ],
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
      <body className="min-h-dvh flex flex-col bg-gray-50 dark:bg-[#0a0b10] text-gray-950 dark:text-gray-100 font-sans overflow-x-hidden transition-colors duration-300 dark-geo-pattern antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <ThemeProvider>
          <MainLayoutWrapper>{children}</MainLayoutWrapper>
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}

