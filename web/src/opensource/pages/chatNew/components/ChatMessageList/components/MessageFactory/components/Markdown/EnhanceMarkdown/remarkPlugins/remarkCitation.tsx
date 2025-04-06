import { findAndReplace } from "mdast-util-find-and-replace"

export default function remarkCitation() {
	return (tree: any) => {
		findAndReplace(tree, [
			/\[\[citation:(\d+)\]\]/g,
			(_: string, $1: any) => {
				return {
					type: "footnoteReference",
					identifier: $1,
				}
			},
		])

		findAndReplace(tree, [
			/\[\[citation(\d+)\]\]/g,
			(_: string, $1: any) => {
				return {
					type: "footnoteReference",
					identifier: $1,
				}
			},
		])

		findAndReplace(tree, [
			/\[citation:(\d+)\]/g,
			(_: string, $1: any) => {
				return {
					type: "footnoteReference",
					identifier: $1,
				}
			},
		])

		findAndReplace(tree, [
			/\[citation(\d+)\]/g,
			(_: string, $1: any) => {
				return {
					type: "footnoteReference",
					identifier: $1,
				}
			},
		])
	}
}
