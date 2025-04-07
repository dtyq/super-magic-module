import { initializeApp as openSourceInitializeApp } from "@/opensource/services/initializeApp"

// 导出单例
export const { userService, loginService, configService } = openSourceInitializeApp()
