export function resolveDashboardPresentation(campusFocus, energyDetail) {
  const showEnergyDetail = Boolean(energyDetail) && !campusFocus
  return {
    showEnergyDetail,
    hasEnergyDetailClass: showEnergyDetail,
  }
}
