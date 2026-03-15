import { format } from 'date-fns';

const FILE_DATE = () => format(new Date(), 'yyyy_MM_dd');
const TODAY_STR = () => format(new Date(), 'dd.MM.yyyy');

/**
 * Export data as PDF via browser print dialog (Save as PDF).
 * Opens a styled print window — no heavy PDF library needed.
 */
export const exportToPDF = (title, headers, rows, _filename) => {
    const tableRows = rows.map(row =>
        `<tr>${row.map(cell => `<td>${cell ?? ''}</td>`).join('')}</tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8"/>
<title>Terra Academy — ${title}</title>
<style>
  @page { size: A4 landscape; margin: 15mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
  body { background: #fff; color: #0f172a; font-size: 10px; }
  header { background: #0f172a; color: #fff; padding: 12px 16px; border-radius: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
  header h1 { font-size: 18px; font-weight: 900; letter-spacing: -0.5px; }
  header small { font-size: 8px; opacity: 0.5; }
  header span { font-size: 11px; font-weight: 700; color: #93c5fd; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #3b82f6; color: #fff; }
  thead th { padding: 7px 10px; text-align: left; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 9px; }
  footer { margin-top: 10px; font-size: 7px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
<header>
  <div>
    <h1>TERRA ACADEMY</h1>
    <small>Educational Management System</small>
  </div>
  <div style="text-align:right">
    <span>${title.toUpperCase()}</span><br/>
    <small>Sana: ${TODAY_STR()} &nbsp;|&nbsp; Jami: ${rows.length} ta yozuv</small>
  </div>
</header>
<table>
  <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${tableRows}</tbody>
</table>
<footer>Terra Academy — ${title} — ${TODAY_STR()}</footer>
<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500);}</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=650');
    if (!win) { console.warn("Pop-up bloklangan. Ruxsat bering va qayta urinib ko'ring."); return; }
    win.document.write(html);
    win.document.close();
};

/**
 * Export data as Excel (.xlsx) with styled headers.
 * xlsx is loaded on-demand to keep the initial bundle small.
 */
export const exportToExcel = async (title, headers, rows, filename) => {
    const XLSX = (await import('xlsx')).default ?? await import('xlsx');
    const wb = XLSX.utils.book_new();
    const metaRow1 = ['TERRA ACADEMY — ' + title];
    const metaRow2 = [`Sana: ${TODAY_STR()}`, '', `Jami: ${rows.length} ta yozuv`];
    const wsData = [metaRow1, metaRow2, [], headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = headers.map((h, i) => ({
        wch: Math.min(Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length)) + 4, 40)
    }));
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
    wb.Props = { Title: `Terra Academy — ${title}`, Author: 'Terra Academy', CreatedDate: new Date() };
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
    XLSX.writeFile(wb, `${filename}_${FILE_DATE()}.xlsx`);
};
