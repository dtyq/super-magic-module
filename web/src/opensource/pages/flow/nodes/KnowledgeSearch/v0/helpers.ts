import { KnowledgeType } from "./types"

export const getDefaultKnowledge = () => {
	return {
		knowledge_code: "",
		knowledge_type: KnowledgeType.KnowledgeDatabase,
		business_id: "",
		name: "",
		description: "",
	}
}
