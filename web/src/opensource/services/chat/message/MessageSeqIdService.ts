import localstorage from "@/utils/localstorage"
import { bigNumCompare } from "@/utils/string"
import { userStore } from "@/opensource/models/user"
import { platformKey } from "@/utils/storage"

class MessageSeqIdService {
	// eslint-disable-next-line class-methods-use-this
	get magicId() {
		return userStore.user.userInfo?.magic_id
	}

	/**
	 * 获取全局最后拉取消息序列号的存储键
	 */
	private get globalPullSeqIdKey() {
		return platformKey(`pullLastSeqId/${this.magicId}`)
	}

	/**
	 * 获取会话级别最后拉取消息序列号的存储键
	 */
	private get conversationPullSeqIdKey() {
		return platformKey(`conversationPullSeqId/${this.magicId}`)
	}

	/**
	 * 获取组织级别最后渲染消息序列号的存储键
	 */
	private get renderLastSeqIdKey() {
		return platformKey(`renderLastSeqId/${this.magicId}`)
	}

	/**
	 * 获取会话级别最后拉取消息序列号的存储键
	 */
	private get conversationdRenerSeqIdKey() {
		return platformKey(`conversationRenderSeqId/${this.magicId}`)
	}

	// ========== 全局拉取序列号管理 ==========
	/**
	 * 获取全局最后拉取的序列号
	 */
	public getGlobalPullSeqId(): string {
		return localstorage.get(this.globalPullSeqIdKey) ?? ""
	}

	/**
	 * 更新全局最后拉取的序列号
	 */
	public updateGlobalPullSeqId(seqId: string): void {
		localstorage.set(this.globalPullSeqIdKey, seqId)
	}

	// ========== 会话级别拉取序列号管理 ==========
	/**
	 * 获取所有会话的拉取序列号映射
	 */
	public getConversationPullSeqIds(): Record<string, string> {
		return localstorage.get(this.conversationPullSeqIdKey, true) ?? {}
	}

	/**
	 * 获取指定会话的拉取序列号
	 */
	public getConversationPullSeqId(conversationId: string): string {
		return this.getConversationPullSeqIds()[conversationId] ?? ""
	}

	/**
	 * 设置所有会话的拉取序列号映射
	 */
	public setConversationPullSeqIds(seqIds: Record<string, string>): void {
		localstorage.set(this.conversationPullSeqIdKey, seqIds)
	}

	/**
	 * 更新指定会话的拉取序列号
	 */
	public updateConversationPullSeqId(conversationId: string, seqId: string): void {
		const seqIds = this.getConversationPullSeqIds()
		if (bigNumCompare(seqId, seqIds[conversationId] ?? "0") > 0) {
			seqIds[conversationId] = seqId
			this.setConversationPullSeqIds(seqIds)
		}
	}

	/**
	 * 删除指定会话的拉取序列号
	 */
	public deleteConversationPullSeqId(conversationId: string): void {
		const seqIds = this.getConversationPullSeqIds()
		delete seqIds[conversationId]
		this.setConversationPullSeqIds(seqIds)
	}

	// ========== 组织级别渲染序列号管理 ==========
	/**
	 * 获取组织级别渲染对象
	 */
	public getOrganizationRenderObject(): Record<string, string> {
		return JSON.parse(localstorage.get(this.renderLastSeqIdKey) ?? "{}")
	}

	/**
	 * 设置组织级别渲染对象
	 */
	public setOrganizationRenderObject(object: Record<string, string>): void {
		localstorage.set(this.renderLastSeqIdKey, object)
	}

	/**
	 * 获取组织级别渲染序列号
	 */
	public getOrganizationRenderSeqId(organization_code: string) {
		if (!organization_code) {
			return ""
		}
		return this.getOrganizationRenderObject()[organization_code] ?? ""
	}

	public updateOrganizationRenderSeqId(organization_code: string, seq_id: string): void {
		const seqIds = this.getOrganizationRenderObject()

		if (bigNumCompare(seq_id, seqIds[organization_code] ?? "0") > 0) {
			seqIds[organization_code] = seq_id
			localstorage.set(this.renderLastSeqIdKey, seqIds)
		}
	}

	// ========== 会话级别渲染序列号管理 ==========
	/**
	 * 获取所有会话的渲染序列号映射
	 */
	public getConversationRenderSeqIds(): Record<string, string> {
		return localstorage.get(this.conversationdRenerSeqIdKey, true) ?? {}
	}

	/**
	 * 获取指定会话的渲染序列号
	 */
	public getConversationRenderSeqId(conversationId: string): string {
		return this.getConversationRenderSeqIds()[conversationId] ?? ""
	}

	/**
	 * 设置所有会话的渲染序列号映射
	 */
	public setConversationRenderSeqIds(seqIds: Record<string, string>): void {
		localstorage.set(this.conversationdRenerSeqIdKey, seqIds)
	}

	/**
	 * 更新指定会话的渲染序列号
	 */
	public updateConversationRenderSeqId(conversationId: string, seqId: string): void {
		const seqIds = this.getConversationRenderSeqIds()
		if (bigNumCompare(seqId, seqIds[conversationId] ?? "0") > 0) {
			seqIds[conversationId] = seqId
			this.setConversationRenderSeqIds(seqIds)
		}
	}

	/**
	 * 删除指定会话的渲染序列号
	 */
	public deleteConversationRenderSeqId(conversationId: string): void {
		const seqIds = this.getConversationRenderSeqIds()
		delete seqIds[conversationId]
		this.setConversationRenderSeqIds(seqIds)
	}

	// ========== 批量操作 ==========
	/**
	 * 清除指定会话的所有序列号
	 */
	public clearConversationSeqIds(conversationId: string): void {
		this.deleteConversationPullSeqId(conversationId)
		this.deleteConversationRenderSeqId(conversationId)
	}

	/**
	 * 清除所有序列号
	 */
	public clearAllSeqIds(): void {
		localstorage.remove(this.globalPullSeqIdKey)
		localstorage.remove(this.conversationPullSeqIdKey)
		localstorage.remove(this.renderLastSeqIdKey)
	}

	/**
	 * 初始化所有组织的渲染序列号
	 */
	public initAllOrganizationRenderSeqId(seqId: string) {
		const allOrganization = userStore.user.magicOrganizationMap
		this.setOrganizationRenderObject(
			Object.values(allOrganization).reduce((prev, current) => {
				prev[current.magic_organization_code] = seqId
				return prev
			}, {} as Record<string, string>),
		)
	}

	/**
	 * 检查所有组织的渲染序列号(避免新增组织，导致渲染序列号缺失)
	 */
	checkAllOrganizationRenderSeqId() {
		const allOrganization = userStore.user.magicOrganizationMap
		const allOrganizationRenderSeqId = this.getOrganizationRenderObject()

		Object.values(allOrganization).forEach((organization) => {
			if (!allOrganizationRenderSeqId[organization.magic_organization_code]) {
				allOrganizationRenderSeqId[organization.magic_organization_code] =
					this.getGlobalPullSeqId()
			}
		})

		this.setOrganizationRenderObject(allOrganizationRenderSeqId)
	}
}

export default new MessageSeqIdService()
