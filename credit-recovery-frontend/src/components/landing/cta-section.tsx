import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type CtaSectionProps = {
  onDemoClick: () => void
}

export function CtaSection({ onDemoClick }: CtaSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="rounded-2xl bg-[#1F3D2E] px-8 py-14 text-center text-[#F7F1E4] md:px-16">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Stop guessing who will pay late.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[#F7F1E4]/70">
          Set up your retailer ledger in an afternoon. Let risk scores guide
          credit — and SMS handle the follow-up.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            render={<Link href="/signup" />}
            nativeButton={false}
            className="bg-[#D4A63A] text-[#1F3D2E] hover:bg-[#D4A63A]/90"
          >
            Start free <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onDemoClick}
            className="border-[#F7F1E4]/30 bg-transparent text-[#F7F1E4] hover:bg-[#F7F1E4]/10 hover:text-[#F7F1E4]"
          >
            Request a demo
          </Button>
        </div>
      </div>
    </section>
  )
}
