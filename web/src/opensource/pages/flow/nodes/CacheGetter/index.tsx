import CommonHeaderRight from "../../common/CommonHeaderRight"
import CacheGetterV0 from "./v0/CacheGetter"
import CacheGetterV1 from "./v1/CacheGetter"

export const CacheGetterComponentVersionMap = {
	v0: {
		component: () => <CacheGetterV0 />,
		headerRight: <CommonHeaderRight />,
	},
	v1: {
		component: () => <CacheGetterV1 />,
		headerRight: <CommonHeaderRight />,
	},
}
