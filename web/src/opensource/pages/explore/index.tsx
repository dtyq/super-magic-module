import { Flex, message } from "antd"
import { useTranslation } from "react-i18next"
import { IconMagicBots } from "@/enhance/tabler/icons-react"
import CNLogo from "@/assets/logos/exploreLogo-cn.svg"
import ENLogo from "@/assets/logos/exploreLogo-en.svg"
import { useBoolean, useMemoizedFn } from "ahooks"
import { useEffect, useState, useMemo } from "react"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import { useNavigate } from "@/opensource/hooks/useNavigate"
import { RoutePath } from "@/const/routes"
import MagicButton from "@/opensource/components/base/MagicButton"
import { useBotStore } from "@/opensource/stores/bot"
import type { Bot } from "@/types/bot"
import { useGlobalLanguage } from "@/opensource/models/config/hooks"
// import type { PromptSection as PromptSectionType } from "./components/PromptSection/types"
import { BotApi } from "@/apis"
import type { PromptCard as PromptCardType } from "./components/PromptCard/types"
import PromptDescription from "./components/PromptDescription"
import useStyles from "./useStyles"
import PromptInner from "./components/PromptInner"
import AddOrUpdateAgent from "./components/AddOrUpdateAgent"
// import Banner from "./components/Banner"
import useAssistant from "./hooks/useAssistant"
import Search from "./components/Search"

function ExplorePage() {
	const { t } = useTranslation("interface")

	const lang = useGlobalLanguage()

	const { styles, cx } = useStyles()

	const navigate = useNavigate()

	const [currentCard, setCurrentCard] = useState<PromptCardType>({} as PromptCardType)

	const [addAgentModalOpen, { setTrue: openAddAgentModal, setFalse: closeAddAgentModal }] =
		useBoolean(false)

	const [expandPanelOpen, { setTrue: openExpandPanel, setFalse: closeExpandPanel }] =
		useBoolean(false)

	// 市场机器人
	const { data: marketBots } = useBotStore((state) => state.useMarketBotList)()

	// 内部机器人
	const { data: orgBots, isLoading: orgBotLoading } = useBotStore((state) => state.useOrgBotList)(
		{ page: 1, pageSize: 100 },
	)

	const [marketBotList, setMarketBotList] = useState([] as Bot.BotItem[])

	const [orgBotList, setOrgBotList] = useState([] as Bot.OrgBotItem[])

	// const exampleData: PromptSectionType[] = useMemo(
	// 	() => [
	// 		{
	// 			title: i18next.t("explore.promptsTitle.mostPopular", {
	// 				ns: "interface",
	// 			}),
	// 			desc: i18next.t("explore.promptsDesc.mostPopular"),
	// 			more: true,
	// 			cards: marketBotList,
	// 		},
	// 	],
	// 	[marketBotList],
	// )

	// const bannerData = useMemo(
	// 	() => [
	// 		{
	// 			id: "1",
	// 			link: "时下热门",
	// 			title: "AI 办公助理集合1",
	// 			desc: "判断王炸级AI 办公应该",
	// 			img: "",
	// 		},
	// 		{
	// 			id: "2",
	// 			link: "热门推荐",
	// 			title: "AI 办公助理集合2",
	// 			desc: "判断王炸级AI 办公应该",
	// 			img: "",
	// 		},
	// 		{
	// 			id: "3",
	// 			link: "热门推荐",
	// 			title: "AI 办公助理集合3",
	// 			desc: "判断王炸级AI 办公应该",
	// 			img: "",
	// 		},
	// 		{
	// 			id: "4",
	// 			link: "热门推荐",
	// 			title: "AI 办公助理集合4",
	// 			desc: "判断王炸级AI 办公应该",
	// 			img: "",
	// 		},
	// 	],
	// 	[],
	// )

	const handleClickCard = useMemoizedFn((id: string) => {
		const card =
			orgBotList.find((item) => item.id === id) ??
			marketBotList.find((item) => item.id === id)
		if (!card) return
		setCurrentCard(card)
		openExpandPanel()
	})

	const { navigateConversation } = useAssistant()

	const handleAddFriend = useMemoizedFn(
		async (cardData: PromptCardType, addAgent: boolean, isNavigate: boolean) => {
			if (!cardData.id) return

			// 是否添加助理
			if (addAgent) {
				const res = await BotApi.registerAndAddFriend(cardData.id)
				message.success(`${t("button.add")}${t("flow.apiKey.success")}`)
				// 是否会话
				if (res && isNavigate) {
					navigateConversation(res.user_id)
				} else {
					setCurrentCard((prev) => {
						return {
							...prev,
							created_info: {
								...prev?.created_info,
								user_id: res.user_id,
							},
							user_id: res.user_id,
							is_add: true,
						}
					})
				}
			} else if (isNavigate) {
				if (cardData?.user_id) navigateConversation(cardData?.user_id)
			}
		},
	)

	useEffect(() => {
		if (marketBots && marketBots.list) {
			setMarketBotList(marketBots.list)
		}
		if (orgBots && orgBots.list) {
			setOrgBotList(orgBots.list)
		}
	}, [marketBots, orgBots])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" || e.key === "Esc") {
				closeExpandPanel()
			}
		}

		document.addEventListener("keydown", handleKeyDown)

		return () => {
			document.removeEventListener("keydown", handleKeyDown)
		}
		// @ts-ignore
	}, [closeExpandPanel])

	const logo = useMemo(() => {
		if (lang === "en_US") {
			return <img alt="logo" src={ENLogo} />
		}
		return <img alt="logo" src={CNLogo} />
	}, [lang])

	return (
		<Flex className={styles.container}>
			<Flex flex={1} vertical className={styles.inner} gap={20}>
				<Flex gap={20} align="center" className={styles.header}>
					<Flex className={styles.title} gap={10} align="center">
						{logo}
					</Flex>

					<Search handleClickCard={handleClickCard} />

					<Flex gap={10} align="center">
						<MagicButton
							type="text"
							className={styles.button}
							onClick={() => {
								navigate(RoutePath.AgentList)
							}}
						>
							{t("explore.buttonText.mangageAssistant")}
						</MagicButton>
						<MagicButton
							type="text"
							className={cx(styles.button, styles.magicColor)}
							icon={<MagicIcon component={IconMagicBots} size={20} color="white" />}
							onClick={openAddAgentModal}
						>
							{t("explore.buttonText.createAssistant")}
						</MagicButton>
					</Flex>
				</Flex>

				{/* <Banner data={bannerData} /> */}

				{orgBotList.length > 0 && (
					<PromptInner
						loading={orgBotLoading}
						cards={orgBotList}
						onCardClick={handleClickCard}
					/>
				)}

				{/* <Flex vertical gap={20} className={styles.sections}>
					{exampleData.map((item) => {
						return (
							<PromptSection
								more
								key={item.title}
								desc={item.desc}
								title={item.title}
								cards={item.cards}
								onCardClick={handleClickCard}
							/>
						)
					})}
				</Flex> */}
			</Flex>

			<PromptDescription
				open={expandPanelOpen}
				data={currentCard}
				onClose={closeExpandPanel}
				onAddFriend={handleAddFriend}
			/>
			<AddOrUpdateAgent open={addAgentModalOpen} close={closeAddAgentModal} />
		</Flex>
	)
}

export default ExplorePage
