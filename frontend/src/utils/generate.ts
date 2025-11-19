export function generateSeries(length = 60, base = 50, jitter = 8) {
  const out: { t: number; value: number }[] = [];
  let v = base;
  for (let i = 0; i < length; i++) {
    v += (Math.random() - 0.5) * jitter;
    v = Math.max(0, v);
    out.push({ t: i, value: Math.round(v * 10) / 10 });
  }
  return out;
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(',')]
    .concat(rows.map((r) => headers.map((h) => JSON.stringify((r as any)[h] ?? '')).join(',')))
    .join('\n');
  return csv;
}


