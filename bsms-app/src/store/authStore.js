import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialised: false,

  /**
   * Called once on app mount. Checks for an existing Supabase session
   * and fetches the user's profile if a session exists.
   */
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await get()._loadProfile(session.user)
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      set({ loading: false, initialised: true })
    }

    // Listen for auth state changes (token refresh, logout from another tab, etc.)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await get()._loadProfile(session.user)
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profile: null })
      }
    })
  },

  /**
   * Internal: fetches the profile row for the given auth user.
   */
  _loadProfile: async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) throw error
      set({ user: authUser, profile })
    } catch (error) {
      console.error('Error loading profile:', error)
      set({ user: authUser, profile: null })
    }
  },

  /**
   * Signs in with email and password.
   * Returns { data, error } — the caller handles navigation.
   */
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { data: null, error }

    // Load the profile immediately after sign-in
    if (data.user) {
      await get()._loadProfile(data.user)
    }
    return { data, error: null }
  },

  /**
   * Signs out and clears local state.
   * Navigation to '/' is handled by the caller using React Router's navigate().
   */
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  /**
   * Helper: returns the current user's role from their profile.
   */
  getRole: () => {
    const { profile } = get()
    return profile?.role ?? null
  },
}))
