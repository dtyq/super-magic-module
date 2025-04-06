import RecordOperationV0 from "./v0"
import RecordOperationHeaderRightV0 from "./v0/components/RecordOperationHeaderRight"

export const RecordAddOperationComponentVersionMap = {
	v0: {
		component: () => <RecordOperationV0 type="add" />,
		headerRight: <RecordOperationHeaderRightV0 />,
	},
}

export const RecordUpdateOperationComponentVersionMap = {
	v0: {
		component: () => <RecordOperationV0 type="update" />,
		headerRight: <RecordOperationHeaderRightV0 />,
	},
}

export const RecordSearchOperationComponentVersionMap = {
	v0: {
		component: () => <RecordOperationV0 type="search" />,
		headerRight: <RecordOperationHeaderRightV0 />,
	},
}

export const RecordDeleteOperationComponentVersionMap = {
	v0: {
		component: () => <RecordOperationV0 type="delete" />,
		headerRight: <RecordOperationHeaderRightV0 />,
	},
}
