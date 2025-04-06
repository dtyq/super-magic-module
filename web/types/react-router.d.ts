import type { IndexRouteObject, NonIndexRouteObject } from "react-router/dist/lib/context"

/** 扩展 react-router 声明 */
declare module "react-router" {
	interface MagicIndexRouteObject extends IndexRouteObject {
		name?: string
	}

	interface MagicNonIndexRouteObject extends NonIndexRouteObject {
		name?: string
		children?: Array<MagicRouteObject>
	}

	export type MagicRouteObject = MagicIndexRouteObject | MagicNonIndexRouteObject
}
