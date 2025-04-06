import KnowledgeSearchTestBtnV0 from "./v0/components/KnowledgeSearchHeaderRight"
import KnowledgeSearchV0 from "./v0/KnowledgeSearch"
import KnowledgeSearchTestBtnV1 from "./v1/components/KnowledgeSearchTestBtn"
import KnowledgeSearchV1 from "./v1/KnowledgeSearch"

export const KnowledgeSearchComponentVersionMap = {
	v0: {
		component: () => <KnowledgeSearchV0 />,
		headerRight: <KnowledgeSearchTestBtnV0 />,
	},
	v1: {
		component: () => <KnowledgeSearchV1 />,
		headerRight: <KnowledgeSearchTestBtnV1 />,
	},
}
