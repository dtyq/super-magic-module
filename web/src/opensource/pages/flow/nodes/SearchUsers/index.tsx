import CommonHeaderRight from "../../common/CommonHeaderRight"
import SearchUsersV0 from "./v0/SearchUsers"
import SearchUsersV1 from "./v1/SearchUsers"

export const SearchUsersComponentVersionMap = {
	v0: {
		component: () => <SearchUsersV0 />,
		headerRight: <CommonHeaderRight />,
	},
	v1: {
		component: () => <SearchUsersV1 />,
		headerRight: <CommonHeaderRight />,
	},
}
