import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generate and download a PDF receipt for a placed order.
 * @param {Object} order - the order object returned by the backend
 */
export function downloadOrderPDF(order) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const gold = [201, 168, 76];
  const dark = [26, 18, 8];
  const W = doc.internal.pageSize.getWidth();

  /* ── Header band ── */
  doc.setFillColor(...dark);
  doc.rect(0, 0, W, 42, "F");

  doc.setTextColor(...gold);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("La Tavola", W / 2, 18, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 185, 150);
  doc.text("cucina italiana  ·  Via della Cucina 14, Roma", W / 2, 26, {
    align: "center",
  });
  doc.text("reservations@latavola.it  ·  +39 06 0000 0000", W / 2, 32, {
    align: "center",
  });

  doc.setFontSize(9);
  doc.setTextColor(...gold);
  
  const isDelivery = order.orderType === "delivery" || !order.orderType;
  doc.text(isDelivery ? "DELIVERY ORDER RECEIPT" : "PICKUP ORDER RECEIPT", W / 2, 39, { align: "center" });

  /* ── Order meta ── */
  let y = 52;
  doc.setTextColor(50, 35, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Order #${order.orderNumber}`, 15, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 65, 40);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, W - 15, y, {
    align: "right",
  });

  /* ── Delivery/Pickup Info box ── */
  y += 8;
  const boxTop = y;

  // Split text for dynamic sizing
  const addressLines = isDelivery && order.customer.address 
    ? doc.splitTextToSize(`Address:  ${order.customer.address}`, W - 40) 
    : [];
  const notesLines = order.customer.notes 
    ? doc.splitTextToSize(`Notes:    ${order.customer.notes}`, W - 40) 
    : [];

  let boxHeight = 22; // Base height: title, name, phone
  if (addressLines.length) boxHeight += addressLines.length * 5;
  if (notesLines.length) boxHeight += notesLines.length * 5;

  doc.setFillColor(253, 248, 238);
  doc.roundedRect(14, y, W - 28, boxHeight, 3, 3, "F");
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, W - 28, boxHeight, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...gold);
  doc.text(isDelivery ? "DELIVERY INFORMATION" : "PICKUP INFORMATION", 20, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 35, 15);
  doc.setFontSize(10);
  
  let currentY = y + 15;
  doc.text(`Name:     ${order.customer.name}`, 20, currentY);
  currentY += 6;
  doc.text(`Phone:    ${order.customer.phone}`, 20, currentY);
  currentY += 6;

  if (addressLines.length) {
    doc.text(addressLines, 20, currentY);
    currentY += addressLines.length * 5;
  }
  
  if (notesLines.length) {
    doc.text(notesLines, 20, currentY);
  }

  y = boxTop + boxHeight + 8;

  /* ── Items table ── */
  const itemsSubtotal = order.total - (order.deliveryFee || 0);

  const footers = [];
  footers.push(["", "", "", "", { content: "SUBTOTAL:", styles: { halign: "right" } }, `$${itemsSubtotal.toFixed(2)}`]);
  if (isDelivery && order.deliveryFee > 0) {
    footers.push(["", "", "", "", { content: "DELIVERY FEE:", styles: { halign: "right" } }, `$${order.deliveryFee.toFixed(2)}`]);
  }
  footers.push(["", "", "", "", { content: "TOTAL:", styles: { halign: "right" } }, `$${order.total.toFixed(2)}`]);

  autoTable(doc, {
    startY: y,
    head: [["#", "Item", "Category", "Unit Price", "Qty", "Subtotal"]],
    body: order.items.map((item, i) => [
      i + 1,
      item.name,
      item.category,
      `€${item.price.toFixed(2)}`,
      item.qty,
      `€${item.subtotal.toFixed(2)}`,
    ]),
    foot: footers,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: dark, textColor: gold, fontStyle: "bold" },
    footStyles: {
      fillColor: dark,
      textColor: gold,
      fontStyle: "bold",
      fontSize: 10,
    },
    alternateRowStyles: { fillColor: [253, 248, 238] },
    columnStyles: {
      0: { cellWidth: 8 },
      3: { halign: "right" },
      4: { halign: "center" },
      5: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: 14, right: 14 },
  });

  /* ── Footer ── */
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.setTextColor(120, 100, 60);
  doc.text("Thank you for your order! Grazie mille.", W / 2, finalY, {
    align: "center",
  });
  doc.setFontSize(8);
  doc.text(isDelivery ? "Estimated delivery: 25–35 minutes" : "Estimated pickup time: 15–20 minutes", W / 2, finalY + 6, {
    align: "center",
  });

  /* ── Download ── */
  doc.save(`LaTavola-Order-${order.orderNumber}.pdf`);
}
