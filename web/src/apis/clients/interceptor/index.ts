import type { Container } from "@/opensource/services/ServiceContainer"
import {
	initialApi as openSourceInitialApi,
	generateInvalidOrgResInterceptor,
	generateUnauthorizedResInterceptor,
	generateSuccessResInterceptor,
} from "@/opensource/apis/clients/interceptor"

export function initialApi(service: Container) {
	console.trace("initialApi", service)

	openSourceInitialApi(service)
}

export {
	generateInvalidOrgResInterceptor,
	generateUnauthorizedResInterceptor,
	generateSuccessResInterceptor,
}
