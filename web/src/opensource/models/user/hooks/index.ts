import { useClientDataSWR } from "@/utils/swr"
import type { User } from "@/types/user"
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
export const useCurrentMagicOrganization = (): User.MagicOrganization | null => {
	const { organizationCode, magicOrganizationMap } = useOrganization()

	return useMemo(() => {
		return magicOrganizationMap[organizationCode]
	}, [organizationCode, magicOrganizationMap])
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
