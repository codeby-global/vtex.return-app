interface ItemToReturn {
  id: string
  quantity: number
  quantityAvailable: number
  isExcluded: boolean
  name: string
  imageUrl: string
  orderItemIndex: number
}

type MaybeGlobal<T> = T | null

type GeoCoordinates = Array<MaybeGlobal<number>>
