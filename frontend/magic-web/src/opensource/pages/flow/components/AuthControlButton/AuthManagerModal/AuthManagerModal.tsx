import MagicModal from "@/opensource/components/base/MagicModal"
import { Flex, message } from "antd"
import { useMemoizedFn } from "ahooks"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { AuthApi } from "@/apis"
import SearchPanel from "../components/SearchPanel/SearchPanel"
import AuthList from "../components/AuthList/AuthList"
import { AuthControlProvider } from "./context/AuthControlContext"
import useAuthList from "./hooks/useAuthList"
import { ManagerModalType } from "./types"
import type { AuthExtraData, DepartmentExtraData, ExtraData, WithExtraConfigProps } from "./types"
import useStyles from "../style"

export default function AuthManagerModal<T extends ExtraData>({
	type,
	open,
	extraConfig,
	title,
	closeModal,
}: WithExtraConfigProps<T>) {
	const { styles } = useStyles()

	const { t } = useTranslation()

	const {
		authList,
		addAuthMembers,
		deleteAuthMembers,
		updateAuthMember,
		initAuthList,
		setAuthList,
		originalAuthList,
		setOriginalAuthList,
	} = useAuthList({ extraConfig, type })

	useEffect(() => {
		if (open) {
			initAuthList()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open])

	const handleOk = useMemoizedFn(async () => {
		if (type === ManagerModalType.Auth) {
			await AuthApi.updateResourceAccess({
				resource_type: (extraConfig as AuthExtraData).resourceType,
				resource_id: (extraConfig as AuthExtraData).resourceId,
				targets: authList,
			})
			message.success(t("common.updateSuccess", { ns: "flow" }))
			closeModal()
		}

		if (type === ManagerModalType.Department) {
			;(extraConfig as DepartmentExtraData).onOk(
				authList.map((auth) => {
					return {
						id: auth.target_id,
						name: auth.target_info?.name || "",
					}
				}),
			)
		}
	})

	const handleCancel = useMemoizedFn(() => {
		closeModal()
	})

	return (
		<AuthControlProvider
			authList={authList}
			originalAuthList={originalAuthList}
			addAuthMembers={addAuthMembers}
			deleteAuthMembers={deleteAuthMembers}
			updateAuthMember={updateAuthMember}
			setAuthList={setAuthList}
			setOriginalAuthList={setOriginalAuthList}
			type={type}
		>
			<div onClick={(event) => event.stopPropagation()}>
				<MagicModal
					title={title}
					open={open}
					footer={null}
					width={900}
					maskClosable={false}
					wrapClassName={styles.modalWrap}
					onCancel={handleCancel}
				>
					<Flex className={styles.body}>
						<Flex flex={1}>
							<SearchPanel />
						</Flex>

						<Flex flex={1}>
							<AuthList onOk={handleOk} onCancel={handleCancel} />
						</Flex>
					</Flex>
				</MagicModal>
			</div>
		</AuthControlProvider>
	)
}
