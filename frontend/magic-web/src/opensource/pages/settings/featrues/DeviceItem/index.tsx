import { useTranslation } from "react-i18next"
import MagicButton from "@/opensource/components/base/MagicButton"
import { IconDeviceImac } from "@tabler/icons-react"
import { createStyles } from "antd-style"
import SettingItem from "../SettingItem"

const useStyles = createStyles(() => {
	return {
		icon: {
			width: 40,
			height: 40,
			borderRadius: 8,
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			color: "rgba(49, 92, 236, 1)",
			backgroundColor: "rgba(238, 243, 253, 1)",
		},
	}
})

interface DeviceItemProps {
	deviceId: string
	name: string
	type?: "pc" | "mobile"
	system?: string
	time: string
	isCurrent?: boolean
}

function DeviceItem({ name, system, time, isCurrent = false }: DeviceItemProps) {
	const { t } = useTranslation("interface")
	const { styles } = useStyles()

	// useEffect(() => {
	// 	// eslint-disable-next-line no-console
	// 	console.log(deviceId, type)
	// }, [deviceId, type])

	// const { logoutDevices } = useService().UserService

	// const handleLogout = useMemoizedFn(async () => {
	// 	// await logoutDevices()
	// })

	return (
		<SettingItem
			icon={
				<div className={styles.icon}>
					<IconDeviceImac size={24} />
				</div>
			}
			title={name ?? t("setting.unknownDevice")}
			description={`${t("setting.system")}：${system ?? t("common.unknown")} | ${t("setting.loginTime")}：${time ?? t("common.unknown")}`}
			extra={
				isCurrent ? (
					t("setting.currentDevices")
				) : (
					<MagicButton danger type="link" style={{ padding: 0 }}>
						{t("setting.exit")}
					</MagicButton>
				)
			}
		/>
	)
}

export default DeviceItem
