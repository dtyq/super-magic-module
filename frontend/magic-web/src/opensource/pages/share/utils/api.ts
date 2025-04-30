import magicFetcher from "@/opensource/apis/clients/magic"
// 分享是否需要密码
export const getShareIsNeedPassword = async ({ resource_id }: { resource_id: string }) => {
	const response = await magicFetcher.post(`/api/v1/share/resources/${resource_id}/check`)
	return response
}

// 获取分享详情
export const getShareDetail = async ({
	resource_id,
	password,
	page = 1,
	page_size = 500,
}: {
	resource_id: string
	password?: string
	page?: number
	page_size?: number
}) => {
	const url = `/api/v1/share/resources/${resource_id}/detail`

	const response = await magicFetcher.post(url, { pwd: password, page, page_size })
	return response
}
