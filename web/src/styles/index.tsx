import { createGlobalStyle } from "antd-style"

import { CLASSNAME_PREFIX } from "@/const/style"
import font from "./font"
import animation from "./animation"
import antdOverride from "./antdOverride"

const prefixCls = CLASSNAME_PREFIX

export const GlobalStyle = createGlobalStyle(({theme}) => [
	font(),
	animation(),
	antdOverride({prefixCls, token: theme}),
])
