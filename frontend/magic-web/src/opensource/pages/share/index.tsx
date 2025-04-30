import MagicIcon from "@/opensource/pages/share/assets/icon/magic_logo.svg"
import { getAttachmentsByThreadId } from "@/opensource/pages/superMagic/utils/api"
import { IconMenu2 } from "@tabler/icons-react"
import { useResponsive } from "ahooks"
import { Button } from "antd"
import { createStyles } from "antd-style"
import { isEmpty } from "lodash-es"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { ErrorDisplay, PasswordVerification } from "./components"
import ShareContent from "./components/ShareContent"
import { getShareDetail, getShareIsNeedPassword } from "./utils/api"

const useStyles = createStyles(({ token }) => {
	return {
		container: {
			width: "100vw",
			height: "100%",
			overflow: "hidden",
			backgroundColor: token.magicColorScales.grey[0],
			display: "flex",
			flexDirection: "column",
			boxSizing: "border-box",
			paddingBottom: "62px",
			"@media (max-width: 768px)": {
				display: "block",
			},
		},
		header: {
			width: "100%",
			height: "52px",
			padding: "10px 20px",
			display: "flex",
			justifyContent: "space-between",
			alignItems: "center",
			backgroundColor: token.magicColorScales.grey[0],
		},
		content: {
			height: "100%",
			padding: "0px 6px",
			overflow: "hidden",
			position: "relative",
			"@media (max-width: 768px)": {
				width: "100%",
				paddingBottom: "52px",
			},
		},
		magicIcon: {
			width: "140px",
			height: "32px",
		},
		loginButton: {
			height: "32px",
			padding: "6px 24px",
			borderRadius: "8px",
			backgroundColor: token.magicColorUsages.white,
			color: token.magicColorUsages.text[1],
			border: `1px solid ${token.magicColorUsages.border[1]}`,
			fontWeight: 400,
			fontSize: "14px",
		},
		menuIconContainer: {
			width: 18,
			height: 32,
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		},
		menuIcon: {
			width: 18,
			height: 18,
		},
	}
})

