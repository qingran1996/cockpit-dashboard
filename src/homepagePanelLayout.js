export function resolveCompactSteamPanelLayout({ panelHeight, titleHeight }) {
  const compactPanelHeight = panelHeight - titleHeight
  return {
    panelTop: 612 + titleHeight,
    panelHeight: compactPanelHeight,
    processHeight: compactPanelHeight - titleHeight - 19,
    chartHeight: compactPanelHeight - titleHeight - 58,
  }
}

export function resolveHomepageSceneControlsLayout() {
  return {
    lightingRight: 76,
    lightingBottom: 16,
    resetRight: 16,
    resetBottom: 16,
    trafficRight: 16,
    trafficBottom: 88,
    hintLeft: 18,
    hintBottom: 18,
  }
}
