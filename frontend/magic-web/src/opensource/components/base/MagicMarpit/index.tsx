import { Marpit, Element } from "@marp-team/marpit"
import { createStyles } from "antd-style"
import type { HTMLAttributes } from "react"
import { useEffect, useMemo, useRef } from "react"
import Reveal from "reveal.js"
import "reveal.js/dist/reveal.css"
import "reveal.js/dist/theme/black.css"

interface MagicMarpitProps extends HTMLAttributes<HTMLDivElement> {
	content: string
}

const useStyles = createStyles(({ css }) => ({
	container: css`
		border: none;
		width: 100%;
		height: 100%;
		overflow: hidden;
		border-radius: 8px;
		background-color: black;
		aspect-ratio: 16/9;
	`,
}))

const MagicMarpit = ({ content, className }: MagicMarpitProps) => {
	const deckDivRef = useRef<HTMLDivElement>(null) // reference to deck container div
	const deckRef = useRef<Reveal.Api | null>(null) // reference to deck reveal instance

	const { styles, cx } = useStyles()

	const marpitRef = useRef<Marpit>(
		new Marpit({
			container: [
				new Element("div", { class: "reveal" }),
				new Element("div", { class: "slides" }),
			],
		}),
	)

	const { html, css } = useMemo(() => marpitRef.current.render(content), [content])

	if (deckDivRef.current) {
		deckDivRef.current.style.cssText = css
	}

	useEffect(() => {
		deckRef.current = new Reveal(deckDivRef.current!, {
			transition: "slide",
			width: 1920,
			height: 1080,
			loop: true,
		})

		deckRef.current.initialize().then(() => {
			// good place for event handlers and plugin setups
		})

		return () => {
			try {
				if (deckRef.current) {
					deckRef.current.destroy()
					deckRef.current = null
				}
			} catch (e) {
				console.warn("Reveal.js destroy call failed.")
			}
		}
	}, [content])

	if (!content) return null

	return (
		<div
			ref={deckDivRef}
			className={cx(styles.container, className, "reveal")}
			title="marpit"
			// eslint-disable-next-line react/no-danger
			dangerouslySetInnerHTML={{
				__html: html,
			}}
		/>
	)
}

export default MagicMarpit
