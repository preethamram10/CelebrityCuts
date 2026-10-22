import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { pdfService } from '../services/pdfService';

export default function InvoiceDownload() {
    const { invoiceNo } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [invoice, setInvoice] = useState<any>(null);

    useEffect(() => {
        if (!invoiceNo) return;
        generateAndDownload();
    }, [invoiceNo]);

    const generateAndDownload = async () => {
        try {
            setLoading(true);
            // 1. Fetch Invoice Data
            let data: any = null;
            const docRef = doc(db, 'invoices', invoiceNo);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                data = { id: docSnap.id, ...docSnap.data() };
            } else {
                const q = query(collection(db, 'invoices'), where('invoice_no', '==', invoiceNo));
                const qSnap = await getDocs(q);
                if (!qSnap.empty) {
                    data = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() };
                }
            }

            if (!data) throw new Error("Invoice not found in system.");

            setInvoice(data);

            // 1b. Fetch Branch Details
            const { authService } = await import('../services/authService');
            const branchInfo = authService.getBranchDetails(data);
            const branchName = `Celebrity Cuts - ${branchInfo.branchName}`;
            const branchAddress = branchInfo.address;
            const branchPhone = branchInfo.phone;
            // 2. Prepare Data for PDF
            const pdfData = {
                invoiceNo: data.invoice_no,
                date: data.created_at, // or data.date if you stored it separately
                customerName: data.customer_name,
                customerMobile: data.customer_phone,
                items: data.items,
                totalAmount: data.total_amount,
                paymentMode: data.payment_mode,
                branchName: branchName,
                branchAddress: branchAddress, // Passed from settings
                branchPhone: branchPhone,     // Passed from settings
                discount: 0, // Calculate from items or store in DB if needed (currently logic is inside items usually)
                gst: 0 // Calculate if needed/stored
            };

            // Calculate overall discount/gst from items if not stored at top level
            // For now, trusting total_amount, but we can refine if you store breakdown

            // 3. Generate PDF
            const blob = await pdfService.generateInvoicePDF(pdfData);

            // 4. Trigger Download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${data.invoice_no}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to generate invoice");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #333', borderTop: '3px solid #D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <h2>Generating Invoice...</h2>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ color: '#ef4444' }}>Error</h1>
                <p>{error}</p>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', background: '#111', padding: '40px', borderRadius: '20px', border: '1px solid #333' }}>
                <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
                <h1 style={{ color: '#D4AF37', marginBottom: '10px' }}>Invoice Downloaded</h1>
                <p style={{ color: '#888' }}>Invoice <b>{invoice?.invoice_no}</b> has been saved to your device.</p>
                <div style={{ marginTop: '30px' }}>
                    <p style={{ fontSize: '12px', color: '#555' }}>Thank you for choosing Celebrity Cuts</p>
                </div>
            </div>
        </div>
    );
}
