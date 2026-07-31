export function canViewOrder(params: {
  orderUserId: string | null | undefined;
  viewerUserId: string | null | undefined;
}): boolean {
  if (!params.viewerUserId || !params.orderUserId) {
    return false;
  }

  return params.orderUserId === params.viewerUserId;
}

export function canViewOrderConfirmation(params: {
  orderId: string;
  orderUserId: string | null | undefined;
  viewerUserId: string | null | undefined;
  cookieOrderId: string | null | undefined;
}): boolean {
  if (
    canViewOrder({
      orderUserId: params.orderUserId,
      viewerUserId: params.viewerUserId,
    })
  ) {
    return true;
  }

  return Boolean(params.cookieOrderId) && params.cookieOrderId === params.orderId;
}

export function canCancelOrder(params: {
  status: string;
  orderUserId: string | null | undefined;
  viewerUserId: string | null | undefined;
}): boolean {
  if (
    !canViewOrder({
      orderUserId: params.orderUserId,
      viewerUserId: params.viewerUserId,
    })
  ) {
    return false;
  }

  return params.status === "placed";
}
