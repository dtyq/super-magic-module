import Topic from "../Topic"

export default function ShareContent({
	isMobile,
	data,
	disPlayTask,
	attachments,
	menuVisible,
	setMenuVisible,
	isLogined,
}: {
	isMobile: boolean
	data: any
	disPlayTask: boolean
	attachments: any
	menuVisible: boolean
	setMenuVisible: (visible: boolean) => void
	isLogined: boolean
}) {
	return data.resource_type === 5 ? (
		<Topic
			data={data.data}
			resource_name={data?.resource_name}
			isMobile={isMobile}
			disPlayTask={disPlayTask}
			attachments={attachments}
			menuVisible={menuVisible}
			setMenuVisible={setMenuVisible}
			isLogined={isLogined}
		/>
	) : (
		<div>ShareContent</div>
	)
}
