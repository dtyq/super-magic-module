import { createStyles } from "antd-style"

const useStyles = createStyles(({ css }) => {
	return {
		authList: css`
			flex: 1;
		`,
		header: css`
			height: 40px;
			font-size: 14px;
			font-weight: 400;
			line-height: 20px;
			text-align: left;
			padding: 12px 12px 0 12px;
		`,
		body: css`
			height: 464px;
			overflow: scroll;
		`,
		footer: css`
			height: 52px;
			border-top: 1px solid #1c1d2314;
			padding: 12px;
		`,
		member: css`
			padding: 0 6px;
			height: 56px;
			border-bottom: 1px solid #1c1d2314;
			margin: 0 12px;
			overflow: scroll;
			padding-right: 0;

			.left {
				width: 246px;

				.avatar {
					border-radius: 3.2px;
					display: flex;
					align-items: center;
				}

				.memberInfo {
					.name {
						color: #1c1d23cc;
						font-size: 14px;
						font-weight: 400;
						line-height: 20px;
						text-align: left;
					}

					.desc {
						color: #1c1d2399;
						font-size: 12px;
						font-weight: 400;
						line-height: 16px;
						text-align: left;
					}
				}
			}

			.operation {
				width: 100px;
				.magic-select {
					width: 100%;
				}
			}

			.remove-btn {
				width: 52px;
			}
		`,
	}
})

export default useStyles
