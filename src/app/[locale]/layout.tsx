import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Inter } from "next/font/google";
import { locales, type AppLocale } from "@/i18n/routing";
import { Providers } from "../providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://pinsora.com").replace(/\/$/, "");

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as AppLocale)) notFound();

  const canonical = `${siteUrl}/${locale}`;
  return {
    alternates: {
      canonical,
      languages: {
        en: `${siteUrl}/en`,
        ar: `${siteUrl}/ar`,
        "x-default": `${siteUrl}/en`,
      },
    },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as AppLocale)) notFound();

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={inter.variable}>
      <head>
        {/* JSON-LD: WebSite Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Pinsora",
              url: siteUrl,
              description: "Discover, save, and share stunning creative images across hundreds of categories.",
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl}/${locale}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <meta name="google-adsense-account" content="ca-pub-5100084329334269" />
        {/* Google Analytics 4 */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-Y02G2QEP6C"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Y02G2QEP6C');
          `}
        </Script>

        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5100084329334269"
          crossorigin="anonymous"
          strategy="afterInteractive"
        />

        {/* Google Ads Tag (gtag.js) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-900331271"
          strategy="afterInteractive"
        />
        <Script id="google-ads-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-900331271');
          `}
        </Script>
        <Script id="google-ads-conversion-helper" strategy="afterInteractive">
          {`
            function gtagSendEvent(url) {
              var callback = function () {
                if (typeof url === 'string') {
                  window.location = url;
                }
              };
              gtag('event', 'ads_conversion_page_view', {
                'event_callback': callback,
                'event_timeout': 2000
              });
              return false;
            }
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-white font-sans antialiased overflow-x-hidden">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <div className={dir === "rtl" ? "text-right" : "text-left"}>
              <Navbar />
              <main className="min-h-[calc(100vh-4rem)] pb-20 md:pb-0 overflow-x-hidden">{children}</main>
              <Footer />
              <BottomNav />
            </div>
            <ServiceWorkerRegistration />
            <Analytics />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
