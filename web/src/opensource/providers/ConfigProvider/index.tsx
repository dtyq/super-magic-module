import { type PropsWithChildren, useEffect, useState } from "react"
import { userService, configService } from "@/services"
import MagicSpin from "@/opensource/components/base/MagicSpin"
import { useTranslation } from "react-i18next"
import { createStyles } from "antd-style"

const useStyles = createStyles(({ css, prefixCls }) => {
	return {
		spin: css`
			.${prefixCls}-spin-blur {
				opacity: 1;
			}

			& > div > .${prefixCls}-spin {
				--${prefixCls}-spin-content-height: unset;
				max-height: unset;
			}
		`,
	}
})

export default function ConfigProvider({ children }: PropsWithChildren) {
	const { styles } = useStyles()
	const { t } = useTranslation("interface")
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const initConfig = async () => {
			try {
				await configService.init()
				await configService.loadConfig()
				await userService.init()
				await userService.loadConfig()
			} finally {
				setLoading(false)
			}
		}

		initConfig()
	}, [])

	if (loading) {
		return (
			<MagicSpin spinning tip={t("spin.loadingConfig")} wrapperClassName={styles.spin}>
				<div style={{ height: "100vh" }} />
			</MagicSpin>
		)
	}

	return children
}
