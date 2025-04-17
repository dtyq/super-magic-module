// import MagicSpin from "@/opensource/components/base/MagicSpin"
import { useBoolean, useMemoizedFn } from "ahooks"
import { createStyles } from "antd-style"
import { memo } from "react"
import NetworkErrorContent from "../../ChatMessageList/components/MessageFactory/components/NetworkErrorContent"

const useStyles = createStyles(({ css, token, isDarkMode }) => ({
	button: css`
		cursor: pointer;
		padding: 0;
		border: none;
	`,
	image: css`
		width: 100%;
		height: 100%;
		background: ${token.magicColorUsages.fill[0]};
		border-radius: 8px;
		opacity: 0;
		transition: opacity 0.3s ease;
		&.loaded {
			opacity: 1;
		}
	`,
	networkError: css`
		height: 100%;
		padding-bottom: 0 !important;
		border-radius: 8px;
		border: 1px solid ${token.magicColorUsages.border};
		background: ${isDarkMode ? token.magicColorUsages.bg[1] : token.magicColorUsages.white};
	`,
}))

const ImageWrapper = memo(
	(
		props: JSX.IntrinsicElements["img"] & {
			containerClassName?: string
			reload?: () => void
			onError?: (id: string) => void
		},
	) => {
		const {
			id,
			alt,
			style,
			className,
			containerClassName,
			reload,
			onError: onErrorProps,
			...rest
		} = props
		const { styles, cx } = useStyles()

		const [error, { setTrue, setFalse }] = useBoolean(false)
		const [loaded, { setTrue: setLoaded }] = useBoolean(false)

		const handleReloadImage = useMemoizedFn(() => {
			props?.reload?.()
			setFalse()
		})

		const onError = useMemoizedFn(() => {
			setTrue()
			onErrorProps?.(id!)
		})

		const onLoad = useMemoizedFn(() => {
			setLoaded()
		})

		if (error) {
			return (
				<NetworkErrorContent
					className={cx(styles.networkError, containerClassName)}
					onReload={handleReloadImage}
				/>
			)
		}

		return (
			<img
				alt={alt}
				style={style}
				className={cx(styles.image, className, { loaded }, "image-wrapper")}
				onError={onError}
				onLoad={onLoad}
				{...rest}
			/>
		)
	},
)

export default ImageWrapper
