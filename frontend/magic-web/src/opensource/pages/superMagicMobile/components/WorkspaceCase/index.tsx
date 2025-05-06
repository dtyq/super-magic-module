import { cx } from "antd-style"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import WorkspaceCaseScrollbar from "../WorkspaceCaseScrollbar"
import { useResponsive } from "ahooks"
import { useStyles } from "./styles"

interface WorkspaceCaseProps {
	className?: string
	style?: React.CSSProperties
}

export default memo(function WorkspaceCase({ className, style }: WorkspaceCaseProps) {
	const { styles } = useStyles()
	const responsive = useResponsive()
	const isMobile = responsive.md === false
	const containerRef = useRef<HTMLDivElement>(null)
	const contentRef = useRef<HTMLDivElement>(null)
	const [scrollLeft, setScrollLeft] = useState(0)
	const [list, setList] = useState<any[]>([])
	const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		setScrollLeft(e.currentTarget.scrollLeft)
	}, [])

	useEffect(() => {
		fetch(`https://super-magic-v1.tos-cn-guangzhou.volces.com/cases.json?t=${Date.now()}`, {
			mode: "cors",
		})
			.then((res) => res.json())
			.then((res) => {
				setList(res?.[0]?.children || [])
			})
	}, [])

	const openInNewTab = (url: string) => {
		const a = document.createElement("a")
		a.href = url
		a.target = "_blank"
		a.rel = "noopener noreferrer"
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
	}

	return (
		<div className={cx(styles.container, className)} style={style}>
			<div ref={containerRef} className={styles.list} onScroll={handleScroll}>
				<div ref={contentRef} className={styles.listContent}>
					{list?.map((item) => {
						return (
							<div
								className={styles.item}
								key={item.title}
								onClick={() => {
									openInNewTab(item.url)
								}}
							>
								<div className={styles.title}>{item.title}</div>
								<div className={styles.description}>{item.subTitle}</div>
								{item?.image ? (
									<img className={styles.image} src={item.image} alt="" />
								) : (
									<div className={styles.image} />
								)}
							</div>
						)
					})}
				</div>
			</div>
			<WorkspaceCaseScrollbar
				className={styles.scrollbar}
				contentContainerRef={containerRef}
				contentRef={contentRef}
				scrollLeft={scrollLeft}
			/>
		</div>
	)
})
