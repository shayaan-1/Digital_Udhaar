import Link from "next/link"
import { Button } from "@/components/ui/button"

type SiteHeaderProps = {
  onDemoClick: () => void
}

export function SiteHeader({ onDemoClick }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#1F3D2E]/10 bg-[#F7F1E4]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[#1F3D2E]">
          Wasooli
        </span>
        <nav className="hidden gap-8 text-sm font-medium text-[#1B1B18]/70 md:flex">
          <a href="#features" className="hover:text-[#1F3D2E]">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-[#1F3D2E]">
            How it works
          </a>
          <a href="#preview" className="hover:text-[#1F3D2E]">
            See it in action
          </a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-[#1B1B18]/70 hover:text-[#1F3D2E] sm:inline"
          >
            Log in
          </Link>
          <Button
            render={<Link href="/signup" />}
            nativeButton={false}
            className="bg-[#D4A63A] text-[#1F3D2E] hover:bg-[#D4A63A]/90"
          >
            Sign up
          </Button>
          <Button
            type="button"
            onClick={onDemoClick}
            className="bg-[#1F3D2E] text-[#F7F1E4] hover:bg-[#1F3D2E]/90"
          >
            Get a demo
          </Button>
        </div>
      </div>
    </header>
  )
}
