import { Checkbox, Flex } from "antd"
import MagicAvatar from "@/opensource/components/base/MagicAvatar"
import MagicLogo from "@/opensource/components/MagicLogo"
import { LogoType } from "@/opensource/components/MagicLogo/LogoType"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { observer } from "mobx-react-lite"
import { useUserInfo } from "@/opensource/models/user/hooks"
import styles from "./MemberSelectPanel.module.less"
import useMembers from "../../hooks/useMembers"
import type { AuthMember } from "../../../../types"
import { OperationTypes } from "../../../../types"
import { useSearchPanel } from "../../context/SearchPanelContext"
import { useAuthControl } from "../../../../AuthManagerModal/context/AuthControlContext"
import { isDisabled } from "../../../../utils/authUtils"

function MemberSelectPanelComponent() {
	const { t } = useTranslation()
	const { tab, keyword } = useSearchPanel()

	const { members, checkMember } = useMembers({ tab, keyword })

	const { authList, addAuthMembers, deleteAuthMembers, originalAuthList } = useAuthControl()
	const { userInfo } = useUserInfo()
	const currentUserId = userInfo?.user_id

	const authIds = useMemo(() => {
		return authList.map((auth) => auth.target_id)
	}, [authList])

	const creator = useMemo(() => {
		return authList.find((auth) => auth.operation === OperationTypes.Owner)
	}, [authList])

	// 获取当前用户的权限
	const currentUserAuth = useMemo(() => {
		return authList.find((auth) => auth.target_id === currentUserId)?.operation
	}, [authList, currentUserId])

	// 判断是否禁用选择框
	const isDisabledMember = useMemo(() => {
		return (member: AuthMember) => {
			return isDisabled(member, currentUserId!, currentUserAuth, originalAuthList, creator)
		}
	}, [originalAuthList, creator, currentUserId, currentUserAuth])

	// 可选择的成员列表（过滤掉没有权限处理的成员）
	const selectableMembers = useMemo(() => {
		return members.filter((member) => !isDisabledMember(member))
	}, [members, isDisabledMember])

	// 修改全选逻辑，只考虑可选择的成员
	const isCheckAll = useMemo(() => {
		if (selectableMembers.length === 0) return false
		return selectableMembers.every((member) => {
			return authIds.includes(member.target_id)
		})
	}, [selectableMembers, authIds])

	// 处理全选操作
	const handleCheckAll = (checked: boolean) => {
		if (checked) {
			// 添加所有可选择的成员
			addAuthMembers(selectableMembers)
		} else {
			// 删除所有可选择的成员
			deleteAuthMembers(selectableMembers)
		}
	}

	return (
		<div className={styles.memberList}>
			<Flex className={styles.checkAll} gap={8} align="center">
				<Checkbox
					checked={isCheckAll}
					onChange={(e) => handleCheckAll(e.target.checked)}
					disabled={selectableMembers.length === 0}
				/>
				<span>{t("common.selectAll", { ns: "flow" })}</span>
			</Flex>
			{members.map((member) => {
				return (
					<Flex
						className={styles.member}
						gap={9.6}
						align="center"
						onClick={() => !isDisabledMember(member) && checkMember(member)}
					>
						<Checkbox
							checked={authIds.includes(member.target_id)}
							disabled={isDisabledMember(member)}
						/>
						<MagicAvatar
							src={member.target_info?.icon}
							alt=""
							size={29}
							className={styles.avatar}
						>
							<MagicLogo type={LogoType.ICON} />
						</MagicAvatar>
						<Flex className={styles.memberInfo} vertical>
							<span className={styles.name}>{member.target_info?.name}</span>
							<span className={styles.desc}>{member.target_info?.description}</span>
						</Flex>
					</Flex>
				)
			})}
		</div>
	)
}

const MemberSelectPanel = observer(MemberSelectPanelComponent)

export default MemberSelectPanel
