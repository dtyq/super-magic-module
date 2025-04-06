import { useRef, type PropsWithChildren } from "react"
import type { ContactStore } from "@/opensource/stores/contact/types"
import { createContactStore } from "@/opensource/stores/contact"
import { userStore } from "@/opensource/models/user"
import { contactStoreContext } from "./context"

function ContactProvider({ children }: PropsWithChildren) {
	const storeRef = useRef<ContactStore | null>(null)

	return (
		<contactStoreContext.Consumer>
			{(s) => {
				const userId = userStore.user.userInfo?.user_id
				if (!storeRef.current && userId) {
					storeRef.current = createContactStore(userId)
				}

				return (
					<contactStoreContext.Provider value={s ?? storeRef.current}>
						{children}
					</contactStoreContext.Provider>
				)
			}}
		</contactStoreContext.Consumer>
	)
}

export default ContactProvider
