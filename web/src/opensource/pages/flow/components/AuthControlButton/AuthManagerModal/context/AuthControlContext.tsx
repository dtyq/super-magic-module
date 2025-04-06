import type { Dispatch, PropsWithChildren, SetStateAction } from "react"
import { createContext, useContext, useMemo } from "react"
import type { AuthMember } from "../../types"
import type { ManagerModalType } from "../types"

type ContextProps = {
	authList: AuthMember[]
	originalAuthList: AuthMember[]
	addAuthMembers: (members: AuthMember[]) => void
	deleteAuthMembers: (members: AuthMember[]) => void
	updateAuthMember: (member: AuthMember) => void
	setAuthList: Dispatch<SetStateAction<AuthMember[]>>
	setOriginalAuthList: Dispatch<SetStateAction<AuthMember[]>>
	type: ManagerModalType
}

const AuthControlContext = createContext({} as ContextProps)

export const AuthControlProvider = ({
	children,
	authList,
	originalAuthList,
	addAuthMembers,
	deleteAuthMembers,
	updateAuthMember,
	setAuthList,
	setOriginalAuthList,
	type,
}: PropsWithChildren<ContextProps>) => {
	const value = useMemo(() => {
		return {
			authList,
			originalAuthList,
			addAuthMembers,
			deleteAuthMembers,
			updateAuthMember,
			setAuthList,
			setOriginalAuthList,
			type,
		}
	}, [
		authList,
		originalAuthList,
		addAuthMembers,
		deleteAuthMembers,
		updateAuthMember,
		setAuthList,
		setOriginalAuthList,
		type,
	])

	return <AuthControlContext.Provider value={value}>{children}</AuthControlContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthControl = () => {
	return useContext(AuthControlContext)
}
