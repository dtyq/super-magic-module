/** 获取当前 keyCode 映射文案 */
const getKeyCode = () => {
	const platform = navigator.platform.toLowerCase()

	const isMac = platform?.includes("mac")
	return {
		"8": "Backspace",
		"9": "Tab",
		"13": "Enter",
		"16": "Shift",
		"17": "Ctrl",
		"18": isMac ? "Option" : "Alt",
		"20": "Capslock",
		"27": "Escape",
		"37": "Left",
		"38": "Up",
		"39": "Right",
		"40": "Down",
		"48": "0",
		"49": "1",
		"50": "2",
		"51": "3",
		"52": "4",
		"53": "5",
		"54": "6",
		"55": "7",
		"57": "9",
		"65": "A",
		"66": "B",
		"67": "C",
		"68": "D",
		"69": "E",
		"70": "F",
		"71": "G",
		"72": "H",
		"73": "I",
		"74": "J",
		"75": "K",
		"76": "L",
		"77": "M",
		"78": "N",
		"79": "O",
		"80": "P",
		"81": "Q",
		"82": "R",
		"83": "S",
		"84": "T",
		"85": "U",
		"86": "V",
		"87": "W",
		"88": "X",
		"89": "Y",
		"90": "Z",
		"91": "⌘",
		"93": "⌘",
		"186": ";",
		"187": "=",
		"188": ",",
		"189": "-",
		"190": ".",
		"191": "/",
		"192": "`",
		"219": "[",
		"220": "\\",
		"221": "]",
		"222": "'",
	}
}

export default function useKeyCode() {
	return {
		getSystemShortcut: (keyCode: string) => {
			const map = getKeyCode()
			return map?.[keyCode as keyof ReturnType<typeof getKeyCode>]
		},
	}
}
