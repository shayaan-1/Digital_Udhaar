"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { BusinessFormFields } from "@/components/app/business-form"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STEPS = ["Profile", "Payment instructions"] as const

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="mb-8 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-forest">
          Wasooli
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-forest">
          Set up your business
        </h1>
        <p className="mt-2 text-sm text-ink/65">
          These details show on statements and reminders later.
        </p>
      </div>

      <div className="mb-6 flex items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full font-[family-name:var(--font-mono)] text-xs font-medium",
                i <= step ? "bg-gold text-forest" : "bg-sand text-ink/50"
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className={cn("text-sm", i <= step ? "text-forest" : "text-ink/45")}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-forest/20" />}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-forest/10 bg-white p-6 shadow-sm md:p-8">
        {step === 0 ? (
          <div className="space-y-5">
            <p className="text-sm text-ink/65">
              Confirm your business name and contact details. You can edit these anytime in
              Settings.
            </p>
            <BusinessFormFields
              submitLabel="Continue"
              onSuccess={() => setStep(1)}
              showSkip
              onSkip={() => setStep(1)}
            />
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-ink/65">
              Add how customers should pay you — bank account, JazzCash, or Easypaisa.
            </p>
            <BusinessFormFields
              submitLabel="Finish setup"
              onSuccess={() => router.replace("/app")}
              showSkip
              onSkip={() => router.replace("/app")}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(0)}
              className="text-ink/60"
            >
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
