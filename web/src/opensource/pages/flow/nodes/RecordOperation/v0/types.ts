export type TeamshareUser = {
	id: string
	avatar: string
	name: string
	position: string
}

// 单列的值
export type ColumnDataSource = {
	created_at: number
	creator: TeamshareUser
	modifier: TeamshareUser
	updated_at: number
	sheetId: string
	[key: string]: any
}

// 单行的数据源
export type RowDataSource = Record<string, ColumnDataSource>
