import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Dashboard } from "@/components/dashboard"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Dashboard IoT CO₂",
  description: "Dashboard para visualizar mediciones de CO₂",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SidebarProvider>
            <Dashboard>{children}</Dashboard>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
