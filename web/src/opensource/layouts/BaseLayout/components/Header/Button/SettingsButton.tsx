import { IconAdjustmentsHorizontal } from "@tabler/icons-react"
import { useNavigate } from "@/opensource/hooks/useNavigate"
import { useMemoizedFn } from "ahooks"
import { RoutePath } from "@/const/routes"
import Button from "./Button"

function SettingsButton() {
	const navigate = useNavigate()

	const onClick = useMemoizedFn(() => {
		navigate(RoutePath.Settings)
	})

	return (
		<Button onClick={onClick}>
			<IconAdjustmentsHorizontal size={18} stroke={1.5} />
		</Button>
	)
}

export default SettingsButton
