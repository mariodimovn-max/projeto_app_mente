import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Newsreader, Space_Mono } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { PWA_THEME } from "@/lib/pwa/appIcon";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/pwa/appInfo";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

// Story 6.1: barra de status/tema do app instalado na cor de fundo.
// Story 6.2: `viewportFit: "cover"` libera os `env(safe-area-inset-*)` (barra de gestos e recorte
// de câmera, inclusive na lateral em paisagem) — o body, a PrimaryNav e os overlays os respeitam.
// Sem `interactiveWidget` de propósito: o padrão do Chrome Android (resizes-visual) deixa a nav
// fixa atrás do teclado em vez de empurrá-la para cima, comendo a área útil.
export const viewport: Viewport = {
  themeColor: PWA_THEME,
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${instrumentSans.variable} ${newsreader.variable} ${spaceMono.variable}`}
    >
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
