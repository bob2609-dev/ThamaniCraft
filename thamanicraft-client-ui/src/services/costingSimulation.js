export function simulatedLineCost(item, materials, overrides) {
  const cost = overrides[item?.rawMaterialId]
    ?? materials.find(material => material.id === item?.rawMaterialId)?.costPerBaseUnit
    ?? 0;
  return Number(item?.quantityRequired || 0) * Number(cost) * (1 + Number(item?.wastePercent || 0) / 100);
}
