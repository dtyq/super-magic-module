import { createStyles } from "antd-style"
import { useEffect, useRef, useState } from "react"
import MagicSpin from "@/opensource/components/base/MagicSpin"
import { Flex } from "antd"

interface IsolatedHTMLRendererProps {
	content: string
	sandboxType?: "iframe" | "shadow-dom"
	className?: string
}

const useStyles = createStyles(({ css }) => {
	return {
		rendererContainer: css`
			width: 100%;
			height: 100%;
			overflow: auto;
		`,
		iframe: css`
			width: 100%;
			height: 100%;
			border: none;
			display: block;
		`,
		shadowHost: css`
			width: 100%;
			height: 100%;
			display: block;
			position: relative;
		`,
		loadingContainer: css`
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
		`,
	}
})

// 外部资源URL
const TAILWIND_CSS_URL = "https://cdn.bootcdn.net/ajax/libs/tailwindcss/2.2.0/tailwind.min.css"
const ECHARTS_JS_URL = "https://cdn.bootcdn.net/ajax/libs/echarts/5.4.3/echarts.min.js"

export default function IsolatedHTMLRenderer({
	content,
	sandboxType = "iframe",
	className,
}: IsolatedHTMLRendererProps) {
	const { styles, cx } = useStyles()
	const containerRef = useRef<HTMLDivElement>(null)
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null)

	// Shadow DOM实现
	useEffect(() => {
		if (sandboxType === "shadow-dom" && containerRef.current && !shadowRoot) {
			const root = containerRef.current.attachShadow({ mode: "open" })
			setShadowRoot(root)
		}
	}, [sandboxType, shadowRoot])

	// 处理Shadow DOM内容更新
	useEffect(() => {
		if (sandboxType === "shadow-dom" && shadowRoot) {
			// 清空已有内容
			while (shadowRoot.firstChild) {
				shadowRoot.removeChild(shadowRoot.firstChild)
			}

			// 添加基础样式
			const styleElement = document.createElement("style")
			styleElement.textContent = `
        :host {
          all: initial;
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: rgba(0, 0, 0, 0.85);
          line-height: 1.5;
          width: 100%;
          height: 100%;
          overflow: auto;
        }
        * {
          box-sizing: border-box;
        }
        a {
          color: #1890ff;
          text-decoration: none;
        }
        a:hover {
          color: #40a9ff;
        }
        img {
          max-width: 100%;
        }
      `
			shadowRoot.appendChild(styleElement)

			// 添加Tailwind CSS
			const tailwindLink = document.createElement("link")
			tailwindLink.rel = "stylesheet"
			tailwindLink.href = TAILWIND_CSS_URL
			shadowRoot.appendChild(tailwindLink)

			// 添加ECharts脚本
			const echartsScript = document.createElement("script")
			echartsScript.src = ECHARTS_JS_URL
			shadowRoot.appendChild(echartsScript)

			// 添加内容
			const container = document.createElement("div")
			container.innerHTML = content
			// 禁止翻译
			container.setAttribute("translate", "no")
			container.style.setProperty("translate", "no", "important")

			// 处理所有链接，确保在新窗口打开
			const links = container.querySelectorAll("a")
			links.forEach((link) => {
				const href = link.getAttribute("href")
				// 检查是否为锚点链接（以#开头）
				if (href && href.startsWith("#")) {
					// 为锚点链接添加点击事件处理
					link.addEventListener("click", function (e) {
						e.preventDefault()
						const targetId = href.substring(1)
						const targetElement = container.querySelector(`#${targetId}`)
						if (targetElement) {
							targetElement.scrollIntoView({ behavior: "smooth" })
						}
					})
				} else {
					// 非锚点链接在新窗口打开
					link.setAttribute("target", "_blank")
					link.setAttribute("rel", "noopener noreferrer")
				}
			})

			shadowRoot.appendChild(container)
		}
	}, [content, sandboxType, shadowRoot])

	// 处理iframe内容更新
	useEffect(() => {
		if (sandboxType === "iframe" && iframeRef.current) {
			const iframe = iframeRef.current

			try {
				// 方法1: 使用srcdoc属性直接设置HTML内容
				// 这是处理完整HTML文档的最简单方式
				// 添加禁止翻译的meta标签和外部资源
				const noTranslateContent = `
					<html translate="no">
					<head>
						<meta name="google" content="notranslate">
						<link rel="stylesheet" href="${TAILWIND_CSS_URL}">
						<script src="${ECHARTS_JS_URL}"></script>
						<style>
							body {
								translate: no !important;
							}
						</style>
					</head>
					<body>
						${content}
					</body>
					</html>
				`
				iframe.srcdoc = noTranslateContent

				// 当iframe加载完成后，处理链接和添加错误处理
				iframe.onload = function () {
					try {
						const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
						if (iframeDoc) {
							// 添加脚本处理链接和错误
							const script = iframeDoc.createElement("script")
							script.textContent = `
								(function() {
									// 给所有链接添加target属性
									document.querySelectorAll('a').forEach(link => {
										const href = link.getAttribute('href');
										// 检查是否为锚点链接（以#开头）
										if (href && href.startsWith('#')) {
											// 为锚点链接添加点击事件处理
											link.addEventListener('click', function(e) {
												e.preventDefault();
												const targetId = href.substring(1);
												const targetElement = document.getElementById(targetId);
												console.log(targetElement, "targetElement")
												if (targetElement) {
													targetElement.scrollIntoView({ behavior: 'smooth' });
												}
											});
										} else {
											// 非锚点链接在新窗口打开
											link.setAttribute('target', '_blank');
											link.setAttribute('rel', 'noopener noreferrer');
										}
									});

									// 捕获并处理脚本错误
									window.onerror = function(message, source, lineno, colno, error) {
										console.error('HTML渲染错误:', message);
										return true; // 防止错误向上传播
									};
								})();
							`
							iframeDoc.body.appendChild(script)
						}
					} catch (error) {
						console.error("处理iframe内容时出错:", error)
					}
				}
			} catch (error) {
				console.error("设置iframe内容时出错:", error)
				// 回退方案：如果srcdoc方法失败，尝试使用blob方法
				try {
					// 创建Blob对象，添加禁止翻译的标记和外部资源
					const noTranslateContent = `
						<html translate="no">
						<head>
							<meta name="google" content="notranslate">
							<link rel="stylesheet" href="${TAILWIND_CSS_URL}">
							<script src="${ECHARTS_JS_URL}"></script>
							<style>
								body {
									translate: no !important;
								}
							</style>
						</head>
						<body>
							${content}
						</body>
						</html>
					`
					const blob = new Blob([noTranslateContent], { type: "text/html" })
					const blobURL = URL.createObjectURL(blob)

					// 设置iframe的src为blob URL
					iframe.src = blobURL

					// 清理函数：页面卸载时释放blob URL
					return () => {
						URL.revokeObjectURL(blobURL)
					}
				} catch (blobError) {
					console.error("Blob方法也失败了:", blobError)
				}
			}
		}
		return undefined // 添加返回值，修复linter错误
	}, [content, sandboxType])

	// 如果content为空，显示loading状态
	if (!content || content.trim() === "") {
		return (
			<div className={cx(styles.rendererContainer, styles.loadingContainer, className)}>
				<Flex
					vertical
					align="center"
					justify="center"
					style={{ width: "100%", height: "100%" }}
				>
					<MagicSpin spinning />
				</Flex>
			</div>
		)
	}

	return (
		<div className={cx(styles.rendererContainer, className)}>
			{sandboxType === "iframe" ? (
				<iframe
					ref={iframeRef}
					className={styles.iframe}
					title="Isolated HTML Content"
					sandbox="allow-scripts allow-same-origin"
					translate="no"
				/>
			) : (
				<div ref={containerRef} className={styles.shadowHost} translate="no" />
			)}
		</div>
	)
}
