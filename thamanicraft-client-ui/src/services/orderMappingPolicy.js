export function canMapOrderRecipe(order, hasPermission) {
  return ['NEW', 'CONFIRMED'].includes(order.status)
    && hasPermission('PROCESS_SALES')
    && hasPermission('VIEW_RECIPES');
}
