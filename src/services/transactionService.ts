import { authService, isSameBranch, resolveBranchId } from './authService';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, updateDoc, query, orderBy } from 'firebase/firestore';
import { getISTDateString, getISTTimeString } from '../utils/dateUtils';

export interface Transaction {
    id: string;
    date: string;
    time: string;
    amount: number;
    customerId: string;
    customerName: string;
    branchId: string;
    items?: {
        type: 'service' | 'product' | 'hair_extension';
        name: string;
        amount: number;
        category?: string;
        staffIds?: string[];
        staffSplits?: { id: string; name: string; percentage?: number; amount: number }[];
    }[];
    paymentMethod?: 'cash' | 'card' | 'upi';
    subtotal?: number;
    discount?: number;
    gst?: number;
}

const getSampleInvoices = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return [
        {
            id: `INV-branch1-${todayStr}-001`,
            invoice_no: `INV-branch1-${todayStr}-001`,
            branch_id: 'branch1',
            customer_name: 'Ramesh Kumar',
            customer_phone: '9849011111',
            total_amount: 3500,
            payment_mode: 'UPI',
            created_at: `${todayStr}T11:30:00.000Z`,
            items: [
                { name: 'Haircut & Styling', price: 1500, quantity: 1, total: 1500, category: 'Haircut', staffIds: ['staff-mouni'] },
                { name: 'Hair Color', price: 2000, quantity: 1, total: 2000, category: 'Hair Color', staffIds: ['staff-divya'] }
            ]
        },
        {
            id: `INV-branch1-${todayStr}-002`,
            invoice_no: `INV-branch1-${todayStr}-002`,
            branch_id: 'branch1',
            customer_name: 'Sneha Reddy',
            customer_phone: '9849022222',
            total_amount: 18500,
            payment_mode: 'Card',
            created_at: `${todayStr}T14:15:00.000Z`,
            items: [
                { name: 'Keratin 20 Inch Extension', price: 18500, quantity: 1, total: 18500, category: 'Hair Extensions', staffIds: ['staff-biman'] }
            ]
        },
        {
            id: `INV-branch1-${todayStr}-003`,
            invoice_no: `INV-branch1-${todayStr}-003`,
            branch_id: 'branch1',
            customer_name: 'Kiran Verma',
            customer_phone: '9849033333',
            total_amount: 4200,
            payment_mode: 'Cash',
            created_at: `${todayStr}T16:45:00.000Z`,
            items: [
                { name: 'Luxury Facial', price: 3500, quantity: 1, total: 3500, category: 'Facial', staffIds: ['staff-krupa'] },
                { name: 'Hair Care Serum', price: 700, quantity: 1, total: 700, category: 'Product' }
            ]
        },
        {
            id: `INV-branch2-${todayStr}-004`,
            invoice_no: `INV-branch2-${todayStr}-004`,
            branch_id: 'branch2',
            customer_name: 'Anil Varma (Vizag)',
            customer_phone: '9849044444',
            total_amount: 2500,
            payment_mode: 'UPI',
            created_at: `${todayStr}T12:10:00.000Z`,
            items: [
                { name: 'Beard Trim & Haircut', price: 2500, quantity: 1, total: 2500, category: 'Styling', staffIds: ['staff-vizag-1'] }
            ]
        },
        {
            id: `INV-branch3-${todayStr}-005`,
            invoice_no: `INV-branch3-${todayStr}-005`,
            branch_id: 'branch3',
            customer_name: 'Pooja Naidu (Vijayawada)',
            customer_phone: '9849055555',
            total_amount: 12000,
            payment_mode: 'Card',
            created_at: `${todayStr}T15:20:00.000Z`,
            items: [
                { name: 'Tape-In 20 Inch Extension', price: 12000, quantity: 1, total: 12000, category: 'Hair Extensions', staffIds: ['staff-vjw-1'] }
            ]
        },
        {
            id: `INV-branch4-${todayStr}-006`,
            invoice_no: `INV-branch4-${todayStr}-006`,
            branch_id: 'branch4',
            customer_name: 'Harika Reddy (Hyderabad)',
            customer_phone: '9849066666',
            total_amount: 8500,
            payment_mode: 'UPI',
            created_at: `${todayStr}T16:00:00.000Z`,
            items: [
                { name: 'Luxury Hair Spa & Styling', price: 8500, quantity: 1, total: 8500, category: 'Hair Spa', staffIds: ['staff-hyd-1'] }
            ]
        }
    ];
};

