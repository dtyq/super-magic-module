import { Flex, Spin } from "antd"
import { magic } from "@/enhance/magicElectron"
import useDrag from "@/opensource/hooks/electron/useDrag"
import { IconMagicTextLogo } from "@/enhance/tabler/icons-react"
import { interfaceStore } from "@/opensource/stores/interface"
import MagicButton from "@/opensource/components/base/MagicButton"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import { IconReload } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { SettingsButton, MenuButton } from "./Button"
import { useStyles } from "./styles"
import { observer } from "mobx-react-lite"

const Header = observer(function Header({ className }: { className?: string }) {
	const { styles, cx } = useStyles()
	const { onMouseDown } = useDrag()
	const { t } = useTranslation("interface")

	const isWebSocketConnecting = interfaceStore.isConnecting
	const showReloadButton = interfaceStore.showReloadButton

	return (
		<Flex
			className={cx(styles.header, className)}
			align="center"
			onMouseDown={onMouseDown}
			onDoubleClick={() => magic?.view?.maximize?.()}
		>
			<Flex
				className={cx(styles.wrapper, {
					[styles.appWrapper]: magic?.env?.isElectron(),
				})}
				align="center"
			>
				<IconMagicTextLogo size={32} className={styles.magic} />
				{isWebSocketConnecting && <Spin spinning size="small" />}
				{showReloadButton && (
					<MagicButton
						danger
						style={{ border: "none" }}
						icon={<MagicIcon color="currentColor" component={IconReload} size={18} />}
						onClick={() => window.location.reload()}
					>
						{t("networkTip.websocketReloadTip")}
					</MagicButton>
				)}
			</Flex>
			<div className={styles.wrapper}>
				<MenuButton />
				<SettingsButton />
			</div>
		</Flex>
	)
})

export default Header
