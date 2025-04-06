import { Flex, Button, Select } from "antd"
import MagicButton from "@/opensource/components/base/MagicButton"
import MagicAvatar from "@/opensource/components/base/MagicAvatar"
import MagicLogo from "@/opensource/components/MagicLogo"
import { LogoType } from "@/opensource/components/MagicLogo/LogoType"
import { useMemoizedFn } from "ahooks"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import { IconSitemap } from "@tabler/icons-react"
import { useStyles as useDepartmentStyles } from "@/opensource/components/business/OrganizationPanel/components/Department"
import { resolveToString } from "@dtyq/es6-template-strings"
import { useTranslation } from "react-i18next"
import { useMemo } from "react"
import { useUserInfo } from "@/opensource/models/user/hooks"
import useStyles from "./style"
import type { AuthMember } from "../../types"
import { OperationTypes, TargetTypes } from "../../types"
import { useAuthControl } from "../../AuthManagerModal/context/AuthControlContext"
import { ManagerModalType } from "../../AuthManagerModal/types"
import { canEditMemberAuth } from "../../utils/authUtils"

type AuthListProps = {
	onOk: () => void
	onCancel: () => void
}

export default function AuthList({ onOk, onCancel }: AuthListProps) {
	const { t } = useTranslation()
	const { styles } = useStyles()
	const { authList, deleteAuthMembers, updateAuthMember, type, originalAuthList } =
		useAuthControl()
	const { userInfo } = useUserInfo()
	const uId = userInfo?.user_id

	const { styles: departmentStyles } = useDepartmentStyles()

	// 获取当前用户的权限
	const currentUserAuth = useMemo(() => {
		return authList.find((auth) => auth.target_id === uId)?.operation
	}, [authList, uId])

	// 判断是否可以编辑某个成员的权限
	const canEditAuth = useMemoizedFn((auth: AuthMember) => {
		return canEditMemberAuth(auth, uId!, currentUserAuth, originalAuthList)
	})

	const getAvatar = useMemoizedFn((auth: AuthMember) => {
		if (auth.target_type === TargetTypes.User || auth.target_type === TargetTypes.Group) {
			return auth.target_info?.icon
		}
		return (
			<MagicAvatar
				src={<MagicIcon color="currentColor" size={20} component={IconSitemap} />}
				size={32}
				className={departmentStyles.departmentIcon}
			>
				{auth.target_info?.name}
			</MagicAvatar>
		)
	})

	const operationOptions = useMemo(() => {
		return [
			{
				label: t("common.owner", { ns: "flow" }),
				value: OperationTypes.Owner,
				disabled: true,
			},
			{
				label: t("common.admin", { ns: "flow" }),
				value: OperationTypes.Admin,
			},
			{
				label: t("common.edit", { ns: "flow" }),
				value: OperationTypes.Edit,
			},
			{
				label: t("common.read", { ns: "flow" }),
				value: OperationTypes.Read,
			},
		]
	}, [t])

	return (
		<Flex className={styles.authList} vertical>
			<Flex className={styles.header}>
				{resolveToString(
					t("common.selectPeopleCount", {
						ns: "flow",
					}),
					{ num: authList.length || 0 },
				)}
			</Flex>
			<div className={styles.body}>
				{authList.map((auth) => {
					const canEdit = canEditAuth(auth)

					return (
						<Flex className={styles.member} gap={8} align="center">
							<Flex className="left" gap={9.6} align="center">
								<MagicAvatar
									src={getAvatar(auth)}
									alt=""
									size={29}
									className="avatar"
								>
									<MagicLogo type={LogoType.ICON} />
								</MagicAvatar>
								<Flex className="memberInfo" vertical>
									<span className="name">{auth.target_info?.name}</span>
									<span className="desc">{auth.target_info?.department}</span>
								</Flex>
							</Flex>
							<Flex className="operation">
								{type === ManagerModalType.Auth && (
									<Select
										value={auth.operation}
										onChange={(operation) => {
											updateAuthMember({
												...auth,
												operation,
											})
										}}
										options={operationOptions}
										disabled={!canEdit}
									/>
								)}
							</Flex>
							<Button
								type="default"
								danger
								className="remove-btn"
								onClick={() => {
									deleteAuthMembers([auth])
								}}
								disabled={!canEdit}
							>
								{t("common.remove", { ns: "flow" })}
							</Button>
						</Flex>
					)
				})}
			</div>
			<Flex className={styles.footer} justify="flex-end">
				<Flex gap={10}>
					<MagicButton type="default" onClick={onCancel}>
						{t("common.cancel", { ns: "flow" })}
					</MagicButton>
					<MagicButton type="primary" onClick={onOk}>
						{t("common.save", { ns: "flow" })}
					</MagicButton>
				</Flex>
			</Flex>
		</Flex>
	)
}
