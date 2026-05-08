import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";

import type { Invoice } from "@workspace/api-client-react";

import { formatCurrency, formatDate } from "./format";

function toSafeText(value: unknown, fallback = "-"): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function safeCurrency(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function downloadInvoicePdf(invoice: Invoice): void {
  const doc = new jsPDF();
  const lines = Array.isArray(invoice.lines) ? invoice.lines : [];
  const invoiceNumber = toSafeText(invoice.invoiceNumber, `INV-${Date.now()}`);
  const issueDate = toSafeText(invoice.issueDate, new Date().toISOString());
  const sellerName = toSafeText(invoice.sellerName, "Sales OS");
  const status = toSafeText(invoice.status, "pending");
  const paymentMethod = toSafeText(invoice.paymentMethod, "");
  const customerName = toSafeText(invoice.customerName, "");
  const customerEmail = toSafeText(invoice.customerEmail, "");
  const customerPhone = toSafeText(invoice.customerPhone, "");
  const notes = toSafeText(invoice.notes, "");

  doc.setFontSize(20);
  doc.text("INVOICE", 14, 22);

  doc.setFontSize(10);
  doc.text(sellerName, 14, 30);

  doc.setFontSize(11);
  doc.text(`Invoice #: ${invoiceNumber}`, 140, 22);
  doc.text(`Date: ${formatDate(issueDate)}`, 140, 28);
  doc.text(`Status: ${status}`, 140, 34);
  if (paymentMethod) {
    doc.text(`Payment: ${paymentMethod}`, 140, 40);
  }

  doc.setFontSize(11);
  doc.text("Bill To", 14, 48);
  doc.setFontSize(10);
  let y = 54;
  if (customerName) {
    doc.text(customerName, 14, y);
    y += 5;
  }
  if (customerEmail) {
    doc.text(customerEmail, 14, y);
    y += 5;
  }
  if (customerPhone) {
    doc.text(customerPhone, 14, y);
    y += 5;
  }
  if (!customerName && !customerEmail) {
    doc.text("Walk-in customer", 14, y);
  }

  autoTable(doc, {
    startY: 75,
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: lines.map<RowInput>((l) => [
      toSafeText(l.description),
      toSafeText(l.quantity, "0"),
      formatCurrency(safeCurrency(l.unitPrice), true),
      formatCurrency(safeCurrency(l.amount), true),
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
  doc.text(formatCurrency(safeCurrency(invoice.subtotal), true), rightX, summaryY, {
    align: "right",
  });
  summaryY += 6;
  doc.text("Discount:", labelX, summaryY);
  doc.text(
    `- ${formatCurrency(safeCurrency(invoice.discountAmount), true)}`,
    rightX,
    summaryY,
    {
      align: "right",
    },
  );
  summaryY += 6;
  doc.text("GST:", labelX, summaryY);
  doc.text(formatCurrency(safeCurrency(invoice.gstAmount), true), rightX, summaryY, {
    align: "right",
  });
  summaryY += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total:", labelX, summaryY);
  doc.text(formatCurrency(safeCurrency(invoice.total), true), rightX, summaryY, {
    align: "right",
  });

  if (notes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Notes:", 14, summaryY + 14);
    const split = doc.splitTextToSize(notes, 180);
    doc.text(split, 14, summaryY + 20);
  }

  doc.save(`${invoiceNumber}.pdf`);
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
