function escapeCell(value) {
  const s = String(value ?? '')
  return /[;"\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

export function exportCsv(namaFile, headers, rows) {
  const line = (arr) => arr.map(escapeCell).join(';')
  const csv = [line(headers), ...rows.map((r) => line(r))].join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = namaFile
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
