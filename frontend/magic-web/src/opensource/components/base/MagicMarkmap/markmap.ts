import { loadCSS, loadJS } from "markmap-common"
import { Transformer } from "markmap-lib"
import * as markmap from "markmap-view"

export const transformer = new Transformer()
const { scripts, styles } = transformer.getAssets()

if (styles) loadCSS(styles)
if (scripts) loadJS(scripts, { getMarkmap: () => markmap })
