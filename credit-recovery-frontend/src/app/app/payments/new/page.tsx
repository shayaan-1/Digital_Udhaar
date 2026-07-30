import { Suspense } from "react"
import { LoadingBlock } from "@/components/app/ui-states"
import { PaymentForm } from "./payment-form"

export default function NewPaymentPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading…" />}>
      <PaymentForm />
    </Suspense>
  )
}
