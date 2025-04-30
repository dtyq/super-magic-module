import magicBetaSVG from "@/opensource/pages/superMagic/assets/svg/super_magic_logo.svg"
import { IconMenu2 } from "@tabler/icons-react"
import type { PropsWithChildren, Ref } from "react"
import { forwardRef, memo, useCallback, useImperativeHandle, useState } from "react"
import type { MobileNavigateMenuItem } from "../MobileNavigatePopup"
import MobileNavigatePopup from "../MobileNavigatePopup"
import { useStyles } from "./styles"

export interface SuperMagicMobileLayoutRef {
	closeNavigatePopup: () => void
}

interface SuperMagicMobileLayoutProps {
	headerCenter?: React.ReactNode
	navigateItems?: MobileNavigateMenuItem[]
	openMenu?: () => void
}

function SuperMagicMobileLayout(
	props: PropsWithChildren<SuperMagicMobileLayoutProps>,
	ref: Ref<SuperMagicMobileLayoutRef>,
) {
	const { headerCenter, navigateItems, openMenu, children } = props
	const { styles } = useStyles()
	const [navigatePopupVisible, setNavigatePopupVisible] = useState(false)

	const closeNavigatePopup = useCallback(() => {
		setNavigatePopupVisible(false)
	}, [])

	useImperativeHandle(ref, () => {
		return {
			closeNavigatePopup,
		}
	})

	return (
		<>
			<div className={styles.container}>
				<div className={styles.header}>
					<div className={styles.headerContent}>
						<div className={styles.headerLeft}>
							<img src={magicBetaSVG} alt="magic" className={styles.logo} />
						</div>
						{headerCenter && <div className={styles.headerCenter}>{headerCenter}</div>}
						<div className={styles.headerRight} onClick={openMenu}>
							<IconMenu2 className={styles.menuIcon} />
							{/* <MobileButton
								className={styles.menuButton}
								onClick={() => {
									setNavigatePopupVisible(true)
								}}
							>
								<MagicIcon size={18} stroke={2} component={IconMenu2} />
							</MobileButton> */}
						</div>
					</div>
				</div>
				<div className={styles.body}>{children}</div>
			</div>
			<MobileNavigatePopup
				items={navigateItems}
				visible={navigatePopupVisible}
				onClose={() => {
					setNavigatePopupVisible(false)
				}}
			/>
		</>
	)
}

export default memo(forwardRef(SuperMagicMobileLayout))
