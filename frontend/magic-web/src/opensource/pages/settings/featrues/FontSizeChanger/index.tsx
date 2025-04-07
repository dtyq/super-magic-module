import { changeChatFontSize, useFontSize } from "@/opensource/providers/AppearanceProvider/hooks"
import { Slider, InputNumber, Flex } from "antd"
import { createStyles } from "antd-style"

const useStyles = createStyles(() => {
	return {
		container: {
			width: 280,
		},
	}
})

function FontSizeChanger() {
	const {styles} = useStyles()
	
	const {fontSize} = useFontSize()
	
	const onChange = (newValue: number | null) => {
		changeChatFontSize(newValue ?? 14)
	}
	
	return (
		<Flex className={ styles.container } gap={ 16 }>
			<Slider
				style={ {flex: 1} }
				min={ 12 }
				step={ 2 }
				max={ 24 }
				onChange={ onChange }
				value={ typeof fontSize === "number" ? fontSize : 0 }
			/>
			<InputNumber
				min={ 12 }
				max={ 24 }
				step={ 2 }
				style={ {width: 40} }
				value={ fontSize }
				onChange={ onChange }
			/>
		</Flex>
	)
}

export default FontSizeChanger
