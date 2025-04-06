import type { AuthMember } from "../types"
import { OperationTypes } from "../types"

/**
 * 判断当前用户是否可以编辑某个成员的权限
 * @param auth 要判断的成员
 * @param currentUserId 当前用户ID
 * @param currentUserAuth 当前用户权限
 * @param authList 当前权限列表
 * @param originalAuthList 原始权限列表
 * @returns 是否可以编辑
 */
export const canEditMemberAuth = (
	auth: AuthMember,
	currentUserId: string,
	currentUserAuth: OperationTypes | undefined,
	originalAuthList: AuthMember[],
): boolean => {
	// 当前用户不能编辑自己
	if (auth.target_id === currentUserId) {
		return false
	}

	// 创建者可以编辑除自己以外的所有人
	if (currentUserAuth === OperationTypes.Owner) {
		return auth.operation !== OperationTypes.Owner
	}

	// 管理员的特殊处理
	if (currentUserAuth === OperationTypes.Admin) {
		// 不能编辑创建者
		if (auth.operation === OperationTypes.Owner) {
			return false
		}

		// 查找原始权限
		const originalAuth = originalAuthList.find((item) => item.target_id === auth.target_id)

		// 如果原始权限是管理员，则不能编辑
		if (originalAuth?.operation === OperationTypes.Admin) {
			return false
		}

		// 其他情况可以编辑
		return auth.target_id !== currentUserId
	}

	// 其他权限不能编辑任何人
	return false
}

/**
 * 判断是否禁用选择框
 * @param member 要判断的成员
 * @param currentUserId 当前用户ID
 * @param currentUserAuth 当前用户权限
 * @param authList 当前权限列表
 * @param originalAuthList 原始权限列表
 * @param creator 创建者信息
 * @returns 是否禁用
 */
export const isDisabled = (
	member: AuthMember,
	currentUserId: string,
	currentUserAuth: OperationTypes | undefined,
	originalAuthList: AuthMember[],
	creator: AuthMember | undefined,
): boolean => {
	// 当前用户永远禁用
	if (member.target_id === currentUserId) {
		return true
	}

	// 创建者永远禁用
	if (member.target_id === creator?.target_id) {
		return true
	}

	// 当前用户是管理员时的特殊处理
	if (currentUserAuth === OperationTypes.Admin) {
		// 查找原始权限
		const originalAuth = originalAuthList.find((item) => item.target_id === member.target_id)

		// 如果原始权限是创建者，则禁用
		if (originalAuth?.operation === OperationTypes.Owner) {
			return true
		}

		// 如果原始权限是管理员，则禁用
		if (originalAuth?.operation === OperationTypes.Admin) {
			return true
		}

		// 其他情况不禁用，允许管理员添加/修改普通用户的权限
		return false
	}

	// 当前用户是创建者时，可以管理除自己以外的所有人
	return false
}

/**
 * 获取禁用的成员ID列表（用于组织架构面板）
 * @param authList 当前权限列表
 * @param originalAuthList 原始权限列表
 * @param currentUserId 当前用户ID
 * @param currentUserAuth 当前用户权限
 * @returns 禁用的成员ID列表
 */
export const getDisabledMemberIds = (
	originalAuthList: AuthMember[],
	currentUserId: string,
	currentUserAuth: OperationTypes | undefined,
): { id: string; dataType: string }[] => {
	return originalAuthList
		.filter((item) => {
			// 创建者不能被禁用
			if (item.operation === OperationTypes.Owner) {
				return true
			}

			// 如果当前用户是创建者，只有自己不能被禁用
			if (currentUserAuth === OperationTypes.Owner) {
				return item.target_id === currentUserId
			}

			// 如果当前用户是管理员，则创建者、原始管理员和自己都不能被禁用
			if (currentUserAuth === OperationTypes.Admin) {
				return item.operation === OperationTypes.Admin || item.target_id === currentUserId
			}

			// 其他情况，所有管理员和创建者都不能被禁用
			return item.operation === OperationTypes.Admin
		})
		.map((item) => ({
			id: item.target_id,
			dataType: "user", // 这里可能需要根据实际情况调整
		}))
}
