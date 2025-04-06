import { Upload, PlatformType } from "../src"
import { InitException, InitExceptionCode } from "../src/Exception/InitException"
import { UploadManger } from "../src/utils/UploadManger"
import type { Method } from "../src/types/request"

// Mock UploadManger
jest.mock("../src/utils/UploadManger", () => {
	const mockCreateTask = jest.fn().mockReturnValue({
		success: jest.fn(),
		fail: jest.fn(),
		progress: jest.fn(),
		cancel: jest.fn(),
		pause: jest.fn(),
		resume: jest.fn(),
	})

	const MockUploadManger = jest.fn().mockImplementation(() => {
		return {
			createTask: mockCreateTask,
			pauseAllTask: jest.fn(),
			resumeAllTask: jest.fn(),
			cancelAllTask: jest.fn(),
			// 添加tasks数组用于测试
			tasks: [],
		}
	})

	return {
		UploadManger: MockUploadManger,
	}
})

// Mock request module
jest.mock("../src/utils/request", () => {
	return {
		request: jest.fn().mockImplementation(({ success }) => {
			if (success && typeof success === "function") {
				success({ data: "success" })
			}
			return Promise.resolve({ data: "success" })
		}),
		cancelRequest: jest.fn(),
		pauseRequest: jest.fn(),
		completeRequest: jest.fn(),
	}
})

