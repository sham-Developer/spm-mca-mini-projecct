/**
 * Export Utility for Reports (CSV & PDF)
 * Compliant with NexTask UI & Styling Standards (dd-mm-yyyy, high contrast, clean typography).
 */

const formatDateToDMY = (dateStr) => {
  if (!dateStr) return 'N/A';
  const cleanStr = String(dateStr).includes('T') ? String(dateStr).split('T')[0] : String(dateStr);
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return cleanStr;
};

/**
 * Trigger download of raw CSV text
 */
export const exportToCSV = ({ filename = 'reports_export.csv', headers = [], rows = [] }) => {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(h => escapeCSV(h.label || h)).join(',');
  const rowLines = rows.map(row => {
    if (Array.isArray(row)) {
      return row.map(escapeCSV).join(',');
    }
    return headers.map(h => escapeCSV(row[h.key] ?? '')).join(',');
  });

  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate and trigger print-to-PDF / PDF preview with clean high-contrast NexTask styling
 */
export const exportToPDF = ({
  title = 'Progress Reports Summary',
  subtitle = '',
  metadata = [],
  headers = [],
  rows = [],
  summaryStats = []
}) => {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (!printWindow) {
    alert('Pop-up blocked. Please allow pop-ups for this site to export PDF.');
    return;
  }

  const generatedDate = formatDateToDMY(new Date().toISOString().split('T')[0]);
  const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const metadataHtml = metadata.length > 0 ? `
    <div class="metadata-grid">
      ${metadata.map(m => `
        <div class="meta-item">
          <span class="meta-label">${m.label}:</span>
          <span class="meta-value">${m.value}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const summaryStatsHtml = summaryStats.length > 0 ? `
    <div class="stats-grid">
      ${summaryStats.map(s => `
        <div class="stat-card">
          <div class="stat-number">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const theadHtml = `
    <tr>
      ${headers.map(h => `<th class="${h.align === 'center' ? 'text-center' : h.align === 'right' ? 'text-right' : 'text-left'}">${h.label || h}</th>`).join('')}
    </tr>
  `;

  const tbodyHtml = rows.map((row, idx) => {
    const cells = Array.isArray(row)
      ? row.map((cell, cIdx) => {
          const h = headers[cIdx] || {};
          const alignClass = h.align === 'center' ? 'text-center' : h.align === 'right' ? 'text-right' : 'text-left';
          return `<td class="${alignClass}">${cell !== null && cell !== undefined ? cell : '--'}</td>`;
        })
      : headers.map(h => {
          const val = row[h.key];
          const alignClass = h.align === 'center' ? 'text-center' : h.align === 'right' ? 'text-right' : 'text-left';
          return `<td class="${alignClass}">${val !== null && val !== undefined ? val : '--'}</td>`;
        });

    return `<tr>${cells.join('')}</tr>`;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title} - Export</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 14mm 12mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 24px;
          line-height: 1.4;
          font-size: 12px;
        }
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #ea580c;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .brand-section h1 {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }
        .brand-section .subtitle {
          font-size: 13px;
          color: #475569;
          font-weight: 500;
          margin: 0;
        }
        .doc-meta {
          text-align: right;
          font-size: 11px;
          color: #475569;
        }
        .doc-meta strong {
          color: #0f172a;
        }
        .badge {
          display: inline-block;
          background: #ffedd5;
          color: #9a3412;
          border: 1px solid #fdba74;
          font-weight: 700;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 9999px;
          margin-bottom: 4px;
        }
        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px 16px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 14px;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .meta-label {
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .meta-value {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .stat-card {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 8px 12px;
          text-align: center;
        }
        .stat-number {
          font-size: 18px;
          font-weight: 800;
          color: #ea580c;
        }
        .stat-label {
          font-size: 10.5px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 11.5px;
        }
        th {
          background-color: #334155;
          color: #ffffff;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          padding: 8px 10px;
          border: 1px solid #475569;
        }
        td {
          padding: 7px 10px;
          border: 1px solid #cbd5e1;
          color: #0f172a;
          font-weight: 500;
          vertical-align: middle;
        }
        tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .footer {
          margin-top: 24px;
          padding-top: 10px;
          border-top: 1px solid #cbd5e1;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #64748b;
        }
        .no-print-bar {
          background: #0f172a;
          color: #ffffff;
          padding: 10px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: -24px -24px 20px -24px;
          border-bottom: 2px solid #ea580c;
        }
        .btn-print {
          background: #ea580c;
          color: #ffffff;
          border: none;
          padding: 6px 16px;
          font-size: 12px;
          font-weight: 700;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-print:hover {
          background: #c2410c;
        }
        @media print {
          .no-print-bar {
            display: none !important;
          }
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <span style="font-weight: 600; font-size: 13px;">NexTask &bull; PDF Report Print View</span>
        <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
      </div>

      <div class="header-container">
        <div class="brand-section">
          <span class="badge">CONFIDENTIAL &bull; INTERNAL REPORT</span>
          <h1>${title}</h1>
          ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
        </div>
        <div class="doc-meta">
          <div>Generated on: <strong>${generatedDate}</strong></div>
          <div>Time: <strong>${currentTime}</strong></div>
          <div>Total Records: <strong>${rows.length}</strong></div>
        </div>
      </div>

      ${metadataHtml}
      ${summaryStatsHtml}

      <table>
        <thead>
          ${theadHtml}
        </thead>
        <tbody>
          ${tbodyHtml}
        </tbody>
      </table>

      <div class="footer">
        <span>NexTask Project Management System &bull; Generated Automatically</span>
        <span>Date Formatted as dd-mm-yyyy</span>
      </div>

      <script>
        // Trigger print dialog automatically after brief load
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 350);
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
