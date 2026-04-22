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
  title: "Saúl-Correa Bridge | Atletico Madrid News",
  description: "The ultimate news portal for Atletico Madrid fans. Get latest news, squad updates, and match results.",
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
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <footer className="border-t border-gray-200 bg-white py-8">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500">
            <p>&copy; 2024 Saúl-Correa Bridge. Made with passion for Atleti.</p>
            <p className="mt-2 italic">"Seoul and Korea bringing you the latest from Madrid."</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
