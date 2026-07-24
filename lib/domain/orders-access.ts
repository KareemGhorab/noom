export function canViewOrder(params: {
  orderUserId: string | null | undefined;
  viewerUserId: string | null | undefined;
}): boolean {
  if (!params.viewerUserId || !params.orderUserId) {
    return false;
  }

  return params.orderUserId === params.viewerUserId;
}
