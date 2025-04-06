import { useTranslation } from "react-i18next"
import { ErrorBoundary } from "react-error-boundary"
import type { PropsWithChildren } from "react"
import { Flex, Result } from "antd"
import { createStyles } from "antd-style"
import { isString } from "lodash-es"
import useVersion from "@/opensource/workers/version-check/useVersion"
import Logger from "@/utils/log/Logger"
import { isDev } from "@/utils/env"
import MagicSpin from "@/opensource/components/base/MagicSpin"
import MagicButton from "@/opensource/components/base/MagicButton"

const console = new Logger("errorBoundary")

const useStyles = createStyles(({ css, isDarkMode }) => {
	return {
		container: css`
			height: 100vh;
			background-color: ${isDarkMode ? "#141414" : "#fff"};
		`,
	}
})

function GlobalErrorBoundary({ children }: PropsWithChildren) {
	const { t } = useTranslation("interface")

	const { styles } = useStyles()

	useVersion()

	return (
		<ErrorBoundary
			fallbackRender={({ error }) => {
				console.error(error)
				if (
					!isDev &&
					isString(error?.message) &&
					error?.message?.startsWith("Failed to fetch dynamically imported module")
				) {
					setTimeout(() => {
						window.location.reload()
					}, 1000)

					return (
						<Flex vertical align="center" justify="center" className={styles.container}>
							<Result
								status="info"
								title={t("FrontendVersionDetected")}
								subTitle={t("PleaseReloadThePage")}
							/>
							{/* <MagicButton type="primary" onClick={() => window.location.reload()}>
								{t("Reload")}
							</MagicButton> */}
							<MagicSpin spinning />
						</Flex>
					)
				}
				return (
					<Result
						status="error"
						title={t("ErrorHappened")}
						subTitle={
							<Flex vertical align="center" gap={16}>
								{error?.message}
								<MagicButton
									type="primary"
									style={{ width: "fit-content" }}
									onClick={() => window.location.reload()}
								>
									{t("Reload")}
								</MagicButton>
							</Flex>
						}
						className={styles.container}
					/>
				)
			}}
		>
			{children}
		</ErrorBoundary>
	)
}

export default GlobalErrorBoundary
