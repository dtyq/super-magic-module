import type { Container } from "@/opensource/services/ServiceContainer"
import magicClient from "../magic"
import {
	generateInvalidOrgResInterceptor,
	generateUnauthorizedResInterceptor,
	generateSuccessResInterceptor,
} from "./interceptor"

// 初始化标志，用于防止重复注册
let isInitialized = false

export function initialApi(service: Container) {
	// 如果已经初始化过，则直接返回
	if (isInitialized) {
		return
	}

	magicClient.addResponseInterceptor(generateUnauthorizedResInterceptor(service))
	magicClient.addResponseInterceptor(generateInvalidOrgResInterceptor(service))
	magicClient.addResponseInterceptor(generateSuccessResInterceptor())
	
	// 设置初始化标志为true
	isInitialized = true
}

export {
	generateInvalidOrgResInterceptor,
	generateUnauthorizedResInterceptor,
	generateSuccessResInterceptor,
}
