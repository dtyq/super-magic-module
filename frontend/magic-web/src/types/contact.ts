import type { PromptCard } from "@/opensource/pages/explore/components/PromptCard/types"

export interface SquareData {
	popular: PromptCard[]
	latest: PromptCard[]
}
export type Friend = {
	id: string
	user_id: string
	user_organization_code: string
	friend_id: string
	friend_organization_code: string
	remarks: string
	extra: string
	status: number
	created_at: string
	updated_at: string
	deleted_at: string | null
	friend_type: number
}
