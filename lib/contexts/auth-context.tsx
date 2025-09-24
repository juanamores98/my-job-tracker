"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

import {
  createDefaultSettings,
  findUserByEmail,
  findUserByUsername,
  getActiveUser,
  getUserProfile,
  saveJobStates,
  saveJobs,
  saveUserProfile,
  saveUserSettings,
  setActiveUserId,
  upsertUser,
} from "@/lib/storage"
import { defaultJobStates, initialJobs } from "@/lib/data"
import type { LocalUser, UserProfile } from "@/lib/types"

interface RegisterPayload extends UserProfile {
  password: string
  remember?: boolean
}

interface LoginPayload {
  identifier: string
  password: string
  remember?: boolean
}

interface AuthContextValue {
  user: LocalUser | null
  loading: boolean
  register: (payload: RegisterPayload) => Promise<LocalUser>
  login: (payload: LoginPayload) => Promise<LocalUser>
  logout: () => void
  updateProfile: (profile: Partial<UserProfile>) => Promise<LocalUser | null>
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const hashPassword = async (password: string) => {
  if (!password) return ""
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initialize = () => {
      const activeUser = getActiveUser()
      if (activeUser) {
        setUser(activeUser)
      } else {
        setActiveUserId(null)
        setUser(null)
      }
      setLoading(false)
    }

    try {
      initialize()
    } catch (error) {
      console.error("Failed to initialize auth state", error)
      setLoading(false)
    }
  }, [])

  const refreshUser = useCallback(() => {
    const activeUser = getActiveUser()
    if (activeUser) {
      setUser(activeUser)
    }
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const {
      password,
      remember = true,
      fullName,
      username,
      email,
      phone,
      birthday,
      preferences,
      skills = [],
      studies = [],
      university,
      school,
      highSchool,
      about,
      photo,
    } = payload

    const trimmedUsername = username.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedUsername) {
      throw new Error("Username is required")
    }

    if (!trimmedEmail) {
      throw new Error("Email is required")
    }

    if (!password) {
      throw new Error("Password is required")
    }

    if (findUserByUsername(trimmedUsername)) {
      throw new Error("Username already exists")
    }

    if (findUserByEmail(trimmedEmail)) {
      throw new Error("Email already registered")
    }

    const passwordHash = await hashPassword(password)
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now().toString()
    const timestamp = new Date().toISOString()

    const newUser: LocalUser = {
      id,
      fullName,
      username: trimmedUsername,
      email: trimmedEmail,
      phone,
      birthday,
      preferences,
      skills,
      studies,
      university,
      school,
      highSchool,
      about,
      photo,
      passwordHash,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    upsertUser(newUser)
    setActiveUserId(newUser.id, remember)
    setUser(newUser)

    // Initialize scoped data for the new user
    saveUserProfile({
      fullName,
      username: trimmedUsername,
      email: trimmedEmail,
      phone,
      birthday,
      preferences,
      skills,
      studies,
      university,
      school,
      highSchool,
      about,
      photo,
    })
    saveUserSettings(createDefaultSettings())
    saveJobStates(defaultJobStates.map((state) => ({ ...state })))
    saveJobs(initialJobs.map((job) => ({ ...job })))

    return newUser
  }, [])

  const login = useCallback(async ({ identifier, password, remember = true }: LoginPayload) => {
    const trimmedIdentifier = identifier.trim()
    if (!trimmedIdentifier || !password) {
      throw new Error("Missing credentials")
    }

    const normalizedIdentifier = trimmedIdentifier.toLowerCase()
    const matchedUser =
      findUserByUsername(normalizedIdentifier) || findUserByEmail(normalizedIdentifier) ||
      findUserByEmail(trimmedIdentifier) ||
      findUserByUsername(trimmedIdentifier)

    if (!matchedUser) {
      throw new Error("Account not found")
    }

    const hash = await hashPassword(password)
    if (hash !== matchedUser.passwordHash) {
      throw new Error("Invalid credentials")
    }

    setActiveUserId(matchedUser.id, remember)
    setUser(matchedUser)
    return matchedUser
  }, [])

  const logout = useCallback(() => {
    setActiveUserId(null)
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (profile: Partial<UserProfile>) => {
    const existingProfile = getUserProfile()
    const mergedProfile: UserProfile = {
      ...existingProfile,
      ...profile,
      skills: profile.skills ?? existingProfile.skills ?? [],
      studies: profile.studies ?? existingProfile.studies ?? [],
    }

    saveUserProfile(mergedProfile)
    const refreshedUser = getActiveUser()
    if (refreshedUser) {
      setUser(refreshedUser)
    }
    return refreshedUser ?? null
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    register,
    login,
    logout,
    updateProfile,
    refreshUser,
  }), [user, loading, register, login, logout, updateProfile, refreshUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
