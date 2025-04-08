import type { ContactViewType } from "../../constants"

export interface ContactPageDataContextValue {
	currentDepartmentPath: { id: string; name: string }[]
	viewType: ContactViewType
	setCurrentDepartmentPath: (currentDepartmentPath: { id: string; name: string }[]) => void
	setViewType: (viewType: ContactViewType) => void
}
