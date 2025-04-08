export const getAvatarUrl = (avatar: string) => {
	if (avatar.includes("static-legacy.dingtalk.com") && !avatar.includes("100w_100h")) {
		return `${avatar}@100w_100h`
	}

	return avatar
}
