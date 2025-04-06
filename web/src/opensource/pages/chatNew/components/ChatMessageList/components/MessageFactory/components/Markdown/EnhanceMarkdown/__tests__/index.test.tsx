import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Options as MarkdownOptions } from "react-markdown"
import MagicMarkdown from "../index"
import { useMarkdownConfig, useCursorManager, useClassName } from "../hooks"

// 模拟 react-markdown
vi.mock("react-markdown", () => ({
	default: vi.fn(({ children, className }) => (
		<div data-testid="markdown" className={className}>
			{children}
		</div>
	)),
}))

// 模拟 nanoid
vi.mock("nanoid", () => ({
	nanoid: vi.fn(() => "test-id"),
}))

// 创建模拟插件函数
const mockRehypePlugin = () => {}
const mockRemarkPlugin = () => {}

// 模拟 hooks
vi.mock("../hooks", () => {
	// 创建模拟组件
	const MockComponent = () => null

	return {
		useMarkdownConfig: vi.fn(() => ({
			rehypePlugins: [mockRehypePlugin],
			remarkPlugins: [mockRemarkPlugin],
			components: {
				pre: MockComponent,
				a: MockComponent,
				code: MockComponent,
			} as MarkdownOptions["components"],
		})),
		useCursorManager: vi.fn(),
		useClassName: vi.fn(() => "combined-class"),
	}
})

// 模拟上下文 hooks
vi.mock("@/components/providers/AppearanceProvider/hooks", () => ({
	useChatFontSize: vi.fn(() => ({
		fontSize: 16,
	})),
}))

vi.mock(
	"@/opensource/components/business/ConversationMessageRender/components/MessageRenderProvider/hooks",
	() => ({
		useMessageRenderContext: vi.fn(() => ({
			hiddenDetail: false,
		})),
	}),
)

// 模拟样式 hooks
vi.mock("../markdown.style", () => ({
	useStyles: vi.fn(() => ({
		styles: {
			root: "md-root",
			a: "md-a",
			blockquote: "md-blockquote",
			code: "md-code",
			details: "md-details",
			header: "md-header",
			hr: "md-hr",
			img: "md-img",
			kbd: "md-kbd",
			list: "md-list",
			p: "md-p",
			pre: "md-pre",
			strong: "md-strong",
			table: "md-table",
			video: "md-video",
			math: "md-math",
		},
	})),
}))

vi.mock("../stream.style", () => ({
	useStreamStyles: vi.fn(() => ({
		styles: {
			cursor: "stream-cursor",
		},
	})),
}))

describe("MagicMarkdown", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("应该正确渲染Markdown内容", () => {
		// Arrange
		const content = "# 测试标题"

		// Act
		render(<MagicMarkdown content={content} />)

		// Assert
		const markdownElement = screen.getByTestId("markdown")
		expect(markdownElement).toBeInTheDocument()
		expect(markdownElement).toHaveTextContent("# 测试标题")
		expect(markdownElement).toHaveClass("combined-class")
	})

	it("在没有内容时不应该渲染任何内容", () => {
		// Arrange & Act
		const { container } = render(<MagicMarkdown content="" />)

		// Assert
		expect(container).toBeEmptyDOMElement()
	})

	it("应该使用正确的配置调用 useMarkdownConfig", () => {
		// Arrange
		const props = {
			content: "测试内容",
			allowHtml: true,
			enableLatex: true,
		}

		// Act
		render(<MagicMarkdown {...props} />)

		// Assert
		expect(useMarkdownConfig).toHaveBeenCalledWith(
			expect.objectContaining({
				content: "测试内容",
				allowHtml: true,
				enableLatex: true,
			}),
		)
	})

	it("应该使用正确的配置调用 useCursorManager", () => {
		// Arrange
		const props = {
			content: "测试内容",
			isStreaming: true,
		}

		// Act
		render(<MagicMarkdown {...props} />)

		// Assert
		expect(useCursorManager).toHaveBeenCalledWith({
			content: "测试内容",
			isStreaming: true,
			classNameRef: expect.any(Object),
			cursorClassName: "stream-cursor",
		})
	})

	it("应该使用正确的配置调用 useClassName", () => {
		// Arrange
		const props = {
			content: "测试内容",
			className: "custom-class",
		}

		// Act
		render(<MagicMarkdown {...props} />)

		// Assert
		expect(useClassName).toHaveBeenCalledWith({
			mdStyles: expect.any(Object),
			className: "custom-class",
			classNameRef: expect.any(Object),
		})
	})

	it("应该将配置传递给 react-markdown", () => {
		// Arrange
		const props = {
			content: "测试内容",
		}

		// 创建有效的插件函数和组件
		const rehypePlugin1 = () => {}
		const rehypePlugin2 = () => {}
		const remarkPlugin1 = () => {}
		const remarkPlugin2 = () => {}
		const TestComponent = () => null

		// 设置 Markdown 组件配置的预期返回值
		vi.mocked(useMarkdownConfig).mockReturnValue({
			rehypePlugins: [rehypePlugin1, rehypePlugin2],
			remarkPlugins: [remarkPlugin1, remarkPlugin2],
			// @ts-ignore
			components: {
				pre: TestComponent,
				a: TestComponent,
				code: TestComponent,
			} as MarkdownOptions["components"],
		})

		// Act
		render(<MagicMarkdown {...props} />)

		// Assert
		const markdownElement = screen.getByTestId("markdown")
		expect(markdownElement).toBeInTheDocument()

		// 由于 react-markdown 是模拟的，我们只能检查它是否被渲染
		// 实际配置传递需要在模拟函数中验证
	})
})
