import { useClientDataSWR } from "@/utils/swr"
import type { User } from "@/types/user"
import { keyBy } from "lodash-es"
import { RequestUrl } from "@/opensource/apis/constant"
import { UserApi } from "@/opensource/apis"
import { useMemo } from "react"
import { useOrganization } from "./useOrganization"

/**
 * @description 获取当前账号所登录的设备
 */
export const useUserDevices = () => {
	return useClientDataSWR<User.UserDeviceInfo[]>(RequestUrl.getUserDevices, () =>
		UserApi.getUserDevices(),
	)
}

/**
 * @description 获取当前账号所处组织信息 Hook
 * @return {User.UserOrganization | undefined}
 */
export const useCurrentOrganization = (): User.UserOrganization | null => {
	const { organizations, organizationCode, magicOrganizationMap, teamshareOrganizationCode } =
		useOrganization()

	return useMemo(() => {
		// 获取组织映射
		const orgMap = keyBy(organizations, "organization_code")

		const array = keyBy(Object.values(magicOrganizationMap), "magic_organization_code")
		let org = null
		// 根据 magic 组织 Code 尝试获取组织
		if (organizationCode) {
			org = orgMap?.[array?.[organizationCode]?.third_platform_organization_code ?? ""]
		}
		if (!org && teamshareOrganizationCode) {
			org = orgMap?.[teamshareOrganizationCode]
		}
		return org
	}, [organizations, organizationCode, magicOrganizationMap, teamshareOrganizationCode])
}

/**
 * @description 获取当前账号所处组织信息 Hook
 * @return {User.UserOrganization | undefined}
 */
export const useCurrentMagicOrganization = (): User.MagicOrganization | null => {
	const { organizationCode, magicOrganizationMap } = useOrganization()

	return useMemo(() => {
		return magicOrganizationMap[organizationCode]
	}, [organizationCode, magicOrganizationMap])
}

export * from "./useAccount"
export * from "./useOrganization"
export * from "./useAuthorization"
export * from "./useUserInfo"
