import type { Options as MarkdownOptions } from "react-markdown"
import MagicCitation from "./MagicCitation"

const Sup: Exclude<MarkdownOptions["components"], null | undefined>["sup"] = (props) => {
	// eslint-disable-next-line react/prop-types
	const { className, children, node } = props

	switch (true) {
		// @ts-ignore
		// eslint-disable-next-line react/prop-types
		case node?.children?.[0]?.properties?.dataFootnoteRef === "":
			const reference = Number(
				// @ts-ignore
				// eslint-disable-next-line react/prop-types
				node.children[0].properties.href.replace("#user-content-fn-", ""),
			)
			return <MagicCitation index={reference} />
		default:
			return <sup className={className}>{children}</sup>
	}
}

export default Sup
