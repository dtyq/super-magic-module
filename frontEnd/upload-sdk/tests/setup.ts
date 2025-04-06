/* eslint-disable class-methods-use-this */
// eslint-disable-next-line max-classes-per-file
const mockGlobalProperties = () => {
	// 创建XMLHttpRequest模拟
	const mockXMLHttpRequest = jest.fn().mockImplementation(() => ({
		open: jest.fn(),
		send: jest.fn(),
		setRequestHeader: jest.fn(),
		readyState: 4,
		status: 200,
		response: "{}",
		onload: jest.fn(),
		upload: {
			addEventListener: jest.fn(),
		},
		addEventListener: jest.fn((event: string, handler: () => void) => {
			// 直接触发加载完成事件
			if (event === "load") {
				setTimeout(() => handler(), 0)
			}
		}),
		getResponseHeader: jest.fn().mockReturnValue(""),
	}))

	// 创建FormData模拟
	const mockFormData = jest.fn().mockImplementation(() => ({
		append: jest.fn(),
		get: jest
			.fn()
			.mockReturnValue('{"image":[{"type":"resize","params":{"width":100,"height":100}}]}'),
		getAll: jest.fn().mockReturnValue(["mock-value"]),
		has: jest.fn().mockReturnValue(true),
		delete: jest.fn(),
	}))

	// 模拟Blob
	class MockBlob {
		content: Array<any>

		options: any

		size: number

		type: string

		constructor(content: Array<any> = [], options: any = {}) {
			this.content = content
			this.options = options
			this.size = content ? content.length : 0
			this.type = options?.type || ""
		}

		slice() {
			return { type: "application/octet-stream" }
		}

		text() {
			return Promise.resolve(this.content ? this.content.join("") : "")
		}

		arrayBuffer() {
			return Promise.resolve(new ArrayBuffer(8))
		}
	}

	// 确保全局File构造函数可用
	class MockFile extends MockBlob {
		name: string

		lastModified: number

		constructor(content: Array<any> = [], name: string = "", options: any = {}) {
			super(content, options)
			this.name = name
			this.type = options?.type || "application/octet-stream"
			this.lastModified = Date.now()
		}
	}

	// 创建URL对象模拟
	const mockURL = {
		createObjectURL: jest.fn().mockReturnValue("blob:mock-url"),
		revokeObjectURL: jest.fn(),
	}

	// 使用Object.defineProperty方式安全地添加到全局对象
	Object.defineProperty(global, "XMLHttpRequest", {
		value: mockXMLHttpRequest,
		writable: true,
	})

	Object.defineProperty(global, "FormData", {
		value: mockFormData,
		writable: true,
	})

	Object.defineProperty(global, "Blob", {
		value: MockBlob,
		writable: true,
	})

	Object.defineProperty(global, "File", {
		value: MockFile,
		writable: true,
	})

	Object.defineProperty(global, "URL", {
		value: mockURL,
		writable: true,
	})
}

// 初始化测试环境
mockGlobalProperties()

// 修补全局原型链，使instanceof检查正常工作
global.Object.prototype.constructor = function () {}

// 模拟esdk-obs-browserjs模块
jest.mock("esdk-obs-browserjs", () => {
	return jest.requireActual("./mocks/ObsClientMock.ts")
})

// 模拟mime模块
jest.mock("mime", () => {
	const getTypeMock = function (filename: string): string {
		if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg"
		if (filename.endsWith(".png")) return "image/png"
		if (filename.endsWith(".txt")) return "text/plain"
		if (filename.endsWith(".html")) return "text/html"
		if (filename.endsWith(".pdf")) return "application/pdf"
		return "application/octet-stream"
	}

	return {
		getType: jest.fn(getTypeMock),
	}
})

// 设置环境变量
process.env.NODE_ENV = "test"

// 使用全局配置代替直接使用beforeEach/afterEach
globalThis.beforeEach = () => {
	// 如果测试没有任何断言，它们也应该能够完成
}

globalThis.afterEach = () => {
	jest.clearAllMocks()
	jest.clearAllTimers()
}

// 其他全局模拟和测试设置可以在这里添加
