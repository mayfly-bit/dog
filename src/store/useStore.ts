import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Dog, User, AppState } from '@/types'

interface StoreState extends AppState {
  // Actions
  setUser: (user: User | null) => void
  setDogs: (dogs: Dog[]) => void
  addDog: (dog: Dog) => void
  updateDog: (id: string, updates: Partial<Dog>) => void
  deleteDog: (id: string) => void
  setSelectedDog: (dog: Dog | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useStore = create<StoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        dogs: [],
        selectedDog: null,
        loading: false,
        error: null,

        // Actions
        setUser: (user) => set({ user }),
        
        setDogs: (dogs) => set({ dogs }),
        
        addDog: (dog) => set((state) => ({ 
          dogs: [...state.dogs, dog] 
        })),
        
        updateDog: (id, updates) => set((state) => ({
          dogs: state.dogs.map((dog) => 
            dog.id === id ? { ...dog, ...updates } : dog
          ),
          selectedDog: state.selectedDog?.id === id 
            ? { ...state.selectedDog, ...updates } 
            : state.selectedDog
        })),
        
        deleteDog: (id) => set((state) => ({
          dogs: state.dogs.filter((dog) => dog.id !== id),
          selectedDog: state.selectedDog?.id === id ? null : state.selectedDog
        })),
        
        setSelectedDog: (dog) => set({ selectedDog: dog }),
        
        setLoading: (loading) => set({ loading }),
        
        setError: (error) => set({ error }),
        
        clearError: () => set({ error: null }),
      }),
      {
        name: 'pet-breeding-storage',
        partialize: (state) => ({ 
          user: state.user,
          selectedDog: state.selectedDog 
        }),
      }
    ),
    { name: 'pet-breeding-store' }
  )
) 