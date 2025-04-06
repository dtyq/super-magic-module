import type {
	OrganizationData,
	StructureItemOnCache,
	StructureUserItem,
} from "@/types/organization"
import type { createContactStore } from "."

export interface ContactState {
	organizations: Map<string, OrganizationData>
	departmentInfos: Map<string, StructureItemOnCache>
	userInfos: Map<string, StructureUserItem>
}

export type ContactStore = ReturnType<typeof createContactStore>
