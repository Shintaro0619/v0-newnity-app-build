import { create } from "zustand"

interface ProfileState {
  profile: any | null
  setProfile: (profile: any | null) => void
  clear: () => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  clear: () => {
    set({ profile: null })
    try {
      sessionStorage.removeItem("newnity.profile")
      localStorage.removeItem("profile")
      localStorage.removeItem("lastAddress")
    } catch (error) {
      // Storage not available
    }
  },
}))
