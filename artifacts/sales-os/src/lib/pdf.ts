import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";

import type { Invoice } from "@workspace/api-client-react";

import { formatCurrency, formatDate } from "./format";

export function downloadInvoicePdf(invoice: Invoice): void {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("INVOICE", 14, 22);

  doc.setFontSize(10);
  doc.text(invoice.sellerName, 14, 30);

  doc.setFontSize(11);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 140, 22);
  doc.text(`Date: ${formatDate(invoice.issueDate)}`, 140, 28);
  doc.text(`Status: ${invoice.status}`, 140, 34);
  if (invoice.paymentMethod) {
    doc.text(`Payment: ${invoice.paymentMethod}`, 140, 40);
  }

  doc.setFontSize(11);
  doc.text("Bill To", 14, 48);
  doc.setFontSize(10);
  let y = 54;
  if (invoice.customerName) {
    doc.text(invoice.customerName, 14, y);
    y += 5;
  }
  if (invoice.customerEmail) {
    doc.text(invoice.customerEmail, 14, y);
    y += 5;
  }
  if (invoice.customerPhone) {
    doc.text(invoice.customerPhone, 14, y);
    y += 5;
  }
  if (!invoice.customerName && !invoice.customerEmail) {
    doc.text("Walk-in customer", 14, y);
  }

  autoTable(doc, {
    startY: 75,
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: invoice.lines.map<RowInput>((l) => [
      l.description,
      String(l.quantity),
      formatCurrency(l.unitPrice, true),
      formatCurrency(l.amount, true),
    ]),
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  });

  // @ts-expect-error - lastAutoTable injected by jspdf-autotable
  const finalY: number = doc.lastAutoTable?.finalY ?? 95;
  let summaryY = finalY + 8;
  const rightX = 196;
  const labelX = 140;

  doc.setFontSize(10);
  doc.text("Subtotal:", labelX, summaryY, { align: "left" });
  doc.text(formatCurrency(invoice.subtotal, true), rightX, summaryY, {
    align: "right",
  });
  summaryY += 6;
  doc.text("Discount:", labelX, summaryY);
  doc.text(`- ${formatCurrency(invoice.discountAmount, true)}`, rightX, summaryY, {
    align: "right",
  });
  summaryY += 6;
  doc.text("GST:", labelX, summaryY);
  doc.text(formatCurrency(invoice.gstAmount, true), rightX, summaryY, {
    align: "right",
  });
  summaryY += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total:", labelX, summaryY);
  doc.text(formatCurrency(invoice.total, true), rightX, summaryY, {
    align: "right",
  });

  if (invoice.notes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Notes:", 14, summaryY + 14);
    const split = doc.splitTextToSize(invoice.notes, 180);
    doc.text(split, 14, summaryY + 20);
  }

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export function downloadTableAsPdf(
  title: string,
  head: string[],
  body: (string | number)[][],
  filename: string,
): void {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.text(`Generated ${formatDate(new Date())}`, 14, 24);
  autoTable(doc, {
    startY: 30,
    head: [head],
    body: body.map((row) => row.map((c) => String(c))),
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  });
  doc.save(filename);
}
