import type { Metadata } from "next";
import "@fontsource/rethink-sans";
import "./globals.css";
import { Providers } from "@/components/providers/providers";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi.config";

export const metadata: Metadata = {
  title: "wBTC Converter - USD to Wrapped Bitcoin",
  description: "Convert between USD and Wrapped Bitcoin (wBTC) tokens on Ethereum Mainnet",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie');
  const initialState = cookieToInitialState(wagmiConfig, cookies);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers initialState={initialState}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
