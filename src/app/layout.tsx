import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Calgary Commercial Properties | Open Data',
  description: 'Interactive map of commercial properties in Calgary powered by City of Calgary Open Data',
  keywords: 'Calgary, commercial properties, business licenses, open data, real estate',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
