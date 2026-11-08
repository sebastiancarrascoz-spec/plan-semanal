import type { Metadata, Viewport } from "next";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Mi Semana · Un hábito a la vez",
  description:
    "Tu plan de alimentación, movimiento y progreso. Sin contar calorías.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Mi Semana" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F7D6C",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body>{children}</body>
    </html>
  );
}
