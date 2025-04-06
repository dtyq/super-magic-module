import { useCallback } from "react"
import type { NavigateOptions } from "react-router"
import { useNavigate as useReactNavigate } from "react-router"

export const useNavigate = () => {
	const navigate = useReactNavigate()
	return useCallback(
		(path: string, options?: NavigateOptions) => {
			navigate(path, options)
		},
		[navigate],
	)
}

export default useNavigate
