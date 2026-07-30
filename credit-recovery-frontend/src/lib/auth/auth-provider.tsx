"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import * as authApi from "@/lib/api/auth"
import type { AccessTokenResponse, LoginRequest, Role, SignupRequest } from "@/lib/api/types"
import { clearAccessToken, setAccessToken } from "@/lib/auth/token"

export type AuthUser = {
  userId: string
  businessId: string
  role: Role
}

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (payload: LoginRequest) => Promise<AccessTokenResponse>
  signup: (payload: SignupRequest) => Promise<AccessTokenResponse>
  logout: () => Promise<void>
  applySession: (session: AccessTokenResponse) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function sessionToUser(session: AccessTokenResponse): AuthUser {
  return {
    userId: session.user_id,
    businessId: session.business_id,
    role: session.role,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const applySession = useCallback((session: AccessTokenResponse) => {
    setAccessToken(session.access_token)
    setUser(sessionToUser(session))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const session = await authApi.refresh()
        if (cancelled) return
        applySession(session)
      } catch {
        if (!cancelled) {
          clearAccessToken()
          setUser(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [applySession])

  const login = useCallback(
    async (payload: LoginRequest) => {
      const session = await authApi.login(payload)
      applySession(session)
      return session
    },
    [applySession]
  )

  const signup = useCallback(
    async (payload: SignupRequest) => {
      const session = await authApi.signup(payload)
      applySession(session)
      return session
    },
    [applySession]
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // clear local session even if network fails
    } finally {
      clearAccessToken()
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      applySession,
    }),
    [user, isLoading, login, signup, logout, applySession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
