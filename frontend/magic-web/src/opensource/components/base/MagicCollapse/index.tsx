import { IconChevronRight } from "@tabler/icons-react"
import { Collapse, type CollapseProps } from "antd"
import { createStyles } from "antd-style"
import MagicIcon from "../MagicIcon"

const useStyles = createStyles(({ css, prefixCls, token }) => {
	return {
		container: css`
			--${prefixCls}-collapse-content-bg: ${token.colorBgContainer} !important;
			
			.${prefixCls}-collapse-item {
				transition: all 0.35s cubic-bezier(0.215, 0.61, 0.355, 1);
			}
			
			.${prefixCls}-collapse-header {
				transition: all 0.35s cubic-bezier(0.215, 0.61, 0.355, 1) !important;
			}
			
			.${prefixCls}-collapse-content {
				transition: all 0.35s cubic-bezier(0.215, 0.61, 0.355, 1) !important;
			}
		`,
	}
})

function MagicCollapse({ className, ...props }: CollapseProps) {
	const { styles, cx } = useStyles()

	return (
		<Collapse
			ghost
			className={cx(styles.container, className)}
			bordered={false}
			expandIconPosition="end"
			expandIcon={({ isActive }) => (
				<MagicIcon
					component={IconChevronRight}
					size={24}
					style={{
						transform: `rotate(${isActive ? 90 : 0}deg)`,
						transition: "transform 0.35s cubic-bezier(0.215, 0.61, 0.355, 1)",
					}}
				/>
			)}
			{...props}
		/>
	)
}

export default MagicCollapse