export const transactionService = {
    getAllTransactions: async (): Promise<Transaction[]> => {
        const user = authService.getCurrentUser();
        const branchId = user?.branchId || 'branch1';
        const uBranch = (user?.branchId || user?.branchName || branchId).toLowerCase();

        let invData: any[] = [];
        try {
            const snapshot = await getDocs(collection(db, 'invoices'));
            if (!snapshot.empty) {
                invData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                invData.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
            }
        } catch (err) {
            console.warn('Invoices fetch from Firestore failed, using sample data:', err);
        }

        // Fallback to sample invoices if database is empty
        if (invData.length === 0) {
            invData = getSampleInvoices();
        }

        // Strict branch isolation for non-admin users
        let filteredInvoices = invData;
        if (user && user.role !== 'admin' && uBranch !== 'all') {
            filteredInvoices = invData.filter(inv => isSameBranch(inv, uBranch));
        }

        return filteredInvoices.map((inv: any) => {
            const localDateStr = getISTDateString(inv.created_at);
            const localTimeStr = getISTTimeString(inv.created_at);

            const invBranchId = resolveBranchId(inv);

            const mappedItems = (inv.items || []).map((item: any) => {
                let type: 'service' | 'product' | 'hair_extension' = 'service';
                const catLower = (item.category || item.type || '').toLowerCase();
                const nameLower = (item.name || '').toLowerCase();
                if (catLower.includes('product')) {
                    type = 'product';
                } else if (catLower.includes('extension') || nameLower.includes('extension') || nameLower.includes('hot-fusion') || nameLower.includes('luxury ice')) {
                    type = 'hair_extension';
                }

                return {
                    type,
                    name: item.name,
                    amount: Number(item.total || item.amount || (item.price * (item.quantity || 1)) || 0),
                    category: item.category,
                    staffIds: item.staffIds || [],
                    staffSplits: item.staffSplits || []
                };
            });

            return {
                id: inv.id || inv.invoice_no,
                date: localDateStr,
                time: localTimeStr,
                amount: Number(inv.total_amount || 0),
                customerId: inv.customer_phone || '',
                customerName: inv.customer_name || 'Walk-in',
                branchId: invBranchId,
                items: mappedItems,
                paymentMethod: inv.payment_mode || 'cash'
            } as Transaction;
        });
    },

    addTransaction: async (transaction: Omit<Transaction, 'id' | 'branchId'> & { id?: string; branchId?: string }) => {
        const user = authService.getCurrentUser();
        const targetBranch = resolveBranchId(transaction.branchId || (user && user.branchId !== 'all' ? user.branchId : 'branch1'));

        const txId = transaction.id || `tx_${Date.now()}`;
        const newTx = {
            id: txId,
            date: transaction.date,
            time: transaction.time,
            amount: transaction.amount,
            customerId: transaction.customerId,
            customerName: transaction.customerName,
            branchId: targetBranch,
            items: transaction.items || [],
            paymentMethod: transaction.paymentMethod || 'cash',
            subtotal: transaction.subtotal,
            gst: transaction.gst,
            discount: transaction.discount
        };

        try {
            await setDoc(doc(db, 'transactions', txId), newTx);
        } catch (error) {
            console.error('Error adding transaction in Firestore:', error);
        }
    },

    updateTransaction: async (id: string, updates: Partial<Transaction>) => {
        try {
            await updateDoc(doc(db, 'transactions', id), updates);
        } catch (error) {
            console.error('Error updating transaction in Firestore:', error);
        }
    }
};
