import type {
	CalendarStatus,
	ChangeScope,
	EditScope,
} from "@/pages/calendar/components/CalendarMain/components/NewEventConfigure/constant"
import type { EventRefiners } from "@fullcalendar/common"

export interface CalendarEvent extends EventRefiners {}

export namespace Calendar {
	// 日程列表
	export type ListItem = {
		id: string
		title: string
		date: string
		is_all_day: boolean
		start_time: string
		end_time: string
		time_slot: string
		progress: string
		status: string
		meeting_room: string | null
	}

	// 用户闲忙状态
	export type UserStatus = {
		id: string
		schedule_id: string
		user_id: string
		status: string
		role: string
		join_time: string
		start_time: string
		end_time: string
		organization_code: string
		create_at: string
		update_at: string
		activity_status: string
	}

	// 评论/动态列表
	export type Comments = {
		id: string
		type: number
		resource_id: string
		resource_type: number
		parent_id: string
		description: string
		message: string[]
		attachments: Attachments[]
		organization_code: string
		created_at: string
		updated_at: string
		creator: {
			id: string
			magic_id: string
			user_id: string
			organization_code: string
			description: string
			like_num: number
			label: string
			status: number
			avatar_url: string
			nickname: string
			extra: string
			created_at: string
			updated_at: string
			deleted_at: string
			user_type: number
		}
	}

	// 提醒规则
	export type ReminderRule = {
		type: string
		offset: string
		remark: string
		custome_time?: string
	}

	// 重复规则
	export type RepeatRule = {
		repeat_type: string
		interval: number
		termination_type: string
		termination_value?: string
		weekdays: number[]
		monthly_day?: number
	}

	// 附件
	export type Attachments = {
		file_key: string
		file_name: string
		file_extension: string
		file_path?: string
	}

	// 保存日程
	export type SaveCalendarParams = {
		id?: string
		// 1:本次，2:所有日程，3:后续的每一次
		type?: EditScope | ChangeScope
		title: string
		description?: string
		start_time: string
		end_time: string
		is_all_day: boolean
		participant_ids: string[]
		meeting_room_id?: string
		activity_status: string
		location?: {
			title?: string
			desc?: string
		}
		reminder_rule: ReminderRule[]
		repeat_rule: RepeatRule
		attachments: Attachments[]
	}

	// AI 日程
	export type SaveAiCalendarParams = {
		user_input: string
	}

	// 参与人
	export type Participant = {
		avatar_url: string
		nickname: string
		user_id: string
	}

	// 日程详情
	export type CalendarDetail = SaveCalendarParams & {
		id: string
		series_id: string
		progress: string
		timezone: string
		organizer: {
			user_id: string
			nickname: string
			avatar_url: string
		}
		group_id: string
		summary: string
		comments: Comments[]
		meeting_room: string | null
		meeting_room_name: string
		organization_code: string
		created_at: string
		updated_at: string
		participant: Participant[]
		type?: number
		status: CalendarStatus
	}

	// 获取用户闲忙状态参数
	export type GetUserStatusParams = {
		start_time: string
		end_time: string
		user_ids: string[]
	}

	// 根据日期获取日程
	export type GetCalendarByDayParams = {
		dates: string[]
	}

	// 修改日程邀请状态
	export type UpdateCalendarStatusParams = {
		// 日程id
		schedule_id: string
		// 日程类型
		type: CalendarStatus
		// 修改范围
		modification_type: ChangeScope
	}

	// 评论日程
	export type CommentCalendarParams = {
		schedule_id: string
		message: string
		attachments: Attachments[]
	}

	export type Floors = {
		id: string
		name: string
	}

	export enum LocationType {
		City = "city",
		Location = "location",
		Floor = "floor",
	}

	export enum Capacity {
		Unlimited = "unlimited",
		"0-2" = "0-2",
		"3-6" = "3-6",
		"7-10" = "7-10",
		"10-15" = "10-15",
		"15+" = "15+",
	}

	// 获取会议室筛选条件
	export type FilteringCriteria = {
		location: {
			id: string
			name: string
			buildings: {
				id: string
				name: string
				floors: Floors[]
			}[]
			floors: Floors[]
		}[]
		capacity: Capacity
	}

	export type Location = {
		location_type: string
		location_value: string
	}

	// 可预约时间段
	export type AvailabelTimeLine = {
		start_time: string
		end_time: string
		time_slots: string
	}

	// 会议室列表
	export type MeetingRoom = {
		title: MeetingRoom
		id: string
		name: string
		capacity: string
		is_approval: boolean
		labels: string[]
		location: Location
		date: string
		is_allow_all_day: boolean
		available_slots: AvailabelTimeLine[]
		all_day_time_slots: AvailabelTimeLine
		advance_booking_days: number
		allow_periodic_booking: boolean
		booking_slots: {
			schedule_id: string
			user_id: string
			start_time: string
			end_time: string
			time_slots: string
			nickname: string
			is_current_user_booking: boolean
		}[]
	}

	// 某个时间段可预约的会议室
	export type TimeAvailableParams = {
		start_time?: string
		end_time?: string
		meeting_room_name?: string
		city?: string
		repeat_rule?: {
			repeat_type: string
			interval: number
			termination_type: string
			start_date: string
		}
		location?: Location
	}

	// 获取会议室参数
	export type MeetingRoomParams = {
		date?: string
		duration?: number | null
		capacity?: string
		meeting_room_name?: string
		location?: Location
	}

	// 删除日程参数
	export type DeleteCalendarParams = {
		schedule_id: string
		type: ChangeScope
	}

	// 添加邀请人参数
	export type AddParticipantParams = {
		id: string
		participant_ids: string[]
		// 1:添加到本次日程。2:添加到所有日程
		type: number
	}

	// 转让日程参数
	export type TransferOrganizerParams = {
		schedule_id: string
		target_user_id: string
		is_original_organizer_removed: boolean
	}

	// 筛选条件参数
	export type Option = {
		value: string | number
		label: string
		type?: LocationType
		children?: Option[]
	}
}
