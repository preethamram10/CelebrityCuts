import { authService } from './authService';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { getISTDateString } from '../utils/dateUtils';

export interface Customer {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    visitDate: Date | string;
    totalAmount: number;
    visitCount: number;
    source: string;
    branch: string;
    services: Array<{ name: string; quantity: number; price: number }>;
}

export const customerService = {
    getAllCustomers: async (): Promise<Customer[]> => {
        const user = authService.getCurrentUser();

        try {
            const snapshot = await getDocs(collection(db, 'customers'));
            let docs = snapshot.docs.map(docSnap => {
                const c = docSnap.data();
                const fullName = (c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim()) || 'Customer';
                return {
                    id: docSnap.id,
                    name: fullName,
                    firstName: c.first_name || fullName.split(' ')[0] || '',
                    lastName: c.last_name || fullName.split(' ').slice(1).join(' ') || '',
                    phoneNumber: c.phone_number || c.phoneNumber || '',
                    branch: c.branch_id || c.branchId || c.branch || 'branch1',
                    branchId: c.branch_id || c.branchId || c.branch || 'branch1',
                    visitCount: Number(c.visit_count || c.visitsCount || 1),
                    totalAmount: Number(c.total_amount || c.totalSpent || 0),
                    totalSpent: Number(c.total_amount || c.totalSpent || 0),
                    visitDate: c.visit_date || c.created_at || '',
                    source: c.source || 'Walk-in',
                    services: c.services || []
                } as any;
            });

            if (user && user.role !== 'admin' && user.branchId && user.branchId !== 'all') {
                const { isSameBranch } = await import('./authService');
                docs = docs.filter(c => isSameBranch(c.branch, user.branchId));
            }

            return docs;
        } catch (error) {
            console.error('Error fetching customers from Firestore:', error);
            return [];
        }
    },

    getCustomerByMobile: async (mobile: string): Promise<Customer | undefined> => {
        const user = authService.getCurrentUser();
        try {
            const cleanMobile = mobile.trim();
            const q = query(collection(db, 'customers'), where('phone_number', '==', cleanMobile));
            const snapshot = await getDocs(q);

            if (snapshot.empty) return undefined;

            let docSnap = snapshot.docs[0];
            if (user && user.branchId !== 'all') {
                const { isSameBranch } = await import('./authService');
                const branchMatch = snapshot.docs.find(d => isSameBranch(d.data().branch_id || d.data().branch, user.branchId));
                if (branchMatch) docSnap = branchMatch;
            }

            const data = docSnap.data();
            return {
                id: docSnap.id,
                firstName: data.first_name || '',
                lastName: data.last_name || '',
                phoneNumber: data.phone_number || '',
                branch: data.branch_id || data.branch || 'branch1',
                visitCount: data.visit_count || 1,
                totalAmount: data.total_amount || 0,
                visitDate: data.visit_date || '',
                source: data.source || 'Walk-in',
                services: data.services || []
            };
        } catch (error) {
            console.error('Error fetching customer by mobile from Firestore:', error);
            return undefined;
        }
    },

    processCheckout: async (mobile: string, name: string, amount: number): Promise<void> => {
        const user = authService.getCurrentUser();
        const currentBranch = user?.branchId || 'branch1';
        const nowStr = getISTDateString();
        const cleanMobile = mobile.trim();

        try {
            const q = query(
                collection(db, 'customers'),
                where('phone_number', '==', cleanMobile)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const { isSameBranch } = await import('./authService');
                const existingDoc = snapshot.docs.find(d => isSameBranch(d.data().branch_id || d.data().branch, currentBranch)) || snapshot.docs[0];
                const existing = existingDoc.data();
                const newTotal = Number(existing.total_amount || 0) + amount;
                const newCount = Number(existing.visit_count || 0) + 1;

                let updateData: any = {
                    total_amount: newTotal,
                    visit_count: newCount,
                    visit_date: nowStr
                };

                if (name && (!existing.first_name || existing.first_name === 'Unknown' || existing.first_name.trim() === '')) {
                    const nameParts = name.trim().split(' ');
                    updateData.first_name = nameParts[0];
                    updateData.last_name = nameParts.slice(1).join(' ');
                }

                await updateDoc(doc(db, 'customers', existingDoc.id), updateData);
            } else {
                const nameParts = (name || '').trim().split(' ');
                const custId = `c_${Date.now()}`;
                const newCustomer = {
                    id: custId,
                    first_name: nameParts[0] || 'Walk-in',
                    last_name: nameParts.slice(1).join(' ') || '',
                    phone_number: cleanMobile,
                    visit_date: nowStr,
                    total_amount: amount,
                    visit_count: 1,
                    branch_id: currentBranch
                };

                await setDoc(doc(db, 'customers', custId), newCustomer);
            }
        } catch (error) {
            console.error('Error updating customer during checkout in Firestore:', error);
        }
    }
};
