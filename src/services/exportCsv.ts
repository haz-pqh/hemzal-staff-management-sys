export function escapeCsvCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportRowsToCSV(
  filenamePrefix: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): { success: boolean; rowCount: number } {
  if (!rows || rows.length === 0) {
    return { success: false, rowCount: 0 };
  }

  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ];

  // Prepend UTF-8 BOM so Microsoft Excel correctly renders special characters and formatting
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().split('T')[0];
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenamePrefix}_${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, rowCount: rows.length };
}
