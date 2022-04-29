import type {
  ReturnRequestItemInput,
  ReturnRequestInput,
} from 'vtex.return-app'

import type { OrderDetailsState } from '../provider/OrderToReturnReducer'

const itemHasConditionAndReason = (
  item: OrderDetailsState['items'][number]
): item is ReturnRequestItemInput => {
  const isOtherReason = item.returnReason?.reason === 'otherReason'
  const hasRequiredUserInput = isOtherReason
    ? Boolean(item.returnReason?.otherReason)
    : true

  return (
    Boolean(item.condition) &&
    Boolean(item.returnReason) &&
    hasRequiredUserInput
  )
}

export type ErrorsValidation =
  | 'no-item-selected'
  | 'reason-or-condition'
  | 'customer-data'
  | 'pickup-data'
  | 'refund-payment-data'
  | 'bank-details'

interface ValidationError {
  errors: ErrorsValidation[]
  validatedFields?: never
}

interface ValidationSuccess {
  errors?: never
  validatedFields: ReturnRequestInput
}

export const validateNewReturnRequestFields = (
  returnRequest: OrderDetailsState
): ValidationError | ValidationSuccess => {
  const { items, pickupReturnData, customerProfileData, refundPaymentData } =
    returnRequest

  const errors: ErrorsValidation[] = []

  const itemsToReturn = items.filter((item) => item.quantity > 0)

  if (itemsToReturn.length === 0) {
    errors.push('no-item-selected')
  }

  const validatedItems = itemsToReturn.filter(itemHasConditionAndReason)

  if (itemsToReturn.length !== validatedItems.length) {
    errors.push('reason-or-condition')
  }

  for (const field of Object.keys(customerProfileData)) {
    if (!customerProfileData[field]) {
      errors.push('customer-data')
    }
  }

  for (const field of Object.keys(pickupReturnData)) {
    if (!pickupReturnData[field]) {
      errors.push('pickup-data')
    }
  }

  const { refundPaymentMethod } = refundPaymentData ?? {}

  if (!refundPaymentData || !refundPaymentMethod) {
    errors.push('refund-payment-data')

    return { errors }
  }

  if (refundPaymentMethod === 'bank') {
    const { iban, accountHolderName } = refundPaymentData

    if (!iban || !accountHolderName) {
      errors.push('bank-details')
    }
  }

  if (!pickupReturnData.addressType) {
    /**
     * This is an app error, not a user one.
     * Tracking it here so we can notify dev AND validate it for TS. This is why the logic has to be the last one.
     */
    console.error('Missing address type')

    // We return here to satisfy TS condition for addressType check
    return { errors }
  }

  if (errors.length) {
    return { errors }
  }

  const { addressType } = pickupReturnData

  const validatedFields: ReturnRequestInput = {
    ...returnRequest,
    items: validatedItems,
    pickupReturnData: { ...pickupReturnData, addressType },
    refundPaymentData,
  }

  return { validatedFields }
}
