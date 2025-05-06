import type { DetailTextData } from "../../types"
export default function Text(props: { data: DetailTextData }) {
	const { data } = props
	return <div>{data.content}</div>
}
