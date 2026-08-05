import Link from "next/link"
import { ArrowRight, ShieldAlert } from "lucide-react"
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
              Credit intelligence for distributors
            </Badge>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
              Know who to credit.
              <br />
              Recover what&apos;s{" "}
              <span className="text-[#D4A63A]">owed.</span>
            </h1>
            <p className="mt-5 max-w-md text-[#F7F1E4]/75">
              Wasooli turns your retailer ledgers into live credit risk — then
              follows up on overdue balances by SMS, automatically. Built for
              distributors who sell on trust and need cash back on time.
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
              render={<Link href="/signup" />}
              nativeButton={false}
              className="border-[#F7F1E4]/30 bg-transparent text-[#F7F1E4] hover:bg-[#F7F1E4]/10 hover:text-[#F7F1E4]"
            >
              Start free
            </Button>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4 bg-[#EDE7D6] px-8 py-12 md:px-10">
          <Card className="border-[#1F3D2E]/10 bg-white shadow-sm">
            <CardContent className="space-y-3 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[#1B1B18]/45">
                    Before credit sale
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-[#1F3D2E]">
                    Rana General Store
                  </p>
                  <p className="text-sm text-[#1B1B18]/55">Faisalabad · Outstanding Rs. 212,900</p>
                </div>
                <Badge variant="outline" className={RISK_STYLES.Medium}>
                  Medium risk
                </Badge>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-[#D4A63A]/10 px-3 py-2.5 text-sm text-[#7A5416]">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Monitor closely — avg. payment delay 21 days. Limit further credit.</span>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-xl border border-[#1F3D2E]/10 bg-white px-4 py-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[#1B1B18]/45">
                SMS reminder · Today 10:02 AM
              </span>
              <Badge
                variant="outline"
                className="border-[#2E9E63]/30 bg-[#2E9E63]/10 text-[10px] text-[#1F3D2E]"
              >
                Delivered
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-[#1B1B18]/80">
              Assalam-o-Alaikum, Rana General Store. Your outstanding with Malik
              Distributors is{" "}
              <span className="font-[family-name:var(--font-mono)] font-semibold text-[#1F3D2E]">
                Rs. 212,900
              </span>
              . Kindly clear at your earliest. JazzCash: 03xx-xxxxxxx
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-[#1B1B18]/60">
        <span className="font-[family-name:var(--font-mono)]">Built for FMCG &amp; trade credit</span>
        <Separator orientation="vertical" className="hidden h-4 md:block" />
        <span className="font-[family-name:var(--font-mono)]">SMS-first · WhatsApp optional</span>
        <Separator orientation="vertical" className="hidden h-4 md:block" />
        <span className="font-[family-name:var(--font-mono)]">Live risk on every sale</span>
      </div>
    </section>
  )
}
