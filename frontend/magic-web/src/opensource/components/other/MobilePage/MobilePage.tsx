import BgHighlightA from "@/assets/resources/background-highlight-1.webp"
import BgHighlightB from "@/assets/resources/background-highlight-2.webp"
import BgHighlightC from "@/assets/resources/background-highlight-3.webp"
import BgHighlightD from "@/assets/resources/background-highlight-4.webp"
import { useStyles } from "./styles"
import {
	Text,
	Logo,
	Name,
	FooterLogo,
	Magic,
	MacIcon,
	WinIcon,
	IOSIcon,
	AndroidIcon,
} from "./components/image"

function MobilePage() {
	const { styles, cx } = useStyles()

	const size = 1

	return (
		<div className={styles.layout}>
			<div className={styles.grid}>
				<div className={styles.mask} />
				<div className={styles.gridFade} />
				<div className={styles.gridLines} />
			</div>
			<div className={styles.animation}>
				<div className={cx(styles.stepA, styles.step)}>
					<img src={BgHighlightA} alt="" />
				</div>
				<div className={cx(styles.stepB, styles.step)}>
					<img src={BgHighlightB} alt="" />
				</div>
				<div className={cx(styles.stepC, styles.step)}>
					<img src={BgHighlightC} alt="" />
				</div>
				<div className={cx(styles.stepD, styles.step)}>
					<img src={BgHighlightD} alt="" />
				</div>
			</div>
			<div className={styles.wrapper}>
				<div className={styles.header}>
					<Logo size={size} />
					<Text size={size} />
					<Name size={size} />
				</div>
				<div className={styles.desc}>新一代企业级 AI 应用创新引擎</div>
				<div className={styles.tip}>轻松构建和运营 AI 大模型原生应用</div>
				<div className={styles.menu}>
					<div className={styles.item}>
						<MacIcon />
						<span>Mac 客户端</span>
						<a
							href="https://teamshare.kkguan.com/knowledge/preview/720822492427685888/720822529786298368"
							className={styles.button}
						>
							点击下载
						</a>
					</div>
					<div className={cx(styles.item, styles.itemDisabled)}>
						<WinIcon />
						<span>Windows 客户端</span>
						<span className={cx(styles.button, styles.buttonDisabled)}>即将上线</span>
					</div>
					<div className={cx(styles.item, styles.itemDisabled)}>
						<IOSIcon />
						<span>iPhone 客户端</span>
						<span className={cx(styles.button, styles.buttonDisabled)}>即将上线</span>
					</div>
					<div className={cx(styles.item, styles.itemDisabled)}>
						<AndroidIcon />
						<span>Android 客户端</span>
						<span className={cx(styles.button, styles.buttonDisabled)}>即将上线</span>
					</div>
				</div>
				<div className={styles.footer}>
					<FooterLogo size={1} />
					<span>Copyright © 2025 Letsmagic.cn All Rights Reserved.</span>
					<span>粤ICP备2023088718号</span>
				</div>
			</div>

			<Magic className={styles.watermark} size={1} />
		</div>
	)
}

export default MobilePage
