import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { FEATURES } from "@/components/landing/data"

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10 max-w-xl">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#1F3D2E]">
          Everything a credit business runs on
        </h2>
        <p className="mt-3 text-[#1B1B18]/65">
          Built for how Pakistani traders already sell — on trust, on credit, and
          increasingly, on WhatsApp.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="border-[#1F3D2E]/10 bg-white">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F3D2E]/5">
                <Icon className="h-5 w-5 text-[#1F3D2E]" />
              </div>
              <CardTitle className="font-[family-name:var(--font-display)] text-lg">
                {title}
              </CardTitle>
              <CardDescription>{desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}
