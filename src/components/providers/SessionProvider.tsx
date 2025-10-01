"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"

interface SessionProviderProps {
  children: React.ReactNode
  session?: any
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  // For development, we'll provide a simple wrapper that handles errors gracefully
  try {
    return (
      <NextAuthSessionProvider session={session}>
        {children}
      </NextAuthSessionProvider>
    )
  } catch (error) {
    console.warn('NextAuth error (development mode):', error);
    // Return children without session provider if there's an error
    return <>{children}</>;
  }
}