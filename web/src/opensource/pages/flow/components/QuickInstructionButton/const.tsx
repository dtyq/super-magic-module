import type { QuickInstruction } from "@/types/bot"
import { DisplayType } from "@/types/bot"
import {
	IconWand,
	IconAlertCircle,
	IconBell,
	IconBellCancel,
	IconBellCheck,
	IconBellPause,
	IconBellPlus,
	IconBellX,
	IconCircleCheck,
	IconCircleX,
	IconClockCheck,
	IconClockPause,
	IconClockPlay,
	IconClockPlus,
	IconClockStop,
	IconClockX,
	IconFlag,
	IconFlagCancel,
	IconFlagCheck,
	IconFlagPause,
	IconFlagPlus,
	IconFlagX,
	IconHeart,
	IconHeartCancel,
	IconHeartCheck,
	IconHeartPause,
	IconHeartPlus,
	IconHeartX,
	IconHome,
	IconHomeCancel,
	IconHomeCheck,
	IconHomeEdit,
	IconHomeRibbon,
	IconHomeX,
	IconPlayerPause,
	IconPlayerPlay,
	IconPlayerStop,
	IconPlayerPlayFilled,
	IconPlayerPauseFilled,
	IconPlayerStopFilled,
	IconCircleCheckFilled,
	IconAlertCircleFilled,
	IconCircleXFilled,
	IconMoodHappy,
	IconFileUpload,
	IconMessage2Plus,
	IconMicrophone,
} from "@tabler/icons-react"
import i18next from "i18next"

export const StatusIcons = {
	IconWand,
	IconAlertCircle,
	IconBell,
	IconBellCancel,
	IconBellCheck,
	IconBellPause,
	IconBellPlus,
	IconBellX,
	IconCircleCheck,
	IconCircleX,
	IconClockCheck,
	IconClockPause,
	IconClockPlay,
	IconClockPlus,
	IconClockStop,
	IconClockX,
	IconFlag,
	IconFlagCancel,
	IconFlagCheck,
	IconFlagPause,
	IconFlagPlus,
	IconFlagX,
	IconHeart,
	IconHeartCancel,
	IconHeartCheck,
	IconHeartPause,
	IconHeartPlus,
	IconHeartX,
	IconHome,
	IconHomeCancel,
	IconHomeCheck,
	IconHomeEdit,
	IconHomeRibbon,
	IconHomeX,
	IconPlayerPause,
	IconPlayerPlay,
	IconPlayerStop,
	IconPlayerPlayFilled,
	IconPlayerPauseFilled,
	IconPlayerStopFilled,
	IconCircleCheckFilled,
	IconAlertCircleFilled,
	IconCircleXFilled,
	IconMoodHappy,
	IconFileUpload,
	IconMessage2Plus,
	IconMicrophone,
}

export type StatusIconKey = keyof typeof StatusIcons

export const SYSTEM_DISPLAY_TYPE = "display_type"

export const DEFAULT_ICON = "IconWand"

// 是否是系统指令
export const isSystemItem = (item: QuickInstruction): boolean =>
	SYSTEM_DISPLAY_TYPE in item && item[SYSTEM_DISPLAY_TYPE] === DisplayType.SYSTEM

// 指令插入位置
export enum InsertLocationMap {
	// 前方
	Before = 1,
	// 光标处
	Cursor = 2,
	// 后方
	Behind = 3,
}

// 指令插入位置选项
export const INSERT_OPTIONS = [
	{ value: InsertLocationMap.Before, label: i18next.t("explore.form.insertBefore") },
	{ value: InsertLocationMap.Cursor, label: i18next.t("explore.form.insertCursor") },
	{ value: InsertLocationMap.Behind, label: i18next.t("explore.form.insertBehind") },
]
