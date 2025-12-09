export type ItemType =
  | 'saw'           // 锯子 - 伤害翻倍
  | 'handcuffs'     // 手铐 - 跳过对方回合
  | 'cigarettes'    // 香烟 - 恢复1点
  | 'magnifier'     // 放大镜 - 查看当前子弹
  | 'drink'         // 饮料 - 退掉当前子弹
  | 'adrenaline'    // 肾上腺素 - 使用对方道具
  | 'medicine'      // 过期药物 - 40%+2/-1
  | 'inverter'      // 逆转器 - 转换子弹类型
  | 'phone'         // 电话 - 随机提示

export interface Item {
  id: string
  type: ItemType
  used: boolean
}

export const ITEM_INFO: Record<ItemType, { name: string; description: string; icon: string }> = {
  saw: {
    name: '锯子',
    description: '使霰弹枪伤害翻倍，可清空2格电量',
    icon: '🪚',
  },
  handcuffs: {
    name: '手铐',
    description: '使对方下1回合无法操作',
    icon: '⛓️',
  },
  cigarettes: {
    name: '香烟',
    description: '恢复1格电量',
    icon: '🚬',
  },
  magnifier: {
    name: '放大镜',
    description: '查看当前枪膛内的子弹类型',
    icon: '🔍',
  },
  drink: {
    name: '饮料',
    description: '退掉当前枪内的1颗子弹',
    icon: '🍺',
  },
  adrenaline: {
    name: '肾上腺素',
    description: '选择并使用对方的1件道具',
    icon: '💉',
  },
  medicine: {
    name: '过期药物',
    description: '40%几率+2电量，否则-1电量',
    icon: '💊',
  },
  inverter: {
    name: '逆转器',
    description: '转换当前子弹类型（实弹↔空弹）',
    icon: '🔄',
  },
  phone: {
    name: '电话',
    description: '随机提示某发子弹的类型',
    icon: '📞',
  },
}

export function createItem(type: ItemType): Item {
  return {
    id: crypto.randomUUID(),
    type,
    used: false,
  }
}

export function generateItems(count: number): Item[] {
  const types: ItemType[] = [
    'saw', 'handcuffs', 'cigarettes', 'magnifier',
    'drink', 'adrenaline', 'medicine', 'inverter', 'phone',
  ]
  const items: Item[] = []
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    items.push(createItem(type))
  }
  return items
}