describe("Upload 类测试", () => {
	let uploadInstance: Upload
	let mockFile: File

	beforeEach(() => {
		uploadInstance = new Upload()
		mockFile = new File(["test content"], "test.txt", { type: "text/plain" })
		jest.clearAllMocks()
	})

	describe("构造函数", () => {
		test("应该正确实例化", () => {
			expect(uploadInstance).toBeInstanceOf(Upload)

			// 重置mock统计
			jest.clearAllMocks()

			// 重新创建实例，以确保UploadManger被调用
			new Upload()

			// 验证UploadManger被调用
			expect(UploadManger).toHaveBeenCalled()
		})

		test("应该有正确的版本号", () => {
			expect(typeof Upload.version).toBe("string")
			expect(Upload.version.length).toBeGreaterThan(0)
		})
	})

	describe("upload 方法", () => {
		test("如果缺少必要参数应该抛出异常", () => {
			const config = {
				url: "",
				method: "POST" as Method,
				file: mockFile,
				fileName: "test.txt",
			}

			expect(() => {
				uploadInstance.upload(config)
			}).toThrow(InitException)

			expect(() => {
				uploadInstance.upload({
					...config,
					url: "http://example.com",
					method: "" as Method,
				})
			}).toThrow(InitException)
		})

		test("当文件名中包含特殊字符时应该抛出异常", () => {
			const config = {
				url: "http://example.com",
				method: "POST" as Method,
				file: mockFile,
				fileName: "test%.txt",
				option: {
					rewriteFileName: false,
				},
			}

			expect(() => {
				uploadInstance.upload(config)
			}).toThrow(
				new InitException(
					InitExceptionCode.UPLOAD_FILENAME_EXIST_SPECIAL_CHAR,
					config.fileName,
				),
			)
		})

		test("当启用重写文件名选项时应该生成新文件名", () => {
			const config = {
				url: "http://example.com",
				method: "POST" as Method,
				file: mockFile,
				fileName: "test.txt",
				option: {
					rewriteFileName: true,
				},
			}

			const oldFileName = config.fileName
			uploadInstance.upload(config)
			expect(config.fileName).not.toBe(oldFileName)
			expect(config.fileName).toMatch(/^.+\.txt$/)
		})

		test("应该调用 uploadManger.createTask 方法", () => {
			const config = {
				url: "http://example.com",
				method: "POST" as Method,
				file: mockFile,
				fileName: "test.txt",
				option: {
					rewriteFileName: false,
				},
			}

			uploadInstance.upload(config)
			expect(uploadInstance.uploadManger.createTask).toHaveBeenCalledWith(
				config.file,
				config.fileName,
				config,
				config.option,
			)
		})
	})

	describe("下载方法", () => {
		test("download 方法应该调用 request 方法并返回 Promise", async () => {
			const downloadConfig = {
				url: "http://example.com/download",
				method: "POST" as Method,
				headers: { "Content-Type": "application/json" },
			}

			const result = await Upload.download(downloadConfig)
			expect(result).toEqual({ data: "success" })
		})

		test("download 方法应处理不同类型的body参数 - FormData", async () => {
			const formData = new FormData()
			formData.append("key", "value")

			const downloadConfig = {
				url: "http://example.com/download",
				method: "POST" as Method,
				headers: { "Content-Type": "multipart/form-data" },
				body: formData,
				option: {
					image: [
						{
							type: "resize" as const,
							params: { width: 100, height: 100 },
						},
					],
				},
			}

			await Upload.download(downloadConfig)
			// 验证FormData包含options字段
			expect(formData.has("options")).toBe(true)
			const optionsValue = formData.get("options")
			expect(optionsValue).toBe(JSON.stringify(downloadConfig.option))
		})

		test("download 方法应处理不同类型的body参数 - JSON字符串", async () => {
			const jsonBody = JSON.stringify({ test: "value" })
			const option = {
				image: [
					{
						type: "resize" as const,
						params: { width: 100, height: 100 },
					},
				],
			}

			const downloadConfig = {
				url: "http://example.com/download",
				method: "POST" as Method,
				headers: { "Content-Type": "application/json" },
				body: jsonBody,
				option,
			}

			// 请求模块是模拟的，所以我们关注内部处理
			await Upload.download(downloadConfig)

			// 验证request被正确调用
			const { request } = require("../src/utils/request")
			expect(request).toHaveBeenCalledWith(
				expect.objectContaining({
					data: JSON.stringify({
						test: "value",
						options: option,
					}),
				}),
			)
		})

		test("download 方法应处理不同类型的body参数 - 对象", async () => {
			const objectBody = { test: "value" }
			const option = {
				image: [
					{
						type: "resize" as const,
						params: { width: 100, height: 100 },
					},
				],
			}

			const downloadConfig = {
				url: "http://example.com/download",
				method: "POST" as Method,
				headers: { "Content-Type": "application/json" },
				body: objectBody,
				option,
			}

			await Upload.download(downloadConfig)

			// 验证request被正确调用
			const { request } = require("../src/utils/request")
			expect(request).toHaveBeenCalledWith(
				expect.objectContaining({
					data: JSON.stringify({
						test: "value",
						options: option,
					}),
				}),
			)
		})

		test("download 方法应处理body处理过程中的异常", async () => {
			// 创建一个会导致JSON.parse失败的有问题的JSON字符串
			const malformedJson = "{ invalid json }"

			const downloadConfig = {
				url: "http://example.com/download",
				method: "POST" as Method,
				headers: { "Content-Type": "application/json" },
				body: malformedJson,
				option: {
					image: [
						{
							type: "resize" as const,
							params: { width: 100, height: 100 },
						},
					],
				},
			}

			// 不应抛出异常，而应该使用原始body
			await expect(Upload.download(downloadConfig)).resolves.toEqual({
				data: "success",
			})

			// 验证request被调用，使用原始body
			const { request } = require("../src/utils/request")
			expect(request).toHaveBeenCalledWith(
				expect.objectContaining({
					data: malformedJson,
				}),
			)
		})
	})

	describe("任务控制方法", () => {
		test("pause 方法应该调用 uploadManger.pauseAllTask", () => {
			uploadInstance.pause()
			expect(uploadInstance.uploadManger.pauseAllTask).toHaveBeenCalled()
		})

		test("resume 方法应该调用 uploadManger.resumeAllTask", () => {
			uploadInstance.resume()
			expect(uploadInstance.uploadManger.resumeAllTask).toHaveBeenCalled()
		})

		test("cancel 方法应该调用 uploadManger.cancelAllTask", () => {
			uploadInstance.cancel()
			expect(uploadInstance.uploadManger.cancelAllTask).toHaveBeenCalled()
		})
	})

	describe("静态方法", () => {
		test("subscribeLogs 方法应该注册回调函数", () => {
			// 获取logPubSub模块
			const logPubSub = require("../src/utils/logPubSub").default

			// 模拟订阅函数
			const subscribeSpy = jest.spyOn(logPubSub, "subscribe").mockImplementation(jest.fn())

			// 调用 subscribeLogs 方法
			const callback = jest.fn()
			Upload.subscribeLogs(callback)

			// 验证 subscribe 方法被调用，并且传入正确的回调函数
			expect(subscribeSpy).toHaveBeenCalledWith(callback)

			// 恢复原始方法
			subscribeSpy.mockRestore()
		})
	})

	describe("PlatformType", () => {
		test("导出的 PlatformType 应该包含预期的平台类型", () => {
			// 使用正确的枚举成员属性
			expect(PlatformType.OSS).toBe("aliyun")
			expect(PlatformType.TOS).toBe("tos")
			expect(PlatformType.Kodo).toBe("qiniu")
			expect(PlatformType.OBS).toBe("obs")
		})
	})
})
