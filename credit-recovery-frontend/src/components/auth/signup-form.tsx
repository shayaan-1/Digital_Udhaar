"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { getApiErrorMessage } from "@/lib/api/errors"
import { useAuth } from "@/lib/auth/auth-provider"
import { signupSchema } from "@/lib/validations"

type SignupForm = z.infer<typeof signupSchema>

export function SignupForm() {
  const { signup } = useAuth()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { business_name: "", email: "", password: "" },
  })

  async function onSubmit(values: SignupForm) {
    try {
      await signup(values)
      toast.add({
        title: "Welcome to Wasooli",
        description: "Your account is ready. Complete your business profile next.",
        type: "success",
      })
      router.replace("/app/onboarding")
    } catch (error) {
      toast.add({
        title: "Signup failed",
        description: getApiErrorMessage(error, "Could not create your account."),
        type: "error",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="business_name">Business name</Label>
        <Input
          id="business_name"
          placeholder="e.g. Malik Traders"
          aria-invalid={!!errors.business_name}
          {...register("business_name")}
        />
        {errors.business_name && (
          <p className="text-sm text-destructive">{errors.business_name.message}</p>
        )}
      </div>
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
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : (
          <p className="text-xs text-ink/55">
            At least 10 characters, with upper, lower, and a digit.
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-10 w-full bg-gold text-forest hover:bg-gold/90"
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-ink/65">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-forest underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  )
}
