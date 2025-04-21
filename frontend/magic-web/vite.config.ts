import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve, join } from "path"
import mkcert from "vite-plugin-mkcert"
import babelPluginAntdStyle from "babel-plugin-antd-style-prod"
import tsConfig from "vite-tsconfig-paths"
// import legacy from "@vitejs/plugin-legacy"
import vitePluginImp from "vite-plugin-imp"

/** 环境变量前缀 */
const ENV_PREFIX = "MAGIC_"

/** 是否为测试环境 */
// const isTest = process.env.NODE_ENV === "test"
/** 是否为开发环境 */
const isDev = process.env.NODE_ENV === "development"
/** 是否为生产环境 */
// const isProd = process.env.NODE_ENV === "production"

export default defineConfig({
	build: {
		target: "es2015",
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
			},
			output: {
				manualChunks: {
					dayjs: ["dayjs"],
					"dingtalk-jsapi": ["dingtalk-jsapi"],
				},
			},
		},
	},
	server: {
		proxy: {
			"/server": {
				target: process.env.MAGIC_DEV_API_HOST ?? "",
				changeOrigin: true,
				rewrite: (p) => p.replace(/^\/server/, ""),
			},
		},
		port: 443,
		host: "0.0.0.0", // 监听所有地址
	},
	envPrefix: ENV_PREFIX,
	cacheDir: "node_modules/.vite", // 缓存目录
	optimizeDeps: {
		include: [
			"antd",
			"dayjs",
			"lodash-es",
			"react",
			"react-dom",
			"@tabler/icons-react",
			"@ant-design/icons",
			"ahooks",
			"antd",
			"antd-style",
			"zustand",
			"zustand/middleware",
			"i18next",
			"react-i18next",
			"@tiptap/react",
			"@tiptap/pm/state",
			"@tiptap/pm/view",
			"@tiptap/starter-kit",
			"@tiptap/extension-image",
			"@tiptap/extension-text-align",
		],
		exclude: ["antd/locale"],
	},
	assetsInclude: ["**/*.md", "**/*.mdx"],
	resolve: {
		alias: [
			{
				find: "@dtyq/magic-flow",
				replacement: join(__dirname, "node_modules/@dtyq/magic-flow/dist"),
                // 同步开发magic-flow时需要开启
                // replacement: join(__dirname, "../magic-flow/dist"),
			},
		],
	},
	plugins: [
		tsConfig(),
		react({
			babel: {
				plugins: [
					// refer: https://github.com/ant-design/babel-plugin-antd-style/pull/2
					[babelPluginAntdStyle, { enableInProduction: true, hashFilenameLevel: 1 }],
				],
			},
		}),
		vitePluginImp({
			libList: [
				{
					libName: "antd",
				},
			],
		}),
		// 用于本地生成HTTPS证书
		isDev &&
			mkcert({
				// 本地配置该地址的 host, 满足文件私有桶上传
				hosts: ["magic.t.teamshare.cn"],
			}),
		// 浏览器兼容
		// legacy({
		// 	targets: [
		// 		"last 2 versions and not dead",
		// 		"> 0.3%",
		// 		"chrome 91",
		// 		"chrome 108",
		// 		"safari 16",
		// 	], // 需要兼容的目标列表，可以设置多个
		// 	additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
		// 	renderLegacyChunks: true,
		// 	polyfills: [
		// 		"es.symbol",
		// 		"es.array.filter",
		// 		"es.promise",
		// 		"es.promise.finally",
		// 		"es/map",
		// 		"es/set",
		// 		"es.array.for-each",
		// 		"es.object.define-properties",
		// 		"es.object.define-property",
		// 		"es.object.get-own-property-descriptor",
		// 		"es.object.get-own-property-descriptors",
		// 		"es.object.keys",
		// 		"es.object.to-string",
		// 		"web.dom-collections.for-each",
		// 		"esnext.global-this",
		// 		"esnext.string.match-all",
		// 	],
		// }),
	],
	css: {
		preprocessorOptions: {
			less: {
				javascriptEnabled: true,
			},
		},
	},
})
