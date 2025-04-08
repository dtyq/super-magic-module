import { Checkbox, Flex } from "antd"
import { useTranslation } from "react-i18next"
import { createStyles } from "antd-style"

import type { HTMLAttributes } from "react"
import { PrivacyPolicyUrl, ServiceAgreementUrl } from "../../constants"

interface AgreePolicyCheckboxProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
	showCheckbox?: boolean
	agree?: boolean
	onChange?: (agree: boolean) => void
}

const useStyles = createStyles(({ css, isDarkMode, token }) => ({
	readAndAgree: css`
		white-space: nowrap;

		@media (max-width: 700px) {
			white-space: normal;
		}

		span,
		a {
			color: ${isDarkMode ? token.magicColorScales.grey[6] : token.magicColorUsages.text[1]};
			font-weight: 400;
			line-height: 16px;
		}
	`,
	underline: css`
		text-decoration: underline;
		text-underline-offset: 3px;
	`,
}))

function AgreePolicyCheckbox({
	agree,
	showCheckbox = false,
	onChange,
	className,
}: AgreePolicyCheckboxProps) {
	const { styles, cx } = useStyles()
	const { t } = useTranslation("login")

	const dom = (
		<Flex align="center" justify="center" wrap gap={8}>
			<span>{t("readAndAgree")}</span>
			<a
				href={ServiceAgreementUrl}
				target="_blank"
				className={styles.underline}
				rel="noreferrer"
			>
				{t("serviceAgreement")}
			</a>
			<span>{t("and")}</span>
			<a
				href={PrivacyPolicyUrl}
				target="_blank"
				className={styles.underline}
				rel="noreferrer"
			>
				{t("privacyPolicy")}
			</a>
		</Flex>
	)

	return (
		<Flex align="center" gap={8} className={cx(styles.readAndAgree, className)}>
			{showCheckbox ? (
				<Checkbox checked={agree} onChange={(e) => onChange?.(e.target.checked)}>
					<Flex gap={8}>{dom}</Flex>
				</Checkbox>
			) : (
				dom
			)}
		</Flex>
	)
}

export default AgreePolicyCheckbox
