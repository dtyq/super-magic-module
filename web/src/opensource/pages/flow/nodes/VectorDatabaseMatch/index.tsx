import CommonHeaderRight from "../../common/CommonHeaderRight"
import VectorDatabaseMatchV0 from "./v0/VectorDatabaseMatch"

export const VectorDatabaseMatchComponentVersionMap = {
	v0: {
		component: () => <VectorDatabaseMatchV0 />,
		headerRight: <CommonHeaderRight />,
	},
}
