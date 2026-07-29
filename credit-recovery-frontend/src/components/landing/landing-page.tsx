"use client"

import { useState } from "react"
import { SiteHeader } from "@/components/landing/site-header"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { ProductPreviewSection } from "@/components/landing/product-preview-section"
import { CtaSection } from "@/components/landing/cta-section"
import { SiteFooter } from "@/components/landing/site-footer"
import { DemoRequestDialog } from "@/components/landing/demo-request-dialog"

export function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false)

  function openDemo() {
    setDemoOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#F7F1E4] font-[family-name:var(--font-body)] text-[#1B1B18]">
      <SiteHeader onDemoClick={openDemo} />
      <HeroSection onDemoClick={openDemo} />
      <FeaturesSection />
      <HowItWorksSection />
      <ProductPreviewSection />
      <CtaSection onDemoClick={openDemo} />
      <SiteFooter />
      <DemoRequestDialog open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  )
}
