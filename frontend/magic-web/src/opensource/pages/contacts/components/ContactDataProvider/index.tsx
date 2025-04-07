import type { PropsWithChildren } from "react"
import { memo, useMemo, useState } from "react"
import { ContactViewType } from "../../constants"
import { ContactPageDataContext } from "./context"

const ContactPageDataProvider = memo(function ContactPageDataProvider({
	children,
}: PropsWithChildren) {
	const [currentDepartmentPath, setCurrentDepartmentPath] = useState<
		{ id: string; name: string }[]
	>([])
	const [viewType, setViewType] = useState<ContactViewType>(ContactViewType.LIST)

	const value = useMemo(
		() => ({ currentDepartmentPath, viewType, setCurrentDepartmentPath, setViewType }),
		[currentDepartmentPath, viewType],
	)

	return (
		<ContactPageDataContext.Provider value={value}>{children}</ContactPageDataContext.Provider>
	)
})

export default ContactPageDataProvider
