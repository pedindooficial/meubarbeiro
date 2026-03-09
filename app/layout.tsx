import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import SplashScreen from "@/components/SplashScreen";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // safe-area em WebView / notch
};

export const metadata: Metadata = {
  title: "Barbeiro - Gestão de Barbearias",
  description: "Gerencie sua barbearia: clientes, cortes, catálogo, financeiro e planos de ação.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen">
        <SplashScreen />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
