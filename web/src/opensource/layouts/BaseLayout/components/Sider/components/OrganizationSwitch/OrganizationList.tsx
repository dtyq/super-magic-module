import { memo, useMemo, useRef } from "react"
import MagicAvatar from "@/opensource/components/base/MagicAvatar"
import { IconCheck, IconPlus } from "@tabler/icons-react"
import MagicScrollBar from "@/opensource/components/base/MagicScrollBar"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import { colorScales } from "@/opensource/providers/ThemeProvider/colors"
import { Badge, Flex, Affix } from "antd"
import { useTranslation } from "react-i18next"
import { useMemoizedFn } from "ahooks"
import type { User } from "@/types/user"
import { useAccount } from "@/opensource/stores/authentication"
import {
	useAccount as useAccountHook,
	useUserInfo,
	useOrganization,
} from "@/opensource/models/user/hooks"
import AccountModal from "@/opensource/pages/login/AccountModal"
import { useClusterConfig } from "@/opensource/models/config/hooks"
import { userService } from "@/services"
import OrganizationDotsStore from "@/opensource/stores/chatNew/dots/OrganizationDotsStore"
import { observer } from "mobx-react-lite"
import { useOrganizationListStyles } from "./styles"
import { userStore } from "@/opensource/models/user"
import { useInterafceStore } from "@/opensource/stores/interface"
import { ContactApi } from "@/apis"

interface OrganizationItemProps {
	disabled: boolean
	onClick?: () => void
	account: User.UserAccount
	organization: User.UserOrganization
}

const OrganizationItem = observer((props: OrganizationItemProps) => {
	const { disabled, organization, account, onClick } = props

	const { styles, cx } = useOrganizationListStyles()

	const { accountSwitch } = useAccount()

	const { userInfo } = useUserInfo()
	const { teamshareOrganizationCode } = useOrganization()

	const unreadDotsGroupByOrganization = OrganizationDotsStore.dots

	const switchOrganization = useMemoizedFn(
		async (accountInfo: User.UserAccount, organizationInfo: User.UserOrganization) => {
			if (disabled) {
				return
			}

			try {
				useInterafceStore.setState({ isSwitchingOrganization: true })
				// 账号不一致下要切换账号
				if (accountInfo?.magic_id !== userInfo?.magic_id) {
					await accountSwitch(accountInfo?.magic_id, organizationInfo.organization_code)
				} else if (organizationInfo?.organization_code !== userInfo?.organization_code) {
					// 找到目标组织的 user_id，拉取用户信息，更新本地信息
					const targetMagicUser = accountInfo.organizations.find(
						(org) =>
							org.third_platform_organization_code ===
							organizationInfo?.organization_code,
					)

					if (targetMagicUser) {
						try {
							await userService.switchOrganization(
								targetMagicUser.third_platform_organization_code ?? "",
							)
							// 拉取用户信息
							const { items } = await ContactApi.getUserInfos({
								user_ids: [targetMagicUser.magic_user_id],
								query_type: 2,
							})

							const targetUser = items[0]

							if (targetUser) {
								const magicUser = {
									magic_id: targetUser.magic_id,
									user_id: targetUser.user_id,
									status: targetUser.status,
									nickname: targetUser.nickname,
									avatar: targetUser.avatar_url,
									organization_code: targetUser?.organization_code,
								}

								userStore.user.setUserInfo(magicUser)

								// 切换用户
								await userService.switchUser(magicUser)
							} else {
								// 切换失败，恢复当前组织
								userService.setMagicOrganizationCode(userInfo?.organization_code)
							}
						} catch (err) {
							console.error(err)
							// 切换失败，恢复当前组织
							userService.setMagicOrganizationCode(userInfo?.organization_code)
							userService.setUserInfo(userInfo)
						}
					}
				}
				onClick?.()
			} catch (err) {
				console.error(err)
			} finally {
				useInterafceStore.setState({ isSwitchingOrganization: false })
			}
		},
	)

	const isSelected = useMemo(
		() =>
			teamshareOrganizationCode === organization.organization_code &&
			userInfo?.magic_id === account?.magic_id,
		[
			account?.magic_id,
			organization.organization_code,
			teamshareOrganizationCode,
			userInfo?.magic_id,
		],
	)

	return (
		<div
			key={organization.organization_code}
			onClick={() => switchOrganization(account, organization)}
			className={cx(styles.item, {
				[styles.itemDisabled]: disabled,
				[styles.itemSelected]: isSelected,
			})}
		>
			<div className={styles.itemIcon}>
				<MagicAvatar
					src={organization.organization_logo?.[0]?.url}
					size={30}
					className={cx(styles.avatar, {
						[styles.avatarDisabled]: disabled,
					})}
				>
					{organization.organization_name}
				</MagicAvatar>
			</div>
			<div className={styles.itemText}>{organization.organization_name}</div>
			<Flex>
				{isSelected ? (
					<MagicIcon
						color={colorScales.brand[5]}
						size={20}
						stroke={2}
						component={IconCheck}
					/>
				) : (
					<Badge count={unreadDotsGroupByOrganization[organization.organization_code]} />
				)}
			</Flex>
		</div>
	)
})

interface OrganizationListItemProps {
	onClose?: () => void
}

function OrganizationList(props: OrganizationListItemProps) {
	const { onClose } = props

	const { styles, cx } = useOrganizationListStyles()
	const { t } = useTranslation("interface")

	const ref = useRef<HTMLDivElement>({} as HTMLDivElement)

	const { accounts } = useAccountHook()
	const { clustersConfig } = useClusterConfig()

	const handleAddAccount = () => {
		AccountModal()
		onClose?.()
	}

	console.log("-accounts-", accounts)
	return (
		<div className={styles.container}>
			<MagicScrollBar
				className={styles.scroll}
				autoHide={false}
				scrollableNodeProps={{
					ref,
				}}
			>
				{accounts.map((account, index) => {
					const validOrgs = account.organizations.map(
						(org) => org.third_platform_organization_code,
					)

					return (
						<div className={styles.group} key={account.magic_id}>
							<Affix target={() => ref.current}>
								<div className={styles.groupHeader}>
									<div className={styles.groupSection}>
										<span>账号 {index + 1}</span>
										<span className={styles.groupHeaderLine} />
									</div>
									<div className={styles.groupWrapper}>
										<MagicAvatar
											src={account.avatar}
											className={cx(styles.avatar, {
												[styles.avatarDisabled]: false,
											})}
										>
											organization.organization_name
										</MagicAvatar>
										<span className={styles.groupTitle}>
											{account.nickname}
										</span>
										<span className={styles.groupDesc}>
											{clustersConfig?.[account.deployCode]?.name}
										</span>
									</div>
								</div>
							</Affix>
							{account.teamshareOrganizations?.map((organization) => (
								<OrganizationItem
									key={organization.organization_code}
									onClick={onClose}
									account={account}
									disabled={!validOrgs.includes(organization.organization_code)}
									organization={organization}
								/>
							))}
						</div>
					)
				})}
			</MagicScrollBar>
			<div className={styles.button} onClick={handleAddAccount}>
				<IconPlus size={20} />
				{t("sider.addAccount")}
			</div>
		</div>
	)
}

export default memo(OrganizationList)
