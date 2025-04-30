import { useMount, useResponsive } from "ahooks"
import { useEffect, useMemo, useRef, useState } from "react"
import "swiper/css"
import "swiper/css/mousewheel"
import "swiper/css/scrollbar"
import { Mousewheel, Scrollbar } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"
import arrowBottomImage from "../../assets/svg/arrow-bottom.svg"
import magicBetaImage from "../../assets/svg/magic-beta.svg"
import type { MessagePanelProps } from "../MessagePanel/MessagePanel"
import MessagePanel from "../MessagePanel/MessagePanel"
import useStyles from "./style"
interface EmptyWorkspacePanelProps {
	messagePanelProps?: MessagePanelProps
}

export default function EmptyWorkspacePanel(props: EmptyWorkspacePanelProps) {
	const { messagePanelProps } = props
	const responsive = useResponsive()
	const isMobile = responsive.md === false
	const { styles, cx } = useStyles()
	const [list, setList] = useState<any[]>([])
	const messagePanelContainerRef = useRef<HTMLDivElement>(null)

	const [activeGroupKey, setActiveGroupKey] = useState<string>("0")

	const [offsetLeft, setOffsetLeft] = useState<number | null>(null)

	useEffect(() => {
		fetch(`https://super-magic-v1.tos-cn-guangzhou.volces.com/cases.json?t=${Date.now()}`, {
			mode: "cors",
		})
			.then((res) => res.json())
			.then((res) => {
				setList(res)
			})
	}, [])

	const currentGroup = useMemo(() => {
		return list.find((item) => item.key === activeGroupKey)
	}, [activeGroupKey, list])

	const updateOffsetLeft = () => {
		if (!messagePanelContainerRef.current) return
		const containerWidth = messagePanelContainerRef.current.offsetWidth
		const windowWidth = window.innerWidth
		const offset = Math.max(0, (windowWidth - containerWidth) / 2)
		setOffsetLeft(offset)
	}

	useMount(() => {
		updateOffsetLeft()
	})

	useEffect(() => {
		window.addEventListener("resize", updateOffsetLeft)
		return () => {
			window.removeEventListener("resize", updateOffsetLeft)
		}
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
		<div className={styles.emptyWorkspacePanelContainer}>
			<img src={magicBetaImage} alt="magic" className={styles.magicBetaImage} />
			<div className={styles.emptyWorkspacePanelTitle}>👋 嗨，我的朋友</div>
			<div className={styles.emptyWorkspacePanelSubTitle}>有什么麦吉可以帮你吗？</div>
			<div className={styles.emptyWorkspacePanelCaseTitle}>「✨ 百倍生产力案例」</div>
			<img src={arrowBottomImage} alt="arrow-bottom" className={styles.arrowBottomImage} />
			<div className={styles.emptyWorkspacePanelCaseTypeList}>
				{list.map((item) => {
					const isActive = activeGroupKey === item.key
					return (
						<div
							key={item.key}
							className={cx(
								styles.emptyWorkspacePanelCaseTypeItem,
								isActive && styles.emptyWorkspacePanelCaseTypeItemActive,
							)}
							onClick={() => {
								setActiveGroupKey(item.key)
							}}
						>
							{item.name}
						</div>
					)
				})}
			</div>
			<div
				className={styles.emptyWorkspacePanelCase}
				style={{ visibility: offsetLeft === null ? "hidden" : "visible" }}
			>
				<Swiper
					className={styles.swiper}
					loop={false}
					autoplay={false}
					slidesPerView="auto"
					slidesOffsetBefore={offsetLeft || 0}
					spaceBetween={20}
					scrollbar={{
						enabled: true,
						draggable: true,
						dragSize: 30,
					}}
					mousewheel={{
						enabled: true,
						forceToAxis: true,
						releaseOnEdges: true,
						sensitivity: 0.9,
					}}
					speed={800}
					modules={[Mousewheel, Scrollbar]}
				>
					{currentGroup?.children.map((item: any, index: number) => {
						return (
							<SwiperSlide
								key={`${index.toString()}-1`}
								className={styles.swiperSlide}
								onClick={() => {
									if (isMobile) {
										openInNewTab(item.url)
									} else {
										window.open(item.url, "_blank")
									}
									// onItemClick(item)
								}}
							>
								<div className={cx(styles.emptyWorkspacePanelCaseItem)}>
									<div className={styles.emptyWorkspacePanelCaseItemTitle}>
										{item.title}
									</div>
									<div className={styles.emptyWorkspacePanelCaseItemSubTitle}>
										{item.subTitle}
									</div>
									{item.image ? (
										<img
											src={item.image}
											className={styles.emptyWorkspacePanelCaseItemImage}
										/>
									) : (
										<div className={styles.emptyWorkspacePanelCaseItemImage} />
									)}
								</div>
							</SwiperSlide>
						)
					})}
				</Swiper>
			</div>
			<div className={styles.messagePanelWrapper}>
				<MessagePanel
					containerRef={messagePanelContainerRef}
					{...messagePanelProps}
					className={styles.messagePanel}
					textAreaWrapperClassName={styles.messagePanelTextAreaWrapper}
				/>
			</div>
		</div>
	)
}
