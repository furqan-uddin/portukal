import fs from 'fs';
import path from 'path';

export class ExportService {
    /**
     * Convert JSON data array into CSV string
     */
    static convertToCSV(data = [], headers = []) {
        if (!data || data.length === 0) {
            return headers.length > 0 ? headers.join(',') + '\n' : 'No Data\n';
        }

        const keys = headers.length > 0 ? headers : Object.keys(data[0]);
        const csvRows = [];
        csvRows.push(keys.join(','));

        for (const row of data) {
            const values = keys.map((key) => {
                const val = row[key];
                const escaped = ('' + (val ?? '')).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }

    /**
     * Generate HTML document formatted for PDF printing / download
     */
    static generateReportHTML(reportName, data = [], filters = {}) {
        const rowsHTML = data.map((item, idx) => {
            const cells = Object.values(item).map((val) => `<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${val ?? '-'}</td>`).join('');
            return `<tr><td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${idx + 1}</td>${cells}</tr>`;
        }).join('');

        const headersHTML = data.length > 0
            ? Object.keys(data[0]).map((key) => `<th style="padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: left; text-transform: uppercase; font-size: 11px; color: #475569;">${key}</th>`).join('')
            : '<th>No Data</th>';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8"/>
                <title>${reportName}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #0f172a; }
                    .header { border-bottom: 2px solid #7c3aed; padding-bottom: 12px; margin-bottom: 20px; }
                    h1 { font-size: 20px; color: #581c87; margin: 0 0 4px 0; }
                    .meta { font-size: 11px; color: #64748b; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${reportName}</h1>
                    <div class="meta">Generated At: ${new Date().toLocaleString()} | Filter: ${JSON.stringify(filters)}</div>
                </div>
                <table>
                    <thead><tr><th style="padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: left;">#</th>${headersHTML}</tr></thead>
                    <tbody>${rowsHTML}</tbody>
                </table>
            </body>
            </html>
        `;
    }
}
