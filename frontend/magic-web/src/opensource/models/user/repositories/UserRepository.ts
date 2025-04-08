import { GlobalBaseRepository } from "@/opensource/models/repository/GlobalBaseRepository"
import type { User } from "@/types/user"
import type { OrganizationResponse } from "@/opensource/services/user/UserService"

interface UserSchema {
	id?: string
	key: string
	value:
		| string
		| User.UserInfo
		| OrganizationResponse
		| null
		| Array<User.UserOrganization>
		| Record<string, User.MagicOrganization>
	enabled?: boolean
	createdAt?: number
	updatedAt?: number
}

export class UserRepository extends GlobalBaseRepository<UserSchema> {
	static tableName = "user"

	constructor() {
		super(UserRepository.tableName)
	}

	async getAuthorization(): Promise<string | null> {
		const config = await this.get("authorization")
		return config?.value as string
	}

	async setAuthorization(token: string): Promise<void> {
		return this.put({
			key: "authorization",
			value: token,
		})
	}

	async getUserInfo(): Promise<User.UserInfo | null> {
		const config = await this.get("userInfo")
		return config?.value as User.UserInfo
	}

	async setUserInfo(info: User.UserInfo | null): Promise<void> {
		return this.put({
			key: "userInfo",
			value: info,
		})
	}

	async setOrganization(org: OrganizationResponse | null): Promise<void> {
		return this.put({
			key: "organization",
			value: org,
		})
	}

	async getOrganizations(): Promise<Record<string, User.MagicOrganization> | null> {
		const config = await this.get("organizations")
		return config?.value as Record<string, User.MagicOrganization>
	}

	async setOrganizations(org: Record<string, User.MagicOrganization> | null): Promise<void> {
		return this.put({
			key: "organizations",
			value: org,
		})
	}

	async getTeamshareOrganizations(): Promise<Array<User.UserOrganization> | null> {
		const config = await this.get("teamshareOrganizations")
		return config?.value as Array<User.UserOrganization>
	}

	async setTeamshareOrganizations(org: Array<User.UserOrganization> | null): Promise<void> {
		return this.put({
			key: "teamshareOrganizations",
			value: org,
		})
	}

	async getOrganizationCode(): Promise<string | null> {
		const config = await this.get("organizationCode")
		return config?.value as string
	}

	async setOrganizationCode(org: string | null): Promise<void> {
		return this.put({
			key: "organizationCode",
			value: org,
		})
	}

	async getTeamshareOrganizationCode(): Promise<string | null> {
		const config = await this.get("teamshareOrganizationCode")
		return config?.value as string
	}

	async setTeamshareOrganizationCode(org: string | null): Promise<void> {
		return this.put({
			key: "teamshareOrganizationCode",
			value: org,
		})
	}
}
