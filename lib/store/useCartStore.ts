import { create } from "zustand"
import { persist } from "zustand/middleware"

export type CartItem = {
  id: string
  category: string
  variant: string
  title: string
  quantity: number
  strongDirt: boolean
  secondSide: boolean
  needsPhotoQuote: boolean
  description?: string
  basePrice: number
}

type CartStore = {
  items: CartItem[]
  hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  addItem: (item: Omit<CartItem, "id">) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      addItem: (item) => set((state) => {
        const existing = state.items.find((current) =>
          current.category === item.category &&
          current.variant === item.variant &&
          current.strongDirt === item.strongDirt &&
          current.secondSide === item.secondSide &&
          current.description === item.description
        )
        if (existing) {
          return { items: state.items.map((current) => current.id === existing.id
            ? { ...current, quantity: Math.min(50, current.quantity + item.quantity) }
            : current) }
        }
        return { items: [...state.items, { ...item, id: crypto.randomUUID() }] }
      }),
      removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((item) => item.id === id
          ? { ...item, quantity: Math.max(1, Math.min(50, quantity)) }
          : item),
      })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "cleaning-cart-storage",
      skipHydration: true,
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
)
