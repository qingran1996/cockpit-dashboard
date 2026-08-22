const band = (top, height) => ({ top, height, bottom: top + height })

export function resolveEnergyDetailWorkspaceLayout() {
  const alignedSideZone = band(204, 611)
  return {
    scene: band(153, 516),
    tabs: band(99, 44),
    metrics: band(669, 90),
    diagnostics: band(759, 56),
    leftZone: alignedSideZone,
    rightZone: { ...alignedSideZone },
    centerBackdrop: { widthPercent: 54.5, height: 551 },
    sceneControls: {
      lightingRight: 76,
      lightingBottom: 16,
      resetRight: 16,
      resetBottom: 16,
      trafficRight: 16,
      trafficBottom: 88,
      hintLeft: 18,
      hintBottom: 18,
    },
    footer: band(825, 245),
  }
}
