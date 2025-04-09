import { Flex } from "antd"
import MagicSplitter from "@/opensource/components/base/MagicSplitter"
import { observer } from "mobx-react-lite"
import { lazy, Suspense } from "react"
import conversationStore from "@/opensource/stores/chatNew/conversation"
import ConversationBotDataService from "@/opensource/services/chat/conversation/ConversationBotDataService"
import { useInterafceStore } from "@/opensource/stores/interface"
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
	const isStartPage = useInterafceStore((s) => s.isShowStartPage)

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

	if (ConversationBotDataService.startPage && isStartPage) {
		return <AiImageStartPage disabled={false} />
	}

	return (
		<Flex flex={1} className={styles.chat} id={ChatDomId.ChatContainer}>
			<MagicSplitter className={styles.splitter}>
				<MagicSplitter.Panel min={200} defaultSize={240} max={300}>
					<ChatSubSider />
				</MagicSplitter.Panel>
				<MagicSplitter.Panel>
					<MagicSplitter layout="vertical" className={styles.main}>
						<MagicSplitter.Panel size={60} max={60} min={60}>
							<Header />
						</MagicSplitter.Panel>
						<MagicSplitter.Panel>
							<DragFileSendTip>
								<ChatMessageList />
							</DragFileSendTip>
						</MagicSplitter.Panel>
						<MagicSplitter.Panel defaultSize={300} max="50%" min={150}>
							<MessageEditor
								disabled={false}
								visible
								// scrollControl={null}
							/>
						</MagicSplitter.Panel>
					</MagicSplitter>
				</MagicSplitter.Panel>
				<MagicSplitter.Panel
					min={240}
					defaultSize={240}
					size={showExtra ? 240 : 0}
					max="50%"
				>
					<div className={styles.extra}>
						<Suspense fallback={null}>
							{conversationStore.topicOpen && <TopicExtraSection />}
						</Suspense>
					</div>
				</MagicSplitter.Panel>
			</MagicSplitter>
			<Suspense fallback={null}>
				{conversationStore.settingOpen && <SettingExtraSection />}
			</Suspense>
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
