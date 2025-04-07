import { Suspense } from "react"
import { Outlet } from "react-router"
import { Flex } from "antd"
import MagicSpin from "@/opensource/components/base/MagicSpin"
import ContactsSubSider from "../components/ContactsSubSider"
import ContactPageDataProvider from "../components/ContactDataProvider"
import { useStyles } from "./styles"
// import { ContactViewType } from "../constants"
// import { useContactPageDataContext } from "../components/ContactDataProvider/hooks"

// const TopBar = memo(() => {
// 	const { t } = useTranslation("interface")
// 	const { styles } = useStyles()
//
// 	const segmentedOptions = useMemo(() => {
// 		return [
// 			{
// 				label: t("contacts.topBar.segmented.list"),
// 				value: ContactViewType.LIST,
// 			},
// 			{
// 				label: t("contacts.topBar.segmented.architecturalView"),
// 				value: ContactViewType.TREE,
// 			},
// 		]
// 	}, [t])
//
// 	const { viewType, setViewType } = useContactPageDataContext()
//
// 	return (
// 		<Flex className={styles.topBar} align="center" justify="space-between">
// 			<span className={styles.title}>{t("contacts.topBar.title")}</span>
// 			<MagicSegmented
// 				options={segmentedOptions}
// 				className={styles.segmented}
// 				value={viewType}
// 				onChange={setViewType}
// 			/>
// 		</Flex>
// 	)
// })

function ContactsLayout() {
	const { styles } = useStyles()

	return (
		<ContactPageDataProvider>
			<Flex vertical className={styles.container}>
				{/* <TopBar /> */}
				<Flex flex={1}>
					<ContactsSubSider />
					<Flex flex={1}>
						<Suspense fallback={<MagicSpin />}>
							<Outlet />
						</Suspense>
					</Flex>
				</Flex>
			</Flex>
		</ContactPageDataProvider>
	)
}

export default ContactsLayout
