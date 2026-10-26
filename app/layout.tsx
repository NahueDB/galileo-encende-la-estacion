import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Galileo — Encendé la estación',
  description: 'Una práctica de JavaScript y DOM en pareja. E.E.S.T. N.º 5 Galileo Galilei.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
