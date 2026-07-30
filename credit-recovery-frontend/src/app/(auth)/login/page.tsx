import { Suspense } from "react"
import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <AuthShell title="Log in" subtitle="Access your digital khata.">
      <Suspense
        fallback={
          <p className="font-[family-name:var(--font-mono)] text-sm text-ink/60">Loading…</p>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
