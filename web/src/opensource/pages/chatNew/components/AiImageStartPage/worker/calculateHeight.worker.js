// eslint-disable-next-line no-restricted-globals
const that = self
that.onmessage = (e) => {
	const { id, naturalWidth, naturalHeight, itemWidth } = e.data
	const imgHeight = Math.ceil(Math.floor((naturalHeight * itemWidth) / naturalWidth) / 10) * 10
	const rows = Math.ceil(imgHeight / 10)

	that.postMessage({ id, imgHeight, rows })
}
