import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

// تعريف خط Cairo
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
      <body className={`${cairo.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}