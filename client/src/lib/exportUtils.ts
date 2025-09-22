import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// PDF Export Functions
export const exportRevenueToPDF = (data: any[], title: string) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
  
  // Prepare table data
  const tableData = data.map(row => [
    row.period_label || row.period,
    row.transaction_count || '0',
    `₹${Number(row.total_revenue || 0).toLocaleString()}`,
    `₹${Number(row.avg_transaction_value || 0).toLocaleString()}`
  ]);
  
  // Add table
  autoTable(doc, {
    head: [['Period', 'Transactions', 'Total Revenue', 'Avg Value']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] }
  });
  
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};

export const exportRevenueBysportToPDF = (data: any[], title: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
  
  const tableData = data.map(row => [
    row.sport_name,
    row.booking_count || '0',
    `₹${Number(row.total_revenue || 0).toLocaleString()}`,
    `₹${Number(row.avg_booking_value || 0).toLocaleString()}`
  ]);
  
  autoTable(doc, {
    head: [['Sport', 'Bookings', 'Total Revenue', 'Avg Booking Value']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] }
  });
  
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};

export const exportFacilityUsageToPDF = (data: any[], title: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
  
  const tableData = data.map(row => [
    row.sport_name,
    row.ground_name || 'N/A',
    row.booking_count || '0',
    row.total_participants || '0',
    `${Number(row.utilization_rate || 0).toFixed(1)}%`
  ]);
  
  autoTable(doc, {
    head: [['Sport', 'Ground', 'Bookings', 'Participants', 'Utilization']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] }
  });
  
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};

export const exportMemberBookingsToPDF = (data: any[], title: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
  
  const tableData = data.map(row => [
    row.user_id,
    row.username || 'N/A',
    row.total_bookings || '0',
    row.favorite_sport || 'N/A',
    `₹${Number(row.total_spent || 0).toLocaleString()}`
  ]);
  
  autoTable(doc, {
    head: [['User ID', 'Username', 'Total Bookings', 'Favorite Sport', 'Total Spent']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] }
  });
  
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};

export const exportMemberPaymentsToPDF = (data: any[], title: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
  
  const tableData = data.map(row => [
    row.user_id,
    row.username || 'N/A',
    row.cash_payments || '₹0',
    row.upi_payments || '₹0',
    row.card_payments || '₹0',
    `₹${Number(row.total_payments || 0).toLocaleString()}`
  ]);
  
  autoTable(doc, {
    head: [['User ID', 'Username', 'Cash', 'UPI', 'Card', 'Total']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] }
  });
  
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};

