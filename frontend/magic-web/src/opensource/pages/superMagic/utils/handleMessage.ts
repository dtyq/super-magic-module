import { isEmpty } from "lodash-es"

export const messageFilter = (item: any) => {
	if (item?.event === "before_llm_request") {
		return true
	}
	if (item?.event === "after_llm_request" && isEmpty(item?.content) && isEmpty(item?.tool)) {
		return true
	}
	if (!item?.content && !item?.text?.content && isEmpty(item?.tool)) {
		return true
	}
	return false
}
