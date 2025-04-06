import { validatePhone } from "@/utils/string"
import type { FormItemProps } from "antd"
import { Form, Input } from "antd"
import { useTranslation } from "react-i18next"
import PhoneStateCodeSelect from "@/opensource/components/other/PhoneStateCodeSelect"
import { useStyles as useFormStyles } from "../../styles"

interface PhoneInputFormItemProps extends FormItemProps {
	hidden?: boolean
	name: string
	phoneStateCode: string
	onChangePhoneStateCode: (value: string) => void
}

const PhoneInputFormItem = ({
	hidden,
	phoneStateCode,
	onChangePhoneStateCode,
	name,
	...props
}: PhoneInputFormItemProps) => {
	const { t } = useTranslation("login")
	const { styles: formStyles } = useFormStyles()

	return (
		<Form.Item
			hidden={hidden}
			name={name}
			rules={[
				{
					validator: (_, value) => {
						if (!validatePhone(value)) {
							return Promise.reject(new Error(t("phone.invalid")))
						}
						return Promise.resolve()
					},
				},
			]}
			className={formStyles.formItem}
			{...props}
		>
			<Input
				className={formStyles.phoneInput}
				addonBefore={
					<PhoneStateCodeSelect
						value={phoneStateCode}
						onChange={onChangePhoneStateCode}
					/>
				}
				placeholder={t("phone.placeholder")}
			/>
		</Form.Item>
	)
}

export default PhoneInputFormItem
