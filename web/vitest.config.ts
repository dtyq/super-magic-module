import { resolve } from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
	resolve: {
		alias: {
			"@/": `${resolve(__dirname, "./src/")}/`,
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: [
			resolve(__dirname, "src/test/setup.ts"),
			resolve(__dirname, "packages/magic-ui/src/test/setup.tsx"),
		],
		env: {
			CI: process.env.CI === "true" ? "true" : undefined,
		},
		server: {
			deps: {
				inline: ["esdk-obs-browserjs", "@feb/upload-sdk"],
			},
		},
	},
})
