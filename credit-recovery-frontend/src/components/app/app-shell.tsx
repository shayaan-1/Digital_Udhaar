"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  PlusCircle,
  Banknote,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-provider"
import { RequireAuth } from "@/lib/auth/require-auth"

const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/customers", label: "Customers", icon: Users },
  { href: "/app/settings", label: "Settings", icon: Settings },
]

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isOnboarding = pathname.startsWith("/app/onboarding")

  async function handleLogout() {
    await logout()
    router.replace("/login")
  }

  if (isOnboarding) {
    return <div className="min-h-screen bg-cream text-ink">{children}</div>
  }

  return (
    <div className="min-h-screen bg-cream text-ink md:flex">
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <Link
            href="/app"
            className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight"
          >
            Wasooli
          </Link>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-sidebar-foreground/55">
            Digital khata
          </p>
        </div>
        <div className="flex-1 px-3 py-4">
          <NavLinks pathname={pathname} />
          <div className="mt-6 space-y-1 border-t border-sidebar-border pt-4">
            <p className="px-3 pb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-sidebar-foreground/45">
              Quick actions
            </p>
            <Link
              href="/app/sales/new"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            >
              <PlusCircle className="size-4" />
              Record sale
            </Link>
            <Link
              href="/app/payments/new"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            >
              <Banknote className="size-4" />
              Record payment
            </Link>
          </div>
        </div>
        <div className="border-t border-sidebar-border p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-forest/10 bg-cream/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
            <span className="font-[family-name:var(--font-display)] text-lg font-bold text-forest">
              Wasooli
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              render={<Link href="/app/sales/new" />}
              nativeButton={false}
              className="hidden bg-gold text-forest hover:bg-gold/90 sm:inline-flex"
            >
              Record sale
            </Button>
            <Button
              size="sm"
              variant="outline"
              render={<Link href="/app/payments/new" />}
              nativeButton={false}
              className="hidden border-forest/20 sm:inline-flex"
            >
              Record payment
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar text-sidebar-foreground shadow-xl">
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
              <span className="font-[family-name:var(--font-display)] text-lg font-bold">
                Wasooli
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              <div className="mt-4 space-y-1 border-t border-sidebar-border pt-4">
                <Link
                  href="/app/sales/new"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75"
                >
                  <PlusCircle className="size-4" />
                  Record sale
                </Link>
                <Link
                  href="/app/payments/new"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75"
                >
                  <Banknote className="size-4" />
                  Record payment
                </Link>
              </div>
            </div>
            <div className="border-t border-sidebar-border p-3">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppShellInner>{children}</AppShellInner>
    </RequireAuth>
  )
}
