export function resolveCompactSteamPanelLayout({ panelHeight, titleHeight, footerHeightReduction = 0, campusHeightGain = 0 }) {
  const compactPanelHeight = panelHeight - titleHeight + footerHeightReduction - campusHeightGain
  return {
    panelTop: 612 + titleHeight + campusHeightGain,
    panelHeight: compactPanelHeight,
    processHeight: compactPanelHeight - titleHeight - 19,
    chartHeight: compactPanelHeight - titleHeight - 58,
  }
}

export function resolveHomepagePanelLayout() {
  return {
    side: { outer: 20, width: 392, gap: 12 },
    center: { left: 424, width: 1072 },
    pulse: { left: 427, width: 1066 },
    focusToggleRight: 436,
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
