import MagicMemberAvatar from "@/opensource/components/business/MagicMemberAvatar"
import { MagicList } from "@/opensource/components/MagicList"
import type Conversation from "@/opensource/models/chat/conversation"
import { Col, Flex, Row, Switch, Typography } from "antd"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useMemoizedFn } from "ahooks"
import conversationService from "@/opensource/services/chat/conversation/ConversationService"
import { observer } from "mobx-react-lite"
import SettingListItem from "../SettingListItem"
import useStyles from "./styles"

interface AiSettingProps {
	conversation: Conversation
}

const AiSetting = observer(({ conversation }: AiSettingProps) => {
	const { styles } = useStyles()
	// const { styles: commonStyles } = useCommonStyles()
	const { t } = useTranslation("interface")

	const members = useMemo(() => {
		return [conversation.receive_id]
	}, [conversation])

	const onTopConversationChange = useMemoizedFn((value: boolean) => {
		conversationService.setTopStatus(conversation.id, value ? 1 : 0)
	})

	const onNotDisturbConversationChange = useMemoizedFn((value: boolean) => {
		conversationService.setNotDisturbStatus(conversation.id, value ? 1 : 0)
	})

	const chatSettingListItems = useMemo(() => {
		return [
			{
				id: "topConversation",
				title: t("chat.userSetting.topConversation"),
				extra: (
					<Switch
						checked={Boolean(conversation.is_top)}
						onChange={onTopConversationChange}
					/>
				),
			},
			{
				id: "disturbMessage",
				title: t("chat.userSetting.disturbMessage"),
				extra: (
					<Switch
						checked={Boolean(conversation.is_not_disturb)}
						onChange={onNotDisturbConversationChange}
					/>
				),
			},
			// {
			// 	id: "groupInWhich",
			// 	title: t("chat.userSetting.GroupInWhich"),
			// },
		]
	}, [
		conversation.is_not_disturb,
		conversation.is_top,
		onNotDisturbConversationChange,
		onTopConversationChange,
		t,
	])

	// const authorityAuthorizationManagementListItems = useMemo(() => {
	// 	return []
	// }, [])

	// const authorityAuthorizationManagementEmptyProps = useMemo(() => {
	// 	return {
	// 		style: {
	// 			width: "100%",
	// 		},
	// 		description: t("chat.authorityAuthorizationManagement.empty"),
	// 	}
	// }, [t])

	return (
		<Flex vertical gap={10} align="start" className={styles.container}>
			<Row
				className={styles.memberSection}
				gutter={[15, 8]}
				align="middle"
				justify="start"
				style={{ margin: 0 }}
			>
				{members.map((uid) => (
					<Col key={uid} className={styles.member}>
						<MagicMemberAvatar size={45} uid={uid} showName="vertical" />
					</Col>
				))}
				{/* <Col className={styles.member}>
					<Flex vertical align="center" justify="center" gap={4}>
						<MagicButton
							className={styles.addMember}
							icon={<MagicIcon component={IconPlus} size={24} />}
							type="default"
						/>
						<AutoTooltipText maxWidth={50} className={styles.text}>
							{t("chat.userSetting.startConversation")}
						</AutoTooltipText>
					</Flex>
				</Col> */}
			</Row>
			<Typography.Text className={styles.title}>{t("chat.setting")}</Typography.Text>
			<MagicList
				gap={0}
				className={styles.list}
				items={chatSettingListItems}
				listItemComponent={SettingListItem}
			/>
			{/* <Typography.Text className={styles.title}>
				{t("chat.authorityAuthorizationManagement.title")}
			</Typography.Text>
			<MagicList
				gap={0}
				className={styles.list}
				items={authorityAuthorizationManagementListItems}
				listItemComponent={SettingListItem}
				emptyProps={authorityAuthorizationManagementEmptyProps}
			/> */}
			{/* <Flex vertical flex={1} className={commonStyles.buttonList}>
				<MagicButton type="link" block className={styles.shareToOther}>
					{t("chat.chatSetting.shareToOther")}
				</MagicButton>
				<MagicButton type="link" danger block>
					{t("chat.chatSetting.deleteMessageRecords")}
				</MagicButton>
			</Flex> */}
		</Flex>
	)
})

export default AiSetting
