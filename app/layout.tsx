import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "جمعية نهضة العكنة",
  description: "نظام الإحصاء السكاني والاشتراكات",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#14b464" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${cairo.className} antialiased`}>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
