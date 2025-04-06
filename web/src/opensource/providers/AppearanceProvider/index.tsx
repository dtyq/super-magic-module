import type { PropsWithChildren } from "react"
import ThemeProvider from "../ThemeProvider"
import LocaleProvider from "./LocaleProvider"

const AppearanceProvider = ({ children }: PropsWithChildren) => {
	return (
		<LocaleProvider>
			<ThemeProvider>{children}</ThemeProvider>
		</LocaleProvider>
	)
}

export default AppearanceProvider
