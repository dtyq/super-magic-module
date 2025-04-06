import { memo } from "react"
import { Switch } from "antd"
import { useAppearanceStore } from "@/opensource/providers/AppearanceProvider/context"
import { useMemoizedFn } from "ahooks"

const AiCompletionSwitch = memo(() => {
	const value = useAppearanceStore((state) => state.aiCompletion)

	const onChange = useMemoizedFn((v: boolean) => {
		useAppearanceStore.setState({ aiCompletion: v })
	})

	return <Switch checked={value} onChange={onChange} />
})

export default AiCompletionSwitch
