import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';

export const formatCurrency = (val: number | string) => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatDate = (dateStr: string, lang: string = 'id') => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const locale = lang === 'en' ? 'en-US' : 'id-ID';
  const weekday = d.toLocaleDateString(locale, { weekday: 'long' });
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString(locale, { month: 'short' });
  const year = d.getFullYear();
  return `${weekday}, ${day}-${month}-${year}`;
};

export const exportToExcel = (transactions: Transaction[], filename = 'laporan-transaksi.xlsx') => {
  const data = transactions.map((t, idx) => ({
    No: idx + 1,
    Tanggal: formatDate(t.date),
    Wallet: t.wallet?.name || 'Utama',
    Tipe: t.type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan',
    Kategori: t.category?.name || 'Tanpa Kategori',
    Nominal: parseFloat(t.amount),
    Catatan: t.note || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transaksi');
  XLSX.writeFile(workbook, filename);
};

export const exportToCSV = (transactions: Transaction[], filename = 'laporan-transaksi.csv') => {
  const data = transactions.map((t, idx) => ({
    No: idx + 1,
    Tanggal: formatDate(t.date),
    Wallet: t.wallet?.name || 'Utama',
    Tipe: t.type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan',
    Kategori: t.category?.name || 'Tanpa Kategori',
    Nominal: parseFloat(t.amount),
    Catatan: t.note || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (
  transactions: Transaction[],
  title = 'Laporan Keuangan Transaksi',
  filename = 'laporan-keuangan.pdf'
) => {
  const doc = new jsPDF();

  // Header Title
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(title, 14, 20);

  // Meta info
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} | Total Transaksi: ${transactions.length}`, 14, 28);

  // Summary calculation
  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);

  doc.text(`Total Pemasukan: ${formatCurrency(totalIncome)} | Total Pengeluaran: ${formatCurrency(totalExpense)}`, 14, 34);

  // Table rows with Wallet column
  const tableRows = transactions.map((t, idx) => [
    idx + 1,
    formatDate(t.date),
    t.wallet?.name || 'Utama',
    t.type === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan',
    t.category?.name || 'Lainnya',
    formatCurrency(t.amount),
    t.note || '-',
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['No', 'Tanggal', 'Wallet', 'Tipe', 'Kategori', 'Nominal', 'Catatan']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 3 },
  });

  doc.save(filename);
};
