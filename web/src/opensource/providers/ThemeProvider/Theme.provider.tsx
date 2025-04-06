import type { ThemeAppearance } from "antd-style"
import { ThemeProvider as AntdThemeProvider } from "antd-style"
import { type PropsWithChildren, useLayoutEffect } from "react"
import { CLASSNAME_PREFIX } from "@/const/style"
import { GlobalStyle } from "@/styles"
import { useMemoizedFn, useMount } from "ahooks"
import { magic } from "@/enhance/magicElectron"
import { useTheme } from "@/opensource/models/config/hooks"
import { genComponentTokenMap, genTokenMap } from "./tokenMap"
import { genPalettesConfigs } from "./utils"
import type { NewToken } from "../../../../types/theme"

function ThemeProvider({ children }: PropsWithChildren) {
	const { theme, prefersColorScheme, setTheme } = useTheme()
	
	useLayoutEffect(() => {
		const unSubscribe = magic?.theme?.subscribe?.((themeConfig) => {
			setTheme?.(themeConfig)
		})
		return () => {
			unSubscribe?.()
		}
	}, [setTheme])
	
	useMount(() => {
		if (theme !== "light") {
			setTheme("light")
		}
	})
	
	const themeConfig = useMemoizedFn((appearance: ThemeAppearance) => {
		const config = genPalettesConfigs(appearance)
		return {
			cssVar: {
				prefix: CLASSNAME_PREFIX,
			},
			token: {
				...genTokenMap(config.magicColorScales, config.magicColorUsages, appearance),
				titleBarHeight: 44,
				magicColorScales: config.magicColorScales,
				magicColorUsages: config.magicColorUsages,
			},
			components: genComponentTokenMap(
				config.magicColorScales,
				config.magicColorUsages,
				appearance,
			),
		}
	})
	
	return (
		<AntdThemeProvider<NewToken>
			prefixCls={CLASSNAME_PREFIX}
			appearance={prefersColorScheme}
			themeMode={theme}
			theme={themeConfig}
		>
			<GlobalStyle />
			{children}
		</AntdThemeProvider>
	)
}

export default ThemeProvider
