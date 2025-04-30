import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Import Inter font
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Optional: define CSS variable
});

export const metadata: Metadata = {
  title: 'SafeCrawl - URL Risk Analyzer',
  description: 'Analyze URLs for potential security risks. Modern cybersecurity tool.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply Inter font class to the body */}
      <body className={`${inter.className} bg-grid-pattern`}>
        {children}
        <Toaster /> {/* Add Toaster component here */}
      </body>
    </html>
  );
}