export default function Share() {
	const { styles } = useStyles()
	const navigate = useNavigate()
	// const [shareId, setShareId] = useState<string>("")
	const [isLogined, setIsLogined] = useState(true)
	const { pathname, search } = useLocation()
	const [isNeedPassword, setIsNeedPassword] = useState(false)
	const [resourceId, setResourceId] = useState("")
	const [passwordFromUrl, setPasswordFromUrl] = useState("")
	const [data, setData] = useState({}) as any
	const [error, setError] = useState<Error | null>(null)
	const [attachments, setAttachments] = useState([])
	const [loading, setLoading] = useState(false)
	const responsive = useResponsive()
	const [menuVisible, setMenuVisible] = useState(false)
	const isMobile = responsive.md === false // md breakpoint is typically 768px, so anything smaller is mobile
	const disPlayTask = responsive.lg === false
	const fetchPageCountRef = useRef(0)

	const getShareData = ({
		resource_id,
		password,
	}: {
		resource_id: string
		password?: string
	}) => {
		return new Promise((resolve, reject) => {
			const allData: any = { list: [] }
			fetchPageCountRef.current = 0
			const pageSize = 500

			const fetchPage = async (page = 1) => {
				try {
					fetchPageCountRef.current += 1
					const res: any = await getShareDetail({ resource_id, password, page })

					// Merge data
					if (page === 1) {
						// Keep all the metadata from first response
						Object.assign(allData, res.data)
					}

					// Append items from this page
					if (res.data.list?.length) {
						allData.list = [...(allData.list || []), ...(res.data.list || [])]
					}

					// Check if we need to fetch more pages - calculate based on current page and total
					const total = res.data.total || 0
					const totalPages = Math.ceil(total / pageSize)

					if (page < totalPages) {
						// Fetch next page
						await fetchPage(page + 1)
					} else {
						// 在resolve之前对数组进行去重，使用message_id作为唯一标识，保持原有顺序
						if (allData.list && allData.list.length > 0) {
							const uniqueIds = new Set()
							allData.list = allData.list.filter((item: any) => {
								if (item.message_id && uniqueIds.has(item.message_id)) {
									return false
								}
								if (item.message_id) {
									uniqueIds.add(item.message_id)
								}
								return true
							})
						}
						resolve({
							...res,
							data: allData,
						})
					}
				} catch (error) {
					reject(error)
				}
			}

			// Start fetching from first page
			fetchPage()
		})
	}

	// 从URL中删除password参数
	const removePasswordFromUrl = useCallback(() => {
		const urlSearchParams = new URLSearchParams(search)
		if (urlSearchParams.has("password")) {
			urlSearchParams.delete("password")
			const newSearch = urlSearchParams.toString() ? `?${urlSearchParams.toString()}` : ""
			navigate(`/share/${resourceId}${newSearch}`, { replace: true })
		}
	}, [search, resourceId, navigate])

	useEffect(() => {
		if (data?.temporary_token) {
			// @ts-ignore 给window添加临时token
			window.temporary_token = data.temporary_token
			updateAttachments()
		}
	}, [data])

	useEffect(() => {
		// 从URL路径中提取share后面的ID
		const match = pathname.match(/\/share\/([^/]+)/)

		if (match && match[1]) {
			const resource_id = match[1]
			setResourceId(resource_id)
		}
	}, [pathname])

	const updateAttachments = useCallback(() => {
		if (resourceId) {
			getAttachmentsByThreadId({ id: resourceId }).then((res: any) => {
				setAttachments(res)
			})
		}
	}, [resourceId])

	useEffect(() => {
		if (resourceId) {
			setLoading(true)
			setError(null)
			getShareIsNeedPassword({ resource_id: resourceId })
				.then((res: any) => {
					setIsNeedPassword(res?.has_password)

					// 获取URL中的password参数
					const urlSearchParams = new URLSearchParams(search)
					const password = urlSearchParams.get("password")
					setPasswordFromUrl(password || "")
					if (res?.user_id) {
						setIsLogined(true)
					} else {
						setIsLogined(false)
					}
					if (!res?.has_password) {
						console.log("没有密码")
						return getShareData({ resource_id: resourceId })
							.then((newData: any) => {
								setData(newData)
								// 删除URL中的password参数
								removePasswordFromUrl()
								return newData
							})
							.catch((err) => {
								setError(err)
								return null
							})
					}

					if (res?.has_password && password) {
						console.log("有密码")
						// 如果需要密码且URL中有密码，直接尝试验证
						return getShareData({
							resource_id: resourceId,
							password,
						})
							.then((newData: any) => {
								setData(newData)
								// 删除URL中的password参数
								removePasswordFromUrl()
								return newData
							})
							.catch((err) => {
								// setError(err)
								return null
							})
					}

					return null
				})
				.catch((err) => {
					setError(err)
				})
				.finally(() => {
					setLoading(false)
				})
		}
	}, [resourceId, search])

	// 处理密码验证成功
	const handleVerifySuccess = (newData: any) => {
		setData(newData)
		setError(null)
		// 删除URL中的password参数
		removePasswordFromUrl()
	}

	// 处理密码验证失败
	const handleVerifyFail = (err: any) => {
		// setError(err)
	}

	// 重新加载数据
	const handleRetry = () => {
		if (resourceId) {
			setLoading(true)
			setError(null)

			getShareIsNeedPassword({ resource_id: resourceId })
				.then((res: any) => {
					setIsNeedPassword(res?.has_password)

					if (!res?.has_password) {
						return getShareData({ resource_id: resourceId })
					}

					if (passwordFromUrl) {
						return getShareData({
							resource_id: resourceId,
							password: passwordFromUrl,
						})
					}

					return null
				})
				.then((newData: any) => {
					if (newData) {
						setData(newData)
						// 删除URL中的password参数
						removePasswordFromUrl()
					}
				})
				.catch((err) => {
					// setError(err)
				})
				.finally(() => {
					setLoading(false)
				})
		}
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<img src={MagicIcon} alt="" className={isMobile ? "" : styles.magicIcon} />
				{isMobile ? (
					<div className={styles.menuIconContainer}>
						<IconMenu2
							className={styles.menuIcon}
							onClick={() => setMenuVisible(true)}
						/>
					</div>
				) : !isLogined ? (
					<Button className={styles.loginButton} onClick={() => navigate("/login")}>
						登录
					</Button>
				) : (
					<Button
						className={styles.loginButton}
						onClick={() => navigate("/super/workspace")}
					>
						进入工作区
					</Button>
				)}
			</div>
			<div className={styles.content}>
				{isNeedPassword && isEmpty(data) && !error && (
					<PasswordVerification
						resourceId={resourceId}
						initialPassword={passwordFromUrl}
						onVerifySuccess={handleVerifySuccess}
						onVerifyFail={handleVerifyFail}
						getShareData={getShareData}
					/>
				)}
				{error && <ErrorDisplay errorMessage="无权限查看回放" onRetry={handleRetry} />}
				{!isEmpty(data) && !error && (
					<ShareContent
						isMobile={isMobile}
						data={data}
						disPlayTask={disPlayTask}
						attachments={attachments}
						menuVisible={menuVisible}
						setMenuVisible={setMenuVisible}
						isLogined={isLogined}
					/>
				)}
			</div>
		</div>
	)
}
