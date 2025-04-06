import CommonHeaderRight from "../../common/CommonHeaderRight"
import CacheSetterV0 from "./v0/CacheSetter"

export const CacheSetterComponentVersionMap = {
	v0: {
		component: () => <CacheSetterV0 />,
		headerRight: <CommonHeaderRight />,
	},
}
