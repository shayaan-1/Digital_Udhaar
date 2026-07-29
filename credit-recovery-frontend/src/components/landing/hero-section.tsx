import { ArrowRight, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RISK_STYLES } from "@/components/landing/data"

type HeroSectionProps = {
  onDemoClick: () => void
}

export function HeroSection({ onDemoClick }: HeroSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-14 pb-6">
      <div className="grid gap-0 overflow-hidden rounded-2xl border border-[#1F3D2E]/10 shadow-sm md:grid-cols-[1.1fr_1fr]">
        <div className="relative flex flex-col justify-between bg-[#1F3D2E] px-8 py-12 text-[#F7F1E4] md:px-12">
          <div
            className="pointer-events-none absolute inset-y-6 left-3 w-px bg-[repeating-linear-gradient(to_bottom,transparent,transparent_6px,#D4A63A55_6px,#D4A63A55_10px)]"
            aria-hidden
          />
          <div>
            <Badge className="mb-6 border border-[#D4A63A]/40 bg-transparent text-[#D4A63A]">
              Digital khata, WhatsApp reminders
            </Badge>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
              Every rupee owed,
              <br />
              tracked and{" "}
              <span className="text-[#D4A63A]">recovered.</span>
            </h1>
            <p className="mt-5 max-w-md text-[#F7F1E4]/75">
              Bhool gaye kaun kitna udhaar de raha hai? Wasooli turns your credit
              register into a ledger that reminds customers for you — on WhatsApp,
              automatically.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={onDemoClick}
              className="bg-[#D4A63A] text-[#1F3D2E] hover:bg-[#D4A63A]/90"
            >
              Get a demo <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<a href="#how-it-works" />}
              nativeButton={false}
              className="border-[#F7F1E4]/30 bg-transparent text-[#F7F1E4] hover:bg-[#F7F1E4]/10 hover:text-[#F7F1E4]"
            >
              See how it works
            </Button>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4 bg-[#EDE7D6] px-8 py-12 md:px-10">
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wide text-[#1B1B18]/50">
            Sent automatically · Today, 10:02 AM
          </span>
          <div className="ml-auto max-w-xs rounded-2xl rounded-tr-sm bg-[#2E9E63] px-4 py-3 text-sm text-white shadow-md">
            <p>Assalam-o-Alaikum, Rana Cloth House.</p>
            <p className="mt-2">
              Your outstanding balance is{" "}
              <span className="font-[family-name:var(--font-mono)] font-semibold">
                Rs. 212,900
              </span>
              . Kindly clear at your earliest convenience.
            </p>
            <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-white/80">
              10:02 AM <CheckCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mr-auto max-w-xs rounded-2xl rounded-tl-sm border border-[#1F3D2E]/10 bg-white px-4 py-3 text-sm shadow-sm">
            Will pay by Friday, bhai. Please share the Easypaisa number again.
          </div>
          <Card className="mt-4 border-[#1F3D2E]/10 bg-white/70">
            <CardContent className="flex items-center justify-between py-3 text-sm">
              <span className="text-[#1B1B18]/60">Reminder logged to ledger</span>
              <Badge variant="outline" className={RISK_STYLES.Medium}>
                Medium risk
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-[#1B1B18]/60">
        <span className="font-[family-name:var(--font-mono)]">Rs. 40Cr+ tracked</span>
        <Separator orientation="vertical" className="hidden h-4 md:block" />
        <span className="font-[family-name:var(--font-mono)]">1,200+ traders</span>
        <Separator orientation="vertical" className="hidden h-4 md:block" />
        <span className="font-[family-name:var(--font-mono)]">
          Avg. 11 day faster recovery
        </span>
      </div>
    </section>
  )
}
