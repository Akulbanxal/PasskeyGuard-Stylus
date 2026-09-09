import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        {children}
        <AIAgent />
      </body>
    </html>
  );
}
