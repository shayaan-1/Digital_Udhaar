"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { getApiErrorMessage } from "@/lib/api/errors"
import { useAuth } from "@/lib/auth/auth-provider"
import { loginSchema } from "@/lib/validations"

type LoginForm = z.infer<typeof loginSchema>

export function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/app"

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginForm) {
    try {
      await login(values)
      router.replace(next.startsWith("/") ? next : "/app")
    } catch (error) {
      toast.add({
        title: "Login failed",
        description: getApiErrorMessage(error, "Invalid email or password."),
        type: "error",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@business.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-10 w-full bg-forest text-cream hover:bg-forest/90"
      >
        {isSubmitting ? "Signing in…" : "Log in"}
      </Button>
      <p className="text-center text-sm text-ink/65">
        New to Wasooli?{" "}
        <Link href="/signup" className="font-medium text-forest underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  )
}
