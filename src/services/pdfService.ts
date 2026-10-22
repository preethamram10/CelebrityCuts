import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// @ts-ignore
// @ts-ignore
import logoImage from '../Assetss/Bill Logo.png';
interface InvoiceData {
    invoiceNo: string;
    date: string;
    customerName: string;
    customerMobile: string;
    items: any[];
    totalAmount: number;
    discount?: number;
    gst?: number;
    paymentMode: string;
    branchName?: string;
    branchAddress?: string;
    branchPhone?: string;
}

export const pdfService = {
    generateInvoicePDF: async (data: InvoiceData): Promise<Blob> => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // --- Colors ---
        const goldColor = [212, 175, 55] as [number, number, number];
        const blackColor = [0, 0, 0] as [number, number, number];

        // --- Helper: Load Image ---
        const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
        });

        // --- Decorative Border (The "Excellent Border") ---
        doc.setDrawColor(...goldColor);
        doc.setLineWidth(1.5);
        doc.rect(5, 5, pageWidth - 10, pageHeight - 10); // Outer Gold Border

        doc.setDrawColor(...blackColor);
        doc.setLineWidth(0.5);
        doc.rect(7, 7, pageWidth - 14, pageHeight - 14); // Inner Black Border

        // --- Header Section ---
        let yPos = 20;

        try {
            const img = await loadImage(logoImage);
            const logoWidth = 60; // Larger Logo as requested
            const logoHeight = (img.height / img.width) * logoWidth;
            doc.addImage(img, 'PNG', pageWidth / 2 - (logoWidth / 2), yPos, logoWidth, logoHeight);
            yPos += logoHeight + 5;
        } catch (e) {
            console.warn("Logo failed to load", e);
            yPos += 10;
        }

        // Title - "Celebrity Cuts"
        doc.setFont("times", "bold"); // Serif font for premium look
        doc.setFontSize(22);
        doc.setTextColor(...blackColor);
        doc.text("CELEBRITY CUTS", pageWidth / 2, yPos, { align: "center" });
        yPos += 7;

        // Tagline
        doc.setFont("times", "italic");
        doc.setFontSize(10);
        doc.setTextColor(...blackColor);
        doc.text("Experience the Luxury", pageWidth / 2, yPos, { align: "center" });
        yPos += 8;

        // Resolve branch details if missing
        let bName = data.branchName || "CELEBRITY CUTS";
        let bAddress = data.branchAddress || "";
        let bPhone = data.branchPhone || "";

        if (!bAddress) {
            const { authService } = await import('./authService');
            const info = authService.getBranchDetails(data);
            bName = `CELEBRITY CUTS - ${info.branchName.toUpperCase()}`;
            bAddress = info.address;
            bPhone = info.phone;
        }

        // Branch Name (Prominent)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(bName.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
        yPos += 6;

        // Branch Address (Wrapped cleanly)
        if (bAddress) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);
            const splitAddress = doc.splitTextToSize(bAddress, pageWidth - 40);
            doc.text(splitAddress, pageWidth / 2, yPos, { align: "center" });
            yPos += (splitAddress.length * 4) + 1;
        }

        // Branch Phone
        if (bPhone) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text(`Phone: ${bPhone}`, pageWidth / 2, yPos, { align: "center" });
            yPos += 5;
        }


        // Divider
        doc.setDrawColor(...goldColor);
        doc.setLineWidth(0.5);
        doc.line(20, yPos, pageWidth - 20, yPos);
        yPos += 10;

        // --- Customer & Invoice Details (Grid Layout) ---
        const leftX = 25;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...blackColor);

        // Date & Invoice No (Top Right/Left aligned or header style)
        // Let's do a clean Left/Right split

        // Left Side: Customer
        doc.setFont("helvetica", "bold");
        doc.text("BILLED TO:", leftX, yPos);
        doc.text("INVOICE DETAILS:", pageWidth / 2 + 10, yPos);
        yPos += 5;

        const custNameSafe = (data.customerName || 'Valued Customer').trim() || 'Valued Customer';
        const dateObj = new Date(data.date);
        const validDate = !isNaN(dateObj.getTime());
        const displayDate = validDate ? dateObj.toLocaleDateString('en-IN') : String(data.date || '');
        const displayTime = validDate ? dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

        doc.setFont("helvetica", "normal");
        doc.text(custNameSafe.toUpperCase(), leftX, yPos);
        doc.text(`Invoice No: ${data.invoiceNo}`, pageWidth / 2 + 10, yPos);
        yPos += 5;

        doc.text(`Phone: ${data.customerMobile || 'N/A'}`, leftX, yPos);
        doc.text(`Date: ${displayDate}`, pageWidth / 2 + 10, yPos);
        yPos += 5;

        if (displayTime) {
            doc.text(`Time: ${displayTime}`, pageWidth / 2 + 10, yPos);
        }

        yPos += 10;

        // --- Service Table ---
        const tableBody = (data.items || []).map(item => [
            item.name || 'Service',
            item.quantity || 1,
            `Rs. ${Number(item.price || item.total || item.amount || 0).toFixed(2)}`,
            `Rs. ${Number(item.discount || item.discountAmount || 0).toFixed(2)}`,
            `Rs. ${Number(item.total || item.amount || (item.price * (item.quantity || 1)) || 0).toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['SERVICE / PRODUCT', 'QTY', 'PRICE', 'DISC', 'AMOUNT']],
            body: tableBody,
            theme: 'grid', // Grid theme for sharper look
            headStyles: {
                fillColor: [20, 20, 20], // Almost black header
                textColor: [255, 255, 255],
                font: 'helvetica',
                fontStyle: 'bold',
                halign: 'center',
                lineWidth: 0.1,
                lineColor: [0, 0, 0]
            },
            styles: {
                font: 'helvetica',
                fontSize: 10,
                textColor: [0, 0, 0], // Strict Black
                lineColor: [200, 200, 200],
                lineWidth: 0.1,
                cellPadding: 4
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { halign: 'center', cellWidth: 15 },
                2: { halign: 'right', cellWidth: 25 },
                3: { halign: 'right', cellWidth: 25 },
                4: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
            },
            margin: { left: 20, right: 20 },
            didDrawPage: (d) => {
                if (d.cursor) {
                    yPos = d.cursor.y;
                }
            }
        });

        // Update yPos after table
        yPos = (doc as any).lastAutoTable.finalY + 10;

        // --- Totals Section ---
        const summaryX = pageWidth - 25; // Right aligned anchor
        const labelX = pageWidth - 95;   // Moved left from -80 to -95 (15mm more space)

        doc.setFontSize(10);

        // Subtotal
        const subTotal = data.items.reduce((acc, curr) => acc + curr.total, 0);

        doc.setFont("helvetica", "normal");
        doc.text("Sub Total:", labelX, yPos, { align: 'left' });
        doc.text(`Rs. ${subTotal.toFixed(2)}`, summaryX, yPos, { align: 'right' });
        yPos += 6;

        if (data.discount && data.discount > 0) {
            doc.text("Discount:", labelX, yPos, { align: 'left' });
            doc.text(`- Rs. ${data.discount.toFixed(2)}`, summaryX, yPos, { align: 'right' });
            yPos += 6;
        }

        if (data.gst && data.gst > 0) {
            doc.text("GST:", labelX, yPos, { align: 'left' });
            doc.text(`Rs. ${data.gst.toFixed(2)}`, summaryX, yPos, { align: 'right' });
            yPos += 6;
        }

        // Grand Total Box
        yPos += 2;
        doc.setDrawColor(...goldColor);
        doc.setLineWidth(0.5);
        doc.line(labelX, yPos, summaryX, yPos); // Top line
        yPos += 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("TOTAL PAID:", labelX, yPos, { align: 'left' });
        doc.setTextColor(...goldColor); // Gold for the final number
        doc.text(`Rs. ${data.totalAmount.toFixed(2)}`, summaryX, yPos, { align: 'right' });
        doc.setTextColor(...blackColor); // Reset to black

        yPos += 5;
        doc.setDrawColor(...goldColor);
        doc.line(labelX, yPos, summaryX, yPos); // Bottom line

        // Payment Mode
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text(`Payment Mode: ${data.paymentMode}`, labelX, yPos, { align: 'left' });

        // --- Footer ---
        const footerY = pageHeight - 40;

        doc.setDrawColor(200);
        // doc.line(20, footerY, pageWidth - 20, footerY);

        let fy = footerY + 5;
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.text("Hope to see you again soon!", pageWidth / 2, fy, { align: 'center' });

        // Dynamic Branch Address in Footer
        fy += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.text(bName.toUpperCase(), pageWidth / 2, fy, { align: "center" });

        fy += 4;
        doc.setFont("helvetica", "normal");
        const footerAddress = doc.splitTextToSize(bAddress, pageWidth - 40);
        doc.text(footerAddress, pageWidth / 2, fy, { align: "center" });


        // Social Links (Clickable)
        fy += 10;
        doc.setTextColor(...blackColor); // Ensure black text
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");

        const socialY = fy;
        const centerX = pageWidth / 2;

        // Define links
        const instaText = "Instagram";
        const fbText = "Facebook";
        const ytText = "YouTube";
        const pipe = "   |   ";

        const fullText = `${instaText}${pipe}${fbText}${pipe}${ytText}`;
        const textWidth = doc.getTextWidth(fullText);
        const startX = centerX - (textWidth / 2);

        let currentX = startX;

        // Instagram
        doc.text(instaText, currentX, socialY);
        doc.link(currentX, socialY - 3, doc.getTextWidth(instaText), 4, { url: 'https://www.instagram.com/celebritycutsinsta' });
        currentX += doc.getTextWidth(instaText);

        // Pipe
        doc.text(pipe, currentX, socialY);
        currentX += doc.getTextWidth(pipe);

        // Facebook
        doc.text(fbText, currentX, socialY);
        doc.link(currentX, socialY - 3, doc.getTextWidth(fbText), 4, { url: 'https://www.facebook.com/p/celebrity-cuts-100087441225596/' }); // URL from previous context
        currentX += doc.getTextWidth(fbText);

        // Pipe
        doc.text(pipe, currentX, socialY);
        currentX += doc.getTextWidth(pipe);

        // YouTube
        doc.text(ytText, currentX, socialY);
        doc.link(currentX, socialY - 3, doc.getTextWidth(ytText), 4, { url: 'https://www.youtube.com/@celebritycutsinvizag' });

        // Tagline under links
        fy += 5;
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        doc.text("@celebritycutsinsta", pageWidth / 2, fy, { align: "center" });

        return doc.output('blob');
    }
};
