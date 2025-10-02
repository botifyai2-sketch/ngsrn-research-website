import type { Metadata } from "next";
import { Inter, Merriweather, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { StructuredData } from "@/components/seo/StructuredData";
import { generateOrganizationStructuredData } from "@/lib/seo";
import { PerformanceProvider } from "@/components/providers/PerformanceProvider";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { CookieConsent } from "@/components/analytics/CookieConsent";
import { GoogleAnalyticsWithConsent } from "@/components/analytics/GoogleAnalytics";
import { getEnvironmentConfig } from "@/lib/env-validation";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: 'swap',
  preload: false, // Only preload primary font
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false, // Only preload primary font
});

// Get environment configuration
const envConfig = getEnvironmentConfig();

export const metadata: Metadata = {
  title: envConfig.siteName,
  description: "Advancing policy-focused research to shape sustainable futures for Africa",
  keywords: "research, Africa, sustainable development, policy, governance, environment, economics, health",
  authors: [{ name: envConfig.siteName }],
  openGraph: {
    title: envConfig.siteName,
    description: "Advancing policy-focused research to shape sustainable futures for Africa",
    url: envConfig.baseUrl,
    siteName: envConfig.siteName,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: envConfig.siteName,
    description: "Advancing policy-focused research to shape sustainable futures for Africa",
    creator: "@NGSRN_Africa",
    site: "@NGSRN_Africa",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationStructuredData = generateOrganizationStructuredData();

  return (
    <html lang="en">
      <head>
        {/* Critical resource hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        
        {/* Analytics preconnect for performance */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        
        <StructuredData data={organizationStructuredData} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#003366" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NGSRN" />
        
        {/* Accessibility meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="color-scheme" content="light" />
        
        {/* Performance hints */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
        
        {/* Google Analytics */}
        <GoogleAnalyticsWithConsent />
      </head>
      <body
        className={`${inter.variable} ${merriweather.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <SessionProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <AnalyticsProvider>
              <PerformanceProvider>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
                <CookieConsent />
              </PerformanceProvider>
            </AnalyticsProvider>
          </Suspense>
        </SessionProvider>
      </body>
    </html>
  );
}
