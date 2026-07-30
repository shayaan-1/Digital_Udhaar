import { Suspense } from "react"
import { LoadingBlock } from "@/components/app/ui-states"
import { CreditSaleForm } from "./credit-sale-form"

export default function NewCreditSalePage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading…" />}>
      <CreditSaleForm />
    </Suspense>
  )
}
