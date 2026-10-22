import { authService } from './authService';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { getISTDateString } from '../utils/dateUtils';

export interface Staff {
    id: string;
    name: string;
    role: string;
    mobile: string;
    branchId: string;
    status: 'Active' | 'Inactive';
    joinDate: string;
}

const getSampleStaff = (branchId?: string): Staff[] => {
    const allSample: Staff[] = [
        // Branch 1 - Main Branch
        { id: 'staff-mouni', name: 'Mounika', role: 'Senior Hairdresser', mobile: '9849011111', branchId: 'branch1', status: 'Active', joinDate: '2026-01-01' },
        { id: 'staff-divya', name: 'Divya', role: 'Beautician', mobile: '9849022222', branchId: 'branch1', status: 'Active', joinDate: '2026-01-01' },
        { id: 'staff-biman', name: 'Biman', role: 'Extension Specialist', mobile: '9849033333', branchId: 'branch1', status: 'Active', joinDate: '2026-01-01' },
        { id: 'staff-krupa', name: 'Krupa', role: 'Facial Specialist', mobile: '9849044444', branchId: 'branch1', status: 'Active', joinDate: '2026-01-01' },

        // Branch 2 - Vizag Branch
        { id: 'staff-vizag-1', name: 'Satish Varma', role: 'Senior Stylist', mobile: '9949011221', branchId: 'branch2', status: 'Active', joinDate: '2026-01-01' },
        { id: 'staff-vizag-2', name: 'Priya Sharma', role: 'Beautician', mobile: '9949022332', branchId: 'branch2', status: 'Active', joinDate: '2026-01-01' },

        // Branch 3 - Vijayawada Branch
        { id: 'staff-vjw-1', name: 'Venkatesh Naidu', role: 'Super Sr. Unisex Hairdresser', mobile: '9949011223', branchId: 'branch3', status: 'Active', joinDate: '2026-01-01' },
        { id: 'staff-vjw-2', name: 'Lakshmi Prasanna', role: 'Senior Beautician', mobile: '9949022334', branchId: 'branch3', status: 'Active', joinDate: '2026-01-01' },
        { id: 'staff-vjw-3', name: 'Ramesh Babu', role: 'Stylist', mobile: '9949033445', branchId: 'branch3', status: 'Active', joinDate: '2026-01-01' },

        // Branch 4 - Hyderabad Branch
        { id: 'staff-hyd-1', name: 'Sai Kiran', role: 'Senior Stylist', mobile: '9949011225', branchId: 'branch4', status: 'Active', joinDate: '2026-01-01' },
        { id: 'staff-hyd-2', name: 'Anusha Reddy', role: 'Senior Beautician', mobile: '9949022336', branchId: 'branch4', status: 'Active', joinDate: '2026-01-01' },
        { id: 'staff-hyd-3', name: 'Rahul Varma', role: 'Hair Extension Specialist', mobile: '9949033447', branchId: 'branch4', status: 'Active', joinDate: '2026-01-01' }
    ];

    if (!branchId || branchId === 'all') return allSample;
    const target = branchId.toLowerCase();
    let bKey = 'branch1';
    if (target.includes('branch4') || target.includes('hyd') || target.includes('hyderabad') || target.includes('gachibowli')) bKey = 'branch4';
    else if (target.includes('branch3') || target.includes('vjw') || target.includes('vijayawada')) bKey = 'branch3';
    else if (target.includes('branch2') || target.includes('vizag')) bKey = 'branch2';

    return allSample.filter(s => s.branchId === bKey);
};

export const staffService = {
    getAllStaff: async (): Promise<Staff[]> => {
        try {
            const snapshot = await getDocs(collection(db, 'staff'));
            if (!snapshot.empty) {
                return snapshot.docs.map(d => {
                    const s = d.data();
                    return {
                        id: d.id,
                        name: s.name,
                        role: s.role,
                        mobile: s.mobile,
                        branchId: s.branchId || s.branch_id || 'branch1',
                        status: s.status || 'Active',
                        joinDate: s.join_date || s.joinDate || '2026-01-01'
                    } as Staff;
                });
            }
        } catch (err) {
            console.warn('Error fetching all staff from Firestore, using sample data:', err);
        }
        return getSampleStaff('all');
    },

    getStaffByBranch: async (branchId?: string): Promise<Staff[]> => {
        let targetBranch = branchId;

        if (!targetBranch) {
            const user = authService.getCurrentUser();
            if (user && user.branchId !== 'all') {
                targetBranch = user.branchId;
            }
        }

        try {
            const snapshot = await getDocs(collection(db, 'staff'));
            if (!snapshot.empty) {
                let allStaff = snapshot.docs.map(d => {
                    const s = d.data();
                    return {
                        id: d.id,
                        name: s.name || '',
                        role: s.role || 'Stylist',
                        mobile: s.mobile || '',
                        branchId: s.branchId || s.branch_id || 'branch1',
                        status: s.status || 'Active',
                        joinDate: s.join_date || s.joinDate || '2026-01-01'
                    } as Staff;
                });

                if (targetBranch && targetBranch !== 'all') {
                    const { isSameBranch } = await import('./authService');
                    allStaff = allStaff.filter(s => isSameBranch(s.branchId, targetBranch));
                }

                return allStaff;
            }
        } catch (err) {
            console.warn('Error fetching staff by branch from Firestore:', err);
        }

        return getSampleStaff(targetBranch);
    },

    addStaff: async (staff: Omit<Staff, 'id' | 'branchId' | 'joinDate'>) => {
        const user = authService.getCurrentUser();
        const join_date = getISTDateString();
        const staffId = `s_${Date.now()}`;

        const newStaff: Staff = {
            id: staffId,
            name: staff.name,
            role: staff.role,
            mobile: staff.mobile,
            branchId: user?.branchId || 'branch1',
            status: staff.status,
            joinDate: join_date
        };

        try {
            await setDoc(doc(db, 'staff', staffId), {
                ...newStaff,
                join_date
            });
            return newStaff;
        } catch (error) {
            console.error('Error adding staff in Firestore:', error);
            throw error;
        }
    },

    updateStaff: async (id: string, updates: Partial<Staff>) => {
        try {
            const dbUpdates: any = { ...updates };
            if (updates.joinDate) {
                dbUpdates.join_date = updates.joinDate;
            }
            await updateDoc(doc(db, 'staff', id), dbUpdates);
        } catch (error) {
            console.error('Error updating staff in Firestore:', error);
        }
    },

    deleteStaff: async (id: string) => {
        try {
            await updateDoc(doc(db, 'staff', id), { status: 'Inactive' });
        } catch (error) {
            console.error('Error deleting staff in Firestore:', error);
        }
    }
};