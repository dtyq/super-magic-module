// 节流配置
const THROTTLE_WINDOW = 60 * 1000 // 时间窗口为 1 分钟
const THROTTLE_LIMIT = 1000 // 每分钟最多处理 100 个请求
let requestCount = 0
let windowStartTime = Date.now()

// 节流中间件
const throttleMiddleware = (req, res, next) => {
	const currentTime = Date.now()
	// 如果时间窗口已过，重置请求计数和窗口开始时间
	if (currentTime - windowStartTime > THROTTLE_WINDOW) {
		requestCount = 0
		windowStartTime = currentTime
	}
	// 如果请求数量超过限制，返回 429 状态码
	if (requestCount >= THROTTLE_LIMIT) {
		return res.status(200).json({
			code: 1000,
			message: "Too many requests, please try again later.",
		})
	}
	// 请求数量加 1
	requestCount++
	next()
}

module.exports = throttleMiddleware
