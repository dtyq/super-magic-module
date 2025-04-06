import type { DepartmentSelectItem } from "@/opensource/components/business/MemberDepartmentSelectPanel/types"
import type { ResourceTypes } from "../types"

export enum ManagerModalType {
	// 权限管理
	Auth = "auth",
	// 部门选择
	Department = "department",
}

export type AuthExtraData = {
	resourceId: string
	resourceType: ResourceTypes
}

export type DepartmentExtraData = {
	onOk: (value: Pick<DepartmentSelectItem, "id" | "name">[]) => void
	value: Pick<DepartmentSelectItem, "id" | "name">[]
}

export type ExtraData = AuthExtraData | DepartmentExtraData

export interface WithExtraConfigProps<T extends ExtraData> {
	title: string
	open: boolean
	type: ManagerModalType
	extraConfig: T
	closeModal: () => void
}
