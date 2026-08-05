import { STEPS } from "@/components/landing/data"

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="border-y border-[#1F3D2E]/10 bg-[#1F3D2E]/[0.03] py-20"
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-10 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#1F3D2E]">
          From retailer ledger to recovered cash
        </h2>
        <div className="grid gap-8 md:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.n} className="relative">
              <span className="font-[family-name:var(--font-mono)] text-sm text-[#D4A63A]">
                {step.n}
              </span>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[#1F3D2E]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-[#1B1B18]/65">{step.desc}</p>
              {i < STEPS.length - 1 && (
                <div className="absolute -right-4 top-1 hidden h-px w-8 bg-[#1F3D2E]/15 md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
