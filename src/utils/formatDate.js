const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const pad = (value) => String(value).padStart(2, '0')

export function formatDashboardDate(date) {
  const calendar = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  return `${calendar} ${time} ${WEEKDAYS[date.getDay()]}`
}
