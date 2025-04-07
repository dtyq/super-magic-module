import type { PropsWithChildren } from "react"
import { createContext, useContext, useMemo } from "react"
import type { AuthSearchTypes } from "../hooks/useTabs"

type ContextProps = {
	keyword: string
	tab: AuthSearchTypes
}

const SearchPanelContext = createContext({} as ContextProps)

export const SearchPanelProvider = ({
	children,
	keyword,
	tab,
}: PropsWithChildren<ContextProps>) => {
	const value = useMemo(() => {
		return {
			keyword,
			tab,
		}
	}, [keyword, tab])

	return <SearchPanelContext.Provider value={value}>{children}</SearchPanelContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSearchPanel = () => {
	return useContext(SearchPanelContext)
}