// Excel Export Functions
export const exportRevenueToExcel = (data: any[], title: string) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(row => ({
      'Period': row.period_label || row.period,
      'Transactions': row.transaction_count || 0,
      'Total Revenue': `₹${Number(row.total_revenue || 0).toLocaleString()}`,
      'Average Value': `₹${Number(row.avg_transaction_value || 0).toLocaleString()}`
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Revenue Report');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${title.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
};

export const exportRevenueBySportToExcel = (data: any[], title: string) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(row => ({
      'Sport': row.sport_name,
      'Bookings': row.booking_count || 0,
      'Total Revenue': `₹${Number(row.total_revenue || 0).toLocaleString()}`,
      'Average Booking Value': `₹${Number(row.avg_booking_value || 0).toLocaleString()}`
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Revenue by Sport');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${title.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
};

export const exportFacilityUsageToExcel = (data: any[], title: string) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(row => ({
      'Sport': row.sport_name,
      'Ground': row.ground_name || 'N/A',
      'Bookings': row.booking_count || 0,
      'Participants': row.total_participants || 0,
      'Utilization Rate': `${Number(row.utilization_rate || 0).toFixed(1)}%`
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Facility Usage');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${title.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
};

export const exportMemberBookingsToExcel = (data: any[], title: string) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(row => ({
      'User ID': row.user_id,
      'Username': row.username || 'N/A',
      'Total Bookings': row.total_bookings || 0,
      'Favorite Sport': row.favorite_sport || 'N/A',
      'Total Spent': `₹${Number(row.total_spent || 0).toLocaleString()}`
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Member Bookings');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${title.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
};

export const exportMemberPaymentsToExcel = (data: any[], title: string) => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.map(row => ({
      'User ID': row.user_id,
      'Username': row.username || 'N/A',
      'Cash Payments': row.cash_payments || '₹0',
      'UPI Payments': row.upi_payments || '₹0',
      'Card Payments': row.card_payments || '₹0',
      'Total Payments': `₹${Number(row.total_payments || 0).toLocaleString()}`
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Member Payments');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${title.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
};

// Coupon Usage Export Functions
export const exportCouponUsageToPDF = (data: any[], title: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
  
  if (data.length === 0) {
    doc.text('No coupon usage data available for the selected period.', 20, 50);
  } else {
    const tableData = data.map(row => [
      row.coupon_code,
      row.discount_type || 'N/A',
      row.discount_value || '0',
      row.usage_count || '0',
      `₹${Number(row.total_discount_amount || 0).toLocaleString()}`
    ]);
    
    autoTable(doc, {
      head: [['Coupon Code', 'Type', 'Value', 'Usage Count', 'Total Discount']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    });
  }
  
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};

export const exportCouponUsageToExcel = (data: any[], title: string) => {
  const worksheet = data.length === 0 
    ? XLSX.utils.json_to_sheet([{ 'Message': 'No coupon usage data available for the selected period.' }])
    : XLSX.utils.json_to_sheet(
        data.map(row => ({
          'Coupon Code': row.coupon_code,
          'Discount Type': row.discount_type || 'N/A',
          'Discount Value': row.discount_value || '0',
          'Usage Count': row.usage_count || '0',
          'Total Discount Amount': `₹${Number(row.total_discount_amount || 0).toLocaleString()}`
        }))
      );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Coupon Usage');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${title.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
};

// Payment Export Functions
export const exportPaymentsToPDF = (data: any[], title: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
  
  if (data.length === 0) {
    doc.text('No payment data available for the selected period.', 20, 50);
  } else {
    const tableData = data.map(row => [
      `#${row.id}`,
      row.userName || 'N/A',
      `₹${Number(row.amount).toLocaleString()}`,
      row.paymentMethod || 'N/A',
      row.status,
      row.discountAmount ? `₹${Number(row.discountAmount).toLocaleString()}` : '₹0',
      new Date(row.createdAt).toLocaleDateString()
    ]);
    
    autoTable(doc, {
      head: [['Payment ID', 'User', 'Amount', 'Method', 'Status', 'Discount', 'Date']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 }
      }
    });
  }
  
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};

export const exportPaymentsToExcel = (data: any[], title: string) => {
  const worksheet = data.length === 0 
    ? XLSX.utils.json_to_sheet([{ 'Message': 'No payment data available for the selected period.' }])
    : XLSX.utils.json_to_sheet(
        data.map(row => ({
          'Payment ID': `#${row.id}`,
          'Booking ID': `#${row.bookingId}`,
          'User Name': row.userName || 'N/A',
          'User Email': row.userEmail || 'N/A',
          'Amount': `₹${Number(row.amount).toLocaleString()}`,
          'Payment Method': row.paymentMethod || 'N/A',
          'Transaction ID': row.transactionId || 'N/A',
          'Status': row.status,
          'Discount Amount': row.discountAmount ? `₹${Number(row.discountAmount).toLocaleString()}` : '₹0',
          'Discount Reason': row.discountReason || 'N/A',
          'Processed Date': row.processedAt ? new Date(row.processedAt).toLocaleDateString() : 'N/A',
          'Created Date': new Date(row.createdAt).toLocaleDateString(),
          'Start Date': row.startDate ? new Date(row.startDate).toLocaleDateString() : 'N/A',
          'End Date': row.endDate ? new Date(row.endDate).toLocaleDateString() : 'N/A'
        }))
      );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${title.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
};

export const printPayments = (data: any[], title: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .header { margin-bottom: 20px; }
        .date { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .amount { color: #28a745; font-weight: bold; }
        .status-completed { color: #28a745; font-weight: bold; }
        .status-pending { color: #ffc107; font-weight: bold; }
        .status-partial { color: #17a2b8; font-weight: bold; }
        .status-failed { color: #dc3545; font-weight: bold; }
        @media print { 
          body { margin: 0; } 
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <div class="date">Generated on: ${new Date().toLocaleDateString()}</div>
      </div>
      
      ${data.length === 0 ? '<p>No payment data available for the selected period.</p>' : `
      <table>
        <thead>
          <tr>
            <th>Payment ID</th>
            <th>Booking ID</th>
            <th>User</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Discount</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td>#${row.id}</td>
              <td>#${row.bookingId}</td>
              <td>${row.userName || 'N/A'}</td>
              <td class="amount">₹${Number(row.amount).toLocaleString()}</td>
              <td>${row.paymentMethod || 'N/A'}</td>
              <td class="status-${row.status}">${row.status}</td>
              <td>${row.discountAmount ? `₹${Number(row.discountAmount).toLocaleString()}` : '₹0'}</td>
              <td>${new Date(row.createdAt).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      `}
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

// Print Functions
export const printRevenue = (data: any[], title: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .header { margin-bottom: 20px; }
        .date { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .amount { color: #28a745; font-weight: bold; }
        @media print { 
          body { margin: 0; } 
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p class="date">Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Period</th>
            <th>Transactions</th>
            <th>Total Revenue</th>
            <th>Average Value</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td>${row.period_label || row.period}</td>
              <td>${row.transaction_count || "0"}</td>
              <td class="amount">₹${Number(row.total_revenue || 0).toLocaleString()}</td>
              <td class="amount">₹${Number(row.avg_transaction_value || 0).toLocaleString()}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

export const printRevenueBySport = (data: any[], title: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .header { margin-bottom: 20px; }
        .date { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .amount { color: #28a745; font-weight: bold; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p class="date">Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Sport</th>
            <th>Bookings</th>
            <th>Total Revenue</th>
            <th>Average Booking Value</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td>${row.sport_name}</td>
              <td>${row.booking_count || "0"}</td>
              <td class="amount">₹${Number(row.total_revenue || 0).toLocaleString()}</td>
              <td class="amount">₹${Number(row.avg_booking_value || 0).toLocaleString()}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

export const printFacilityUsage = (data: any[], title: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .header { margin-bottom: 20px; }
        .date { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .utilization { font-weight: bold; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p class="date">Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Sport</th>
            <th>Ground</th>
            <th>Bookings</th>
            <th>Participants</th>
            <th>Utilization</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td>${row.sport_name}</td>
              <td>${row.ground_name || "N/A"}</td>
              <td>${row.booking_count || "0"}</td>
              <td>${row.total_participants || "0"}</td>
              <td class="utilization">${Number(row.utilization_rate || 0).toFixed(1)}%</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

export const printMemberBookings = (data: any[], title: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .header { margin-bottom: 20px; }
        .date { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .amount { color: #28a745; font-weight: bold; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p class="date">Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>User ID</th>
            <th>Username</th>
            <th>Total Bookings</th>
            <th>Favorite Sport</th>
            <th>Total Spent</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td>${row.user_id}</td>
              <td>${row.username || "N/A"}</td>
              <td>${row.total_bookings || "0"}</td>
              <td>${row.favorite_sport || "N/A"}</td>
              <td class="amount">₹${Number(row.total_spent || 0).toLocaleString()}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

export const printMemberPayments = (data: any[], title: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .header { margin-bottom: 20px; }
        .date { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .amount { color: #28a745; font-weight: bold; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p class="date">Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>User ID</th>
            <th>Username</th>
            <th>Cash</th>
            <th>UPI</th>
            <th>Card</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td>${row.user_id}</td>
              <td>${row.username || "N/A"}</td>
              <td>${row.cash_payments || "₹0"}</td>
              <td>${row.upi_payments || "₹0"}</td>
              <td>${row.card_payments || "₹0"}</td>
              <td class="amount">₹${Number(row.total_payments || 0).toLocaleString()}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

export const printCouponUsage = (data: any[], title: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .header { margin-bottom: 20px; }
        .date { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .amount { color: #28a745; font-weight: bold; }
        .no-data { text-align: center; padding: 40px; color: #666; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p class="date">Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
      ${data.length === 0 ? 
        "<div class=\"no-data\">No coupon usage data available for the selected period.</div>" :
        `<table>
          <thead>
            <tr>
              <th>Coupon Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Usage Count</th>
              <th>Total Discount</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                <td>${row.coupon_code}</td>
                <td>${row.discount_type || "N/A"}</td>
                <td>${row.discount_value || "0"}</td>
                <td>${row.usage_count || "0"}</td>
                <td class="amount">₹${Number(row.total_discount_amount || 0).toLocaleString()}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>`
      }
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
