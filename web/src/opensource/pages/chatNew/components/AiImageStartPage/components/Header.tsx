import { Affix, Flex } from "antd"
import { memo } from "react"
import { useTranslation } from "react-i18next"
import MagicButton from "@/opensource/components/base/MagicButton"
import { IconMessage } from "@tabler/icons-react"
import CNLogo from "@/assets/text/ai-image-chinese.svg"
import { useInterafceStore } from "@/opensource/stores/interface"
import { useStyles } from "../style"

interface Tags {
	id: string
	type: string
}

interface HeaderProps {
	tags: Tags[]
	currentType: string
	selectType: (id: string) => void
}
const Header = memo(({ tags, currentType, selectType }: HeaderProps) => {
	const { t } = useTranslation("interface")

	const { styles, cx } = useStyles()

	return (
		<Affix offsetTop={0} style={{ width: "100%" }}>
			<Flex className={styles.header} gap={20} vertical>
				<Flex justify="space-between" align="center">
					<Flex>
						<Flex vertical>
							<img alt="logo" src={CNLogo} width={160} />
							<div className={styles.desc}>
								{t("chat.aiImage.startPageDescription")}
							</div>
						</Flex>
					</Flex>
					<MagicButton
						type="text"
						className={styles.magicButton}
						style={{ borderRadius: "50px" }}
						onClick={() => useInterafceStore.getState().updateIsShowStartPage(false)}
					>
						<IconMessage size={18} />
						{t("chat.aiImage.checkHistoryConversation")}
					</MagicButton>
				</Flex>
				<Flex gap={8} style={{ flexWrap: "wrap" }}>
					{tags.map((tag) => {
						return (
							<MagicButton
								type="text"
								onClick={() => selectType(tag.id)}
								key={tag.id}
								className={cx(styles.button, {
									[styles.magicButton]: tag.id === currentType,
								})}
							>
								{tag.type}
							</MagicButton>
						)
					})}
				</Flex>
			</Flex>
		</Affix>
	)
})
export default Header
