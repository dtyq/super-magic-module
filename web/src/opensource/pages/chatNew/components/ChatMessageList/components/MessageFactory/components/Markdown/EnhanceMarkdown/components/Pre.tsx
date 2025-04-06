import { CodeLanguage } from "./Code/const"

function Pre({ children, ...props }: any) {
	try {
		const language = (children.props.className ?? "language-text").replace("language-", "")

		switch (language) {
			case CodeLanguage.Citation:
				return children
			default:
				return <pre lang={language}>{children}</pre>
		}
	} catch (error) {
		return <pre {...props?.node}>{children}</pre>
	}
}
export default Pre
