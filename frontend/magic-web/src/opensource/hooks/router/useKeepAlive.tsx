import { useLocation, useOutlet, Outlet } from "react-router"
import { useEffect, useMemo, useReducer } from "react"
import { keepAliveRoutes } from "@/const/keepAliveRoutes"
import { RoutePath } from "@/const/routes"
import LoadingFallback from "@/opensource/components/fallback/LoadingFallback"

// 缓存状态类型
type CacheState = Record<string, React.ReactNode>

// 缓存action类型
type CacheAction =
	| { type: "ADD_CACHE"; path: string; outlet: React.ReactNode }
	| { type: "REMOVE_CACHE"; path: string }

/**
 * 使用keepAlive，根据配置的keepAliveRoutes，页面切换时，不卸载页面，改为隐藏，主要为了解决重新挂载的渲染性能问题
 * @returns { Content } - 渲染缓存的组件
 */
export const useKeepAlive = () => {
	const location = useLocation()
	const outlet = useOutlet()

	// 缓存reducer
	const cacheReducer = (state: CacheState, action: CacheAction): CacheState => {
		switch (action.type) {
			case "ADD_CACHE":
				return { ...state, [action.path]: action.outlet }
			case "REMOVE_CACHE":
				const newState = { ...state }
				delete newState[action.path]
				return newState
			default:
				return state
		}
	}

	const [caches, dispatch] = useReducer(cacheReducer, {})

	// 根据配置的keepAliveRoutes，判断是否需要缓存
	const shouldCache = useMemo(
		() => keepAliveRoutes.includes(location.pathname as RoutePath),
		[location.pathname],
	)

	// 监听路由变化，管理缓存
	useEffect(() => {
		if (shouldCache) {
			// 只在缓存不存在时添加
			if (!caches[location.pathname]) {
				dispatch({
					type: "ADD_CACHE",
					path: location.pathname,
					outlet,
				})
			}
		} else {
			// 非缓存路径，从缓存中移除
			if (caches[location.pathname]) {
				dispatch({ type: "REMOVE_CACHE", path: location.pathname })
			}
		}
	}, [shouldCache, location.pathname, outlet, caches])

	// 渲染缓存的内容
	const Content = useMemo(() => {
		// 获取所有缓存的页面内容
		const cachedOutlets = Object.entries(caches).map(([path, outlet]) => {
			const match = path === location.pathname

			return (
				<div
					key={path}
					style={{
						display: match ? "block" : "none",
						// 确保隐藏的元素不会被浏览器优化掉
						position: match ? "relative" : "absolute",
						width: match ? "auto" : 0,
						height: match ? "auto" : 0,
						overflow: "hidden",
					}}
					data-keepalive-id={`keepalive-${path}`}
				>
					{outlet}
				</div>
			)
		})

		return (
			<LoadingFallback>
				{/* 渲染所有缓存的页面，即使是隐藏状态 */}
				{cachedOutlets}
				{/* 非缓存路径的情况下渲染常规Outlet */}
				{!shouldCache && <Outlet />}
			</LoadingFallback>
		)
	}, [shouldCache, location.pathname, caches])

	return { Content }
}
