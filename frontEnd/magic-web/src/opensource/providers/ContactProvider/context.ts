import type { ContactStore } from "@/opensource/stores/contact/types"
import { createContext } from "react"

export const contactStoreContext = createContext<ContactStore | null>(null)
