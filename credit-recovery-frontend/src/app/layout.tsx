import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/toast"
import { AuthProvider } from "@/lib/auth/auth-provider"
import "./globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "900"],
})
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
})
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
})

export const metadata = {
  title: "Wasooli — Digital Khata",
  description: "Track credit sales, payments, and outstanding balances.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body className="font-[family-name:var(--font-body)] antialiased">
        <Toaster>
          <AuthProvider>{children}</AuthProvider>
        </Toaster>
      </body>
    </html>
  )
}
