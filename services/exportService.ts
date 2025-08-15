import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AppState } from '../types';

// PDF Export
export interface PdfColumn {
    header: string;
    dataKey: string;
}

export const exportToPdf = (
    columns: PdfColumn[],
    data: any[],
    filename: string,
    title: string
) => {
    const doc = new jsPDF();
    doc.text(title, 14, 20);
    autoTable(doc, {
        head: [columns.map(c => c.header)],
        body: data.map(row => columns.map(col => row[col.dataKey] ?? '')),
        startY: 28,
        styles: { font: "helvetica", fontStyle: 'normal' },
        headStyles: { fontStyle: 'bold' },
    });
    doc.save(filename);
};


export const exportReportToPdf = (
    docTitle: string,
    summaryData: { title: string; value: string | number }[],
    columns: PdfColumn[],
    data: any[],
    filename: string,
    shopInfo: { name: string; address: string; phone: string; }
) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    let y = 15;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(shopInfo.name, 14, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(shopInfo.address, 14, y);
    y += 5;
    doc.text(shopInfo.phone, 14, y);
    y += 10;
    
    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(docTitle, 14, y);
    y += 10;

    // Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    summaryData.forEach(item => {
        if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
        }
        doc.text(`${item.title}: ${item.value}`, 14, y);
        y += 7;
    });

    // Spacer
    y += 5;

    // Table
    autoTable(doc, {
        head: [columns.map(c => c.header)],
        body: data.map(row => columns.map(col => {
            const val = row[col.dataKey];
            return val !== null && val !== undefined ? String(val) : '';
        })),
        startY: y,
        theme: 'grid',
        styles: { font: "helvetica", fontSize: 10 },
        headStyles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: 20 },
    });

    doc.save(filename);
};

// CSV Export (Single Sheet)
export const exportToCsv = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const csvString = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// XLSX Export (All Data as a single multi-sheet file)
export const exportAllDataToXlsx = (state: AppState, filename: string) => {
    const { products, customers, suppliers, sales, purchases, users, printers, cardMachines, dueCollections, attendance, settings } = state;
    
    const wb = XLSX.utils.book_new();

    const addSheet = (data: any[], name: string) => {
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, name);
    };

    addSheet(products, 'Products');
    addSheet(customers, 'Customers');
    addSheet(suppliers, 'Suppliers');
    addSheet(sales.map(s => ({ ...s, items: JSON.stringify(s.items) })), 'Sales');
    addSheet(purchases.map(p => ({ ...p, items: JSON.stringify(p.items) })), 'Purchases');
    addSheet(users.map(({ password, ...u }) => u), 'Users');
    addSheet(printers, 'Printers');
    addSheet(cardMachines, 'Card Machines');
    addSheet(dueCollections, 'Due Collections');
    addSheet(attendance, 'Attendance');
    // Also backup settings, they are important
    const settingsData = [
        Object.fromEntries(Object.entries(settings).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : v]))
    ];
    addSheet(settingsData, 'Settings');

    XLSX.writeFile(wb, `${filename}.xlsx`);
};