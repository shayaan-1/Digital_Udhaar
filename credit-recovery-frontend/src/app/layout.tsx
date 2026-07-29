import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/toast"
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body className="font-[family-name:var(--font-body)]">
        <Toaster>{children}</Toaster>
      </body>
    </html>
  )
}