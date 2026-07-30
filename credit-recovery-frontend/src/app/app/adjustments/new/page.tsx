import { Suspense } from "react"
import { LoadingBlock } from "@/components/app/ui-states"
import { AdjustmentForm } from "./adjustment-form"

export default function NewAdjustmentPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading…" />}>
      <AdjustmentForm />
    </Suspense>
  )
}
