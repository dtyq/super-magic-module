import type { Bot } from "@/types/bot"
import type { PromptSection } from "../PromptSection/types"

export type AvatarCard = {
	id?: string
	icon?: string
	title: string
	description: string
	nickname?: string
}

export type PromptCard = Bot.BotItem | Bot.OrgBotItem

export interface PromptTabs {
	key: string
	tab: string
}

export type PromptCardWithType = PromptCard & { type?: PromptSection["type"] }
