import React, { memo } from "react"
import clsx from "clsx"
import i18next from "i18next"
import SearchInput from "@/common/BaseUI/DropdownRenderer/SearchInput"
import { prefix } from "@/MagicFlow/constants"
import styles from "../../index.module.less"

interface SearchBarProps {
  keyword: string
  onSearchChange: (value: string) => void
}

const SearchBar = memo(({
  keyword,
  onSearchChange
}: SearchBarProps) => {
  return (
    <div className={clsx(styles.search, `${prefix}search`)}>
      <SearchInput
        placeholder={i18next.t("common.search", { ns: "magicFlow" })}
        value={keyword}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  )
})

export default SearchBar 