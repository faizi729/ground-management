import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReceiptData {
  receiptId: string;
  bookingId: number;
  paymentId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  facilityName: string;
  sportName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  participants: number;
  totalBookingAmount: number;
  totalAmount: number;
  paidAmount: number;
  discountAmount?: number;
  totalPaidBeforeThis?: number;
  paymentMethod: string;
  transactionId?: string;
  paymentDate: string;
  balanceAmount: number;
  paymentStatus: string;
}

export class ReceiptGenerator {
  static generateReceiptPDF(receiptData: ReceiptData): Buffer {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Aryen Sports Arena', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sports Facility Booking Receipt', pageWidth / 2, 35, { align: 'center' });
    
    // Receipt Info
    doc.setFontSize(10);
    doc.text(`Receipt ID: ${receiptData.receiptId}`, 20, 50);
    doc.text(`Date: ${new Date(receiptData.paymentDate).toLocaleDateString()}`, pageWidth - 60, 50);
    
    // Customer and Booking Details (Side by Side)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Details:', 20, 70);
    doc.text('Booking Details:', pageWidth/2 + 10, 70);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Customer Details (Left Column)
    doc.text(`Name: ${receiptData.customerName}`, 20, 82);
    doc.text(`Email: ${receiptData.customerEmail}`, 20, 92);
    if (receiptData.customerPhone) {
      doc.text(`Phone: ${receiptData.customerPhone}`, 20, 102);
    }
    
    // Booking Details (Right Column)
    doc.text(`Booking ID: ${receiptData.bookingId}`, pageWidth/2 + 10, 82);
    doc.text(`Facility: ${receiptData.facilityName}`, pageWidth/2 + 10, 92);
    doc.text(`Sport: ${receiptData.sportName}`, pageWidth/2 + 10, 102);
    doc.text(`Date: ${new Date(receiptData.bookingDate).toLocaleDateString()}`, pageWidth/2 + 10, 112);
    doc.text(`Time: ${receiptData.startTime} - ${receiptData.endTime}`, pageWidth/2 + 10, 122);
    doc.text(`Participants: ${receiptData.participants}`, pageWidth/2 + 10, 132);
    
    // Payment Summary Table (Conditional)
    const paymentData = [
      ['Description', 'Amount'],
      ['Total Booking Amount', `₹${receiptData.totalBookingAmount.toLocaleString()}`]
    ];
    
    // Add discount rows only if discount exists
    if (receiptData.discountAmount && receiptData.discountAmount > 0) {
      paymentData.push(['Discount Applied', `-₹${receiptData.discountAmount.toLocaleString()}`]);
      paymentData.push(['Amount After Discount', `₹${(receiptData.totalBookingAmount - receiptData.discountAmount).toLocaleString()}`]);
    }
    
    // Add previous payment rows only if there were previous payments
    if (receiptData.totalPaidBeforeThis && receiptData.totalPaidBeforeThis > 0) {
      paymentData.push(['Total Paid (Before This)', `₹${receiptData.totalPaidBeforeThis.toLocaleString()}`]);
      paymentData.push(['Due Amount (Before This)', `₹${receiptData.totalAmount.toLocaleString()}`]);
    }
    
    // Always show current payment and balance
    paymentData.push(['Amount Paid This Transaction', `₹${receiptData.paidAmount.toLocaleString()}`]);
    paymentData.push(['Remaining Balance', receiptData.balanceAmount > 0 ? `₹${receiptData.balanceAmount.toLocaleString()}` : 'Fully Paid']);
    
    autoTable(doc, {
      startY: 150,
      head: [paymentData[0]],
      body: paymentData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 60, halign: 'right' }
      }
    });
    
    // Payment Details
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Details:', 20, finalY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Payment Method: ${receiptData.paymentMethod}`, 20, finalY + 12);
    if (receiptData.transactionId) {
      doc.text(`Transaction ID: ${receiptData.transactionId}`, 20, finalY + 22);
    }
    doc.text(`Payment Status: ${receiptData.paymentStatus.toUpperCase()}`, 20, finalY + 32);
    doc.text(`Payment Date: ${new Date(receiptData.paymentDate).toLocaleString()}`, 20, finalY + 42);
    
    // Footer
    doc.setFontSize(8);
    doc.text('Thank you for choosing Aryen Sports Arena!', pageWidth / 2, finalY + 65, { align: 'center' });
    doc.text('For any queries, contact us at support@aryenrecreation.com', pageWidth / 2, finalY + 75, { align: 'center' });
    
    return Buffer.from(doc.output('arraybuffer'));
  }
  
  static generateReceiptHTML(receiptData: ReceiptData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt - ${receiptData.receiptId}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #428bca; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #428bca; margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .receipt-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .section h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .details { line-height: 1.6; }
          .payment-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .payment-table th, .payment-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          .payment-table th { background-color: #428bca; color: white; }
          .payment-table td:last-child { text-align: right; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          .status { padding: 5px 10px; border-radius: 3px; font-weight: bold; }
          .status.paid { background-color: #d4edda; color: #155724; }
          .status.partial { background-color: #fff3cd; color: #856404; }
          .status.pending { background-color: #f8d7da; color: #721c24; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Aryen Sports Arena</h1>
          <p>Sports Facility Booking Receipt</p>
        </div>
        
        <div class="receipt-info">
          <div><strong>Receipt ID:</strong> ${receiptData.receiptId}</div>
          <div><strong>Date:</strong> ${new Date(receiptData.paymentDate).toLocaleDateString()}</div>
        </div>
        
        <div class="section">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h3>Customer Details</h3>
              <div class="details">
                <div><strong>Name:</strong> ${receiptData.customerName}</div>
                <div><strong>Email:</strong> ${receiptData.customerEmail}</div>
                ${receiptData.customerPhone ? `<div><strong>Phone:</strong> ${receiptData.customerPhone}</div>` : ''}
              </div>
            </div>
            <div>
              <h3>Booking Details</h3>
              <div class="details">
                <div><strong>Booking ID:</strong> ${receiptData.bookingId}</div>
                <div><strong>Facility:</strong> ${receiptData.facilityName}</div>
                <div><strong>Sport:</strong> ${receiptData.sportName}</div>
                <div><strong>Date:</strong> ${new Date(receiptData.bookingDate).toLocaleDateString()}</div>
                <div><strong>Time:</strong> ${receiptData.startTime} - ${receiptData.endTime}</div>
                <div><strong>Participants:</strong> ${receiptData.participants}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h3>Payment Summary</h3>
          <table class="payment-table">
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
            <tr>
              <td>Total Booking Amount</td>
              <td>₹${receiptData.totalBookingAmount.toLocaleString()}</td>
            </tr>
            ${(receiptData.discountAmount && receiptData.discountAmount > 0) ? `
            <tr>
              <td>Discount Applied</td>
              <td style="color: green;">-₹${receiptData.discountAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Amount After Discount</td>
              <td>₹${(receiptData.totalBookingAmount - receiptData.discountAmount).toLocaleString()}</td>
            </tr>` : ''}
            ${(receiptData.totalPaidBeforeThis && receiptData.totalPaidBeforeThis > 0) ? `
            <tr>
              <td>Total Paid (Before This Payment)</td>
              <td style="color: blue;">₹${receiptData.totalPaidBeforeThis.toLocaleString()}</td>
            </tr>
            <tr style="background-color: #f0f8ff;">
              <td><strong>Due Amount (Before This Payment)</strong></td>
              <td><strong>₹${receiptData.totalAmount.toLocaleString()}</strong></td>
            </tr>` : ''}
            <tr style="background-color: #f0fff0;">
              <td><strong>Amount Paid This Transaction</strong></td>
              <td><strong style="color: green;">₹${receiptData.paidAmount.toLocaleString()}</strong></td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td><strong>Remaining Balance</strong></td>
              <td><strong>${receiptData.balanceAmount > 0 ? '₹' + receiptData.balanceAmount.toLocaleString() : 'Fully Paid'}</strong></td>
            </tr>
          </table>
        </div>
        
        <div class="section">
          <h3>Payment Details</h3>
          <div class="details">
            <div><strong>Payment Method:</strong> ${receiptData.paymentMethod}</div>
            ${receiptData.transactionId ? `<div><strong>Transaction ID:</strong> ${receiptData.transactionId}</div>` : ''}
            <div><strong>Payment Status:</strong> <span class="status ${receiptData.paymentStatus.toLowerCase()}">${receiptData.paymentStatus.toUpperCase()}</span></div>
            <div><strong>Payment Date:</strong> ${new Date(receiptData.paymentDate).toLocaleString()}</div>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing Aryen Sports Arena!</p>
          <p>For any queries, contact us at support@aryenrecreation.com</p>
        </div>
      </body>
      </html>
    `;
  }
  
  static generateSMSText(receiptData: ReceiptData): string {
    return `Aryen Sports Arena - Payment Receipt
Receipt ID: ${receiptData.receiptId}
Booking: ${receiptData.facilityName}
Date: ${new Date(receiptData.bookingDate).toLocaleDateString()}
Time: ${receiptData.startTime}-${receiptData.endTime}
Amount Paid: ₹${receiptData.paidAmount.toLocaleString()}
Balance: ₹${receiptData.balanceAmount.toLocaleString()}
Status: ${receiptData.paymentStatus.toUpperCase()}
Thank you for choosing us!`;
  }
}