import { PageHeader } from "@/components/app/page-header"
import { BusinessFormFields } from "@/components/app/business-form"

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Update your business profile and payment instructions."
      />
      <div className="max-w-xl rounded-xl border border-forest/10 bg-white p-6 shadow-sm">
        <BusinessFormFields />
      </div>
    </div>
  )
}
