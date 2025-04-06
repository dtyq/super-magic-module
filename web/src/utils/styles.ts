import { DEFAULT_FONT_SIZE_BASE } from "@/const/style"

export const calculateRelativeSize = (baseSize: number, fontSize: number) => {
	return (baseSize / DEFAULT_FONT_SIZE_BASE) * fontSize
}
