import { useRoutes } from "react-router"
import { registerRoutes } from "./routes"

const appRoutes = registerRoutes()

export function AppRoutes() {
	return useRoutes(appRoutes)
}
