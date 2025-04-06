import ExcelV0 from "./v0"
import ExcelTestBtnV0 from "./v0/components/ExcelHeaderRight"

export const ExcelComponentVersionMap = {
	v0: {
		component: () => <ExcelV0 />,
		headerRight: <ExcelTestBtnV0 />,
	},
}
