import type { PropsWithChildren } from "react"
import { createContext } from "react"
import { useCreation, useDeepCompareEffect } from "ahooks"
import { reaction } from "mobx"
import { ClusterProviderStore } from "./cluster.context.store"
import { ClusterConfigSyncProvider } from "./ClusterConfigSyncProvider"

interface ClusterProviderProps {
	/** Access cluster change callback */
	onClusterChange?: (clusterCode: string) => void
}

export const ClusterContext = createContext<ClusterProviderStore>(new ClusterProviderStore())

export function ClusterProvider(props: PropsWithChildren<ClusterProviderProps>) {
	const { onClusterChange, children } = props

	const store = useCreation(() => new ClusterProviderStore(), [])

	useDeepCompareEffect(() => {
		const disposer = reaction(
			() => store.clusterCode,
			(code) => onClusterChange?.(code),
			{ fireImmediately: true },
		)

		return () => disposer()
	}, [store])

	return (
		<ClusterContext.Provider value={store}>
			<ClusterConfigSyncProvider>{children}</ClusterConfigSyncProvider>
		</ClusterContext.Provider>
	)
}
