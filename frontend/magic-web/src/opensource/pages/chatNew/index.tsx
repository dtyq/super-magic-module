import { Flex } from "antd"
import MagicSplitter from "@/opensource/components/base/MagicSplitter"
import { observer } from "mobx-react-lite"
import { lazy, Suspense } from "react"
import conversationStore from "@/opensource/stores/chatNew/conversation"
import ConversationBotDataService from "@/opensource/services/chat/conversation/ConversationBotDataService"
import { interfaceStore } from "@/opensource/stores/interface"
import ChatSubSider from "./components/ChatSubSider"
import { ChatDomId } from "./constants"
import useNavigateConversationByAgentIdInSearchQuery from "./hooks/navigateConversationByAgentId"
import { useStyles } from "./styles"
// import MagicConversation from "./components/MagicConversation"
import ChatMessageList from "./components/ChatMessageList"
import MessageEditor from "./components/MessageEditor"
import Header from "./components/ChatHeader"
import ChatImagePreviewModal from "./components/ChatImagePreviewModal"
import DragFileSendTip from "./components/ChatMessageList/components/DragFileSendTip"
import AiImageStartPage from "./components/AiImageStartPage"

const TopicExtraSection = lazy(() => import("./components/topic/ExtraSection"))
const SettingExtraSection = lazy(() => import("./components/setting"))
const GroupSeenPanel = lazy(() => import("./components/GroupSeenPanel"))

const ChatNew = observer(() => {
	const { styles } = useStyles()

	useNavigateConversationByAgentIdInSearchQuery()

	const showExtra = conversationStore.topicOpen

	if (!conversationStore.currentConversation) {
		return (
			<Flex flex={1} className={styles.chat} id={ChatDomId.ChatContainer}>
				<MagicSplitter className={styles.splitter}>
					<MagicSplitter.Panel min={200} defaultSize={240} max={300}>
						<ChatSubSider />
					</MagicSplitter.Panel>
					<MagicSplitter.Panel />
				</MagicSplitter>
			</Flex>
		)
	}

	const Main = () => {
		// 如果开启了startPage，则显示startPage
		if (ConversationBotDataService.startPage && interfaceStore.isShowStartPage) {
			return <AiImageStartPage disabled={false} />
		}

		return (
			<>
				<Flex vertical className={styles.main} flex={1}>
					<Header />
					<div className={styles.chatList}>
						<DragFileSendTip>
							<ChatMessageList />
						</DragFileSendTip>
					</div>
					<div className={styles.editor}>
						<MessageEditor
							disabled={false}
							visible
							// scrollControl={null}
						/>
					</div>
				</Flex>
				{showExtra && (
					<div className={styles.extra}>
						<Suspense fallback={null}>
							{conversationStore.topicOpen && <TopicExtraSection />}
						</Suspense>
					</div>
				)}
				<Suspense fallback={null}>
					{conversationStore.settingOpen && <SettingExtraSection />}
				</Suspense>
			</>
		)
	}

	return (
		<Flex flex={1} className={styles.chat} id={ChatDomId.ChatContainer}>
			<ChatSubSider />
			{Main()}
			<ChatImagePreviewModal />
			{conversationStore.currentConversation.isGroupConversation && (
				<Suspense fallback={null}>
					<GroupSeenPanel />
				</Suspense>
			)}
		</Flex>
	)
})

export default ChatNew
