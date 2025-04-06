import { GroupInfo } from "@/types/organization"
import { makeAutoObservable } from "mobx"

class GroupInfoStore {
  map: Map<IDBValidKey, GroupInfo> = new Map()

  constructor() {
    makeAutoObservable(this)
  }

  get(key: string): GroupInfo | undefined {
    return this.map.get(key)
  }

  set(key: string, value: GroupInfo) {
    this.map.set(key, value)
  }
} 

export default new GroupInfoStore()
