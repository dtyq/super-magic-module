import { Empty, Flex } from "antd"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSize, useBoolean, useUpdateEffect, useMemoizedFn } from "ahooks"
import MagicButton from "@/opensource/components/base/MagicButton"
import { IconWand } from "@tabler/icons-react"
import { debounce } from "lodash-es"
import MagicSpin from "@/opensource/components/base/MagicSpin"
import { useStyles } from "../style"
import type { Image } from "../index"
import ImageWrapper from "./ImageWrapper"

interface WaterfallListProps {
	data: Image[]
	onImageClick: (prompt: string) => void
}

const WaterfallList = memo(({ data, onImageClick, ...rest }: WaterfallListProps) => {
	const { t } = useTranslation("interface")

	const wrapperRef = useRef<HTMLDivElement>(null)

	const { styles, cx } = useStyles()

	const [current, setCurrent] = useState<string | null>(null)

	const [isPaused, { setTrue: setPausedTrue, setFalse: setPausedFalse }] = useBoolean(false)
	const [errorList, setErrorList] = useState<string[]>([])

	const wrapperSize = useSize(wrapperRef)

	const columns = useMemo(() => {
		if (!wrapperSize) return 5

		if (wrapperSize.width === 0) return 5
		if (wrapperSize.width < 576) return 3
		if (wrapperSize.width < 768) return 3
		if (wrapperSize.width < 992) return 3
		if (wrapperSize.width < 1200) return 4
		return 5
	}, [wrapperSize])

	const itemWidth = useMemo(() => {
		if (!wrapperSize) return 200
		return (wrapperSize.width - (columns - 1)) / columns
	}, [columns, wrapperSize])

	useUpdateEffect(() => {
		if (!wrapperRef.current) return

		setPausedTrue()
		wrapperRef?.current?.scrollTo({ top: 0, behavior: "smooth" })

		const timer = setTimeout(() => {
			setPausedFalse()
		}, 200)

		// eslint-disable-next-line consistent-return
		return () => clearTimeout(timer)
	}, [data])

	useEffect(() => {
		if (!wrapperRef.current || !wrapperSize) return
		const items = wrapperRef.current.querySelectorAll(".waterfallItem")
		const worker = new Worker(new URL("../worker/calculateHeight.worker.js", import.meta.url))
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const card = entry.target as HTMLDivElement
						const img = card.querySelector("img[data-src]") as HTMLImageElement
						if (img) {
							const processImage = () => {
								if (img.naturalHeight === 0 || img.naturalWidth === 0) return
								worker.postMessage({
									id: card.dataset.id,
									naturalWidth: img.naturalWidth,
									naturalHeight: img.naturalHeight,
									itemWidth,
								})
							}
							img.src = img.dataset.src || ""
							// img.removeAttribute("data-src");
							img.onload = processImage
						}
						observer.unobserve(card)
					}
				})
			},
			{
				root: wrapperRef.current,
				rootMargin: "0px 0px 800px 0px",
			},
		)

		items.forEach((item) => observer.observe(item))

		worker.onmessage = (e) => {
			const { id, rows } = e.data
			const card = wrapperRef.current?.querySelector(`[data-id="${id}"]`) as HTMLDivElement
			if (card) {
				// const img = card.querySelector("img") as HTMLImageElement
				// img.style.height = `${imgHeight}px`
				card.style.gridRowEnd = `span ${rows}`
			}
		}

		// eslint-disable-next-line consistent-return
		return () => {
			items.forEach((item) => observer.unobserve(item))
			// observer.disconnect();
			if (worker) worker.terminate()
		}
	}, [data, columns, itemWidth, wrapperRef, wrapperSize])

	const handleMouseEnter = debounce((id) => {
		setCurrent(id)
	}, 0)

	const handleMouseLeave = debounce(() => {
		setCurrent(null)
	}, 0)

	const onError = useMemoizedFn((id: string) => {
		setErrorList((prev) => [...prev, id])
	})

	if (data.length === 0) return <Empty />

	if (isPaused) return <MagicSpin spinning={isPaused} />

	return (
		<div
			ref={wrapperRef}
			className={styles.waterfallWrapper}
			id="scrollableDiv"
			style={{ gridTemplateColumns: `repeat(${columns ?? 5}, 1fr)` }}
			{...rest}
		>
			{data.map((item) => (
				<Flex
					vertical
					key={item.id}
					data-id={item.id}
					className={cx(styles.waterfallItem, "waterfallItem")}
					onMouseEnter={() => handleMouseEnter(item.id)}
					onMouseLeave={handleMouseLeave}
					style={{ width: itemWidth }}
				>
					<ImageWrapper
						id={item.id}
						data-src={item.url}
						alt={item.prompt}
						onError={() => onError(item.id)}
					/>
					{current === item.id && !errorList.includes(item.id) && (
						<Flex
							className={styles.mask}
							align="center"
							justify="flex-end"
							vertical
							gap={10}
						>
							<div className={styles.prompt}>{item.prompt}</div>
							<MagicButton
								block
								className={styles.magicButton}
								icon={<IconWand size={20} />}
								onClick={() => onImageClick(item.prompt)}
							>
								{t("chat.aiImage.makeTheSame")}
							</MagicButton>
						</Flex>
					)}
				</Flex>
			))}
		</div>
	)
})
export default WaterfallList
