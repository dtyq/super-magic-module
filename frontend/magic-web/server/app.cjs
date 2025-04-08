const express = require("express")
const path = require("path")

const app = express()
const R = require("ramda")
const cors = require("cors")

app.use(cors())
app.use(express.json())

const history = require("connect-history-api-fallback")
const { logger, morganMiddleware } = require("./logger.cjs")
const throttleMiddleware = require("./middleware/throttleMiddleware")

// 当且仅当为线上环境时禁用默认的 x-powered-by 响应头
if (process.env.NODE_ENV === "production") {
	app.disable("x-powered-by")
}

// 日志上报 API 端点
app.post("/log-report", throttleMiddleware, (req, res) => {
	const logs = req.body
	if (Array.isArray(logs)) {
		logs.forEach((log) => {
			logger.error(log)
		})
	} else {
		logger.error(logs)
	}
	res.status(200).json({
		code: 1000,
		message: "Logs reported successfully.",
	})
})

function setCustomCacheControl(res, p) {
	const excludeReg = [/service-worker\.js$/, /\.html$/]
	// 不缓存的页面
	if (excludeReg.some((v) => v.test(p))) {
		// Custom Cache-Control for HTML files
		res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
		res.setHeader("Pragma", "no-cache")
		res.setHeader("Expires", "0")
	} else {
		res.setHeader("Cache-Control", "max-age=31536000")
	}
}

app.get("/config.js", (req, res) => {
	const envVarWhitelist = [
		"MAGIC_APP_ENV",
		"MAGIC_IS_PRIVATE_DEPLOY",
		"MAGIC_TEAMSHARE_BASE_URL",
		"MAGIC_SOCKET_BASE_URL",
		"MAGIC_SERVICE_BASE_URL",
		"MAGIC_SERVICE_KEEWOOD_BASE_URL",
		"MAGIC_SERVICE_TEAMSHARE_BASE_URL",
		"MAGIC_AMAP_KEY",
		"MAGIC_GATEWAY_ADDRESS",
		"MAGIC_TEAMSHARE_WEB_URL",
		"MAGIC_KEEWOOD_WEB_URL",
		"MAGIC_APP_VERSION",
		"MAGIC_APP_SHA",
		"MAGIC_EDITION"
	]

	const isSafeEnvironmentVariable = (key) => {
		// 只暴露以MAGIC_开头且在白名单中的环境变量
		return key.startsWith("MAGIC_") && envVarWhitelist.includes(key)
	}

	res.set("Content-type", "text/javascript")
	res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
	res.setHeader("Pragma", "no-cache")
	res.setHeader("Expires", "0")

	const safeEnvVars = R.pickBy((_, key) => isSafeEnvironmentVariable(key), process.env)

	res.send(`window.CONFIG = ${JSON.stringify(safeEnvVars)}`)
})

app.get("/heartbeat", (req, res) => {
	res.status(200).json({ data: 200 })
})

app.use(
	history({
		index: "/index.html",
	}),
)

app.use(
	express.static(path.join(__dirname, "../dist"), {
		setHeaders: setCustomCacheControl,
	}),
)

// 静态资源请求关闭日志写入
// app.use(morganMiddleware)

// - 最后兜底的容错中间件 -
app.use((req, res) => {
	res.setHeader("Content-Type", "text/html")
	res.status(404)
	res.send("")
})

// 5xx
app.use((err, req, res, next) => {
	logger.error({
		url: req.url, // 当前访问的URL
		message: err?.message, // 错误信息
		memoryUsage: process.memoryUsage(), // 内存使用情况
		cpuUsage: process.cpuUsage(), // 吞吐量
		stack: err?.stack, // 错误堆栈 (pid、time等信息插件中已处理)
	})

	res.setHeader("Content-Type", "text/html")
	res.status(500)
	res.send("")
})

const PORT = 8080
app.listen(PORT, "0.0.0.0", (err) => {
	if (err) {
		console.log(err)
		return
	}
	console.log(`访问链接:http://localhost:${PORT} --服务已启动`)
})
