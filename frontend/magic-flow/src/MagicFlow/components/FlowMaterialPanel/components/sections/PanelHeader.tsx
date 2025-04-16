import React, { memo } from "react"
import { Radio } from "antd"
import clsx from "clsx"
import { prefix } from "@/MagicFlow/constants"
import styles from "../../index.module.less"

interface TabItem {
  value: string
  label: React.ReactNode
  onClick: () => void
}

interface PanelHeaderProps {
  materialHeader: React.ReactNode
  tabList: TabItem[]
  tab: string
}

const PanelHeader = memo(({
  materialHeader,
  tabList,
  tab
}: PanelHeaderProps) => {
  if (materialHeader) {
    return materialHeader
  }
  
  return (
    <Radio.Group defaultValue={tab} buttonStyle="solid">
      {tabList.map((tabItem, i) => {
        return (
          <Radio.Button
            className={clsx(styles.tabItem, `${prefix}tab-item`, {
              [styles.active]: tab === tabItem.value,
              active: tab === tabItem.value,
            })}
            onClick={tabItem.onClick}
            key={i}
            value={tabItem.value}
          >
            {tabItem.label}
          </Radio.Button>
        )
      })}
    </Radio.Group>
  )
})

export default PanelHeader 