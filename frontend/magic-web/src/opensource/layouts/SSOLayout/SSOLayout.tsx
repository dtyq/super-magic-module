import { Outlet } from "react-router"
import useDrag from "@/opensource/hooks/electron/useDrag"
import { withThirdPartyAuth } from "@/opensource/layouts/middlewares/withThirdPartyAuth"
import { AnimatedGridPattern } from "@/opensource/layouts/SSOLayout/components/AnimatedGridPattern"
import Copyright from "@/opensource/components/other/Copyright"
import LanguageSelect from "@/opensource/layouts/SSOLayout/components/LanguageSelect"
import { Flex } from "antd"
import TopMeta from "@/opensource/layouts/SSOLayout/components/TopMeta"
import AppearenceSwitch from "@/opensource/layouts/SSOLayout/components/AppearenceSwitch"
import useLoginFormOverrideStyles from "@/styles/login-form-overrider"
import AuthenticationProvider from "@/opensource/providers/AuthenticationProvider"
import { useStyles } from "./styles"

function SSOLayout() {
	const { styles, cx } = useStyles()
	const { styles: loginFormOverrideStyles } = useLoginFormOverrideStyles()
	const { onMouseDown } = useDrag()

	return (
		<AuthenticationProvider>
			<AnimatedGridPattern className={styles.layout} onMouseDown={onMouseDown}>
				<Flex className={styles.wrapper} align="center" justify="space-between">
					<Flex
						className={styles.main}
						vertical
						align="center"
						justify="space-between"
						gap={12}
					>
						<Flex align="center" justify="flex-end" style={{ width: "100%" }} gap={10}>
							<LanguageSelect />
							<AppearenceSwitch />
						</Flex>
						<Flex vertical align="center" className={styles.content}>
							<TopMeta />
							<Flex
								vertical
								align="center"
								className={cx(styles.container, loginFormOverrideStyles.container)}
							>
								<Outlet />
							</Flex>
						</Flex>
						<Copyright />
					</Flex>
				</Flex>
			</AnimatedGridPattern>
		</AuthenticationProvider>
	)
}

export default withThirdPartyAuth(SSOLayout)
