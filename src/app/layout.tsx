import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import { loadCurrentUser } from "@/features/auth/server/load-current-user";
import { CurrentUserProvider } from "@/features/auth/context/current-user-context";

export const metadata: Metadata = {
  title: "SuperNext - AI 사주풀이",
  description: "AI 기반 구독형 사주풀이 서비스",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await loadCurrentUser();

  return (
    <ClerkProvider localization={koKR}>
      <html lang="ko" suppressHydrationWarning>
        <body className="antialiased font-sans">
          <Providers>
            <CurrentUserProvider initialState={currentUser}>
              {children}
            </CurrentUserProvider>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
