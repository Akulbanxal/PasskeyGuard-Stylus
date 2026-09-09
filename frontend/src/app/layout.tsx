import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "../providers/Web3Provider";
import AIAgent from "../components/AIAgent";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PasskeyGuard — Passkey-Secured Web3 Identity on Arbitrum Stylus",
  description:
    "Sign blockchain transactions with your biometric. P-256 ECDSA verified on-chain via Arbitrum Stylus. No seed phrases. No custody.",
  keywords: ["passkey", "WebAuthn", "Arbitrum", "Stylus", "Web3", "wallet", "P-256"],
  openGraph: {
    title: "PasskeyGuard",
    description: "Passkey-secured Web3 accounts on Arbitrum Stylus",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Web3Provider>
          {children}
          <AIAgent />
        </Web3Provider>
      </body>
    </html>
  );
}
