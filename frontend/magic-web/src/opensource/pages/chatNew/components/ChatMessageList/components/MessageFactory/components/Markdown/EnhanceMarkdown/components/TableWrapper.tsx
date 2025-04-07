// 自定义表格组件，添加水平滚动容器
const TableWrapper = ({ node, ...props }: any) => {
	return (
		<div className="table-container">
			<table {...props} />
		</div>
	)
}

export default TableWrapper
