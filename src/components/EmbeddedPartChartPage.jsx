import { EChart } from './EChart.jsx'
import { EmbeddedPartChartPage as EmbeddedPartChartView } from './EmbeddedPartChartPage.js'

export function EmbeddedPartChartPage(props) {
  return <EmbeddedPartChartView {...props} ChartComponent={EChart} />
}
