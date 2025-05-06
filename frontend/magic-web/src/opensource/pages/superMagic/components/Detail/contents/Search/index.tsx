import MagicIcon from "@/opensource/components/base/MagicIcon"
import MagicImage from "@/opensource/components/base/MagicImage"
import { IconSearch } from "@tabler/icons-react"
import { Input } from "antd"
import { memo, useCallback } from "react"
// import BrowserHeader from "../../components/BrowserHeader"
import CommonFooter from "../../components/CommonFooter"
import defaultSVG from "./default.svg"
import { useStyles } from "./styles"

interface SearchProps {
	data: any
	userSelectDetail: any
	isFromNode: boolean
	setUserSelectDetail: (detail: any) => void
	onClose: () => void
}

export default memo(function Search(props: SearchProps) {
	const { data = {}, userSelectDetail, isFromNode, setUserSelectDetail, onClose } = props

	const { styles } = useStyles()

	const { groups = [] } = data

	const { keyword, results } = groups?.[0] || {}

	const totalResults = results?.length

	// 移除掉html里面所有标签，只保留文本
	const parseHTML = useCallback((html: string) => {
		return html.replace(/<[^>]*>?/g, "")
	}, [])

	return (
		<div className={styles.searchContainer}>
			{/* <BrowserHeader /> */}
			<div className={styles.searchHeader}>
				<Input
					value={keyword}
					readOnly
					prefix={<MagicIcon component={IconSearch} size={20} />}
					className={styles.searchInput}
				/>
			</div>
			<div className={styles.searchBody}>
				{totalResults ? (
					<>
						<div className={styles.searchInfo}>找到约 {totalResults} 条结果</div>
						<div className={styles.results}>
							{results?.map((item: any) => {
								const title = parseHTML(item.title)
								const info = parseHTML(item.snippet)
								return (
									<div
										key={`search-result-${item.url?.replace(
											/[^a-zA-Z0-9]/g,
											"-",
										)}`}
										className={styles.resultItem}
									>
										<div className={styles.icon}>
											<MagicImage
												src={item.icon_url}
												errorSrc={defaultSVG}
												className={styles.iconImg}
											/>
										</div>
										<div className={styles.content}>
											<a
												href={item.url}
												target="_blank"
												rel="noopener noreferrer"
												className={styles.title}
												title={title}
											>
												{title}
											</a>
											<div className={styles.info} title={info}>
												{info}
											</div>
											<a
												href={item.url}
												target="_blank"
												rel="noopener noreferrer"
												className={styles.link}
												title={item.url}
											>
												{item.url}
											</a>
										</div>
									</div>
								)
							})}
						</div>
					</>
				) : null}
			</div>
			{isFromNode && (
				<CommonFooter
					setUserSelectDetail={setUserSelectDetail}
					userSelectDetail={userSelectDetail}
					onClose={onClose}
				/>
			)}
		</div>
	)
})
