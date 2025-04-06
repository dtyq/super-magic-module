import i18next from "i18next"
import { KnowledgeType } from "./types"

export enum KnowledgeStatus {
	UnVectored = 0,
	Vectoring = 1,
	Vectored = 2,
	VectorFail = 3,
}

export const knowledgeTypeOptions = [
	{
		label: i18next.t("common.knowledgeDatabase", { ns: "flow" }),
		value: KnowledgeType.KnowledgeDatabase,
	},
]
