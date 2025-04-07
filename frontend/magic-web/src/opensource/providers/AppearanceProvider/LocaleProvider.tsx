import type { PropsWithChildren } from "react"
import { configStore } from "@/opensource/models/config"
import { isRtlLang } from "rtl-detect"
import { observer } from "mobx-react-lite"
import { ConfigProvider } from "antd"
import { useRequest, useDeepCompareEffect } from "ahooks"
import { getAntdLocale } from "@/utils/locale"

const LocaleProvider = observer(({ children }: PropsWithChildren) => {
	const { displayLanguage } = configStore.i18n

	// detect document direction
	const documentDir = isRtlLang(displayLanguage) ? "rtl" : "ltr"

	const {
		data: locale,
		cancel,
		runAsync,
	} = useRequest((key: string) => getAntdLocale(key), {
		manual: true,
	})

	// change language
	useDeepCompareEffect(() => {
		runAsync?.(displayLanguage).catch(console.error)
		return () => {
			cancel?.()
		}
	}, [displayLanguage])

	return (
		<ConfigProvider direction={documentDir} locale={locale}>
			{children}
		</ConfigProvider>
	)
})

export default LocaleProvider
