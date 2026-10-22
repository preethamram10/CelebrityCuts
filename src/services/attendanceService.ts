import { authService } from './authService';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { getISTDateString, getISTTimeString } from '../utils/dateUtils';

export interface AttendanceRecord {
    id?: string;
    date: string;
    checkIn: string;
    checkOut: string;
    status: 'Present' | 'Absent' | 'Late' | 'Leave';
    workHours: string;
    staffId: string;
    staffName: string;
    staffRole: string;
    branchId: string;
}

export const attendanceService = {
    getAllRecords: async (): Promise<AttendanceRecord[]> => {
        const user = authService.getCurrentUser();
        try {
            const snapshot = await getDocs(collection(db, 'attendance'));
            let docs = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            } as AttendanceRecord));

            if (user && user.role !== 'admin' && user.branchId && user.branchId !== 'all') {
                const { isSameBranch } = await import('./authService');
                docs = docs.filter(d => isSameBranch(d.branchId, user.branchId));
            }
            return docs;
        } catch (error) {
            console.error('Error fetching attendance from Firestore:', error);
            return [];
        }
    },

    getStaffRecords: async (staffId: string): Promise<AttendanceRecord[]> => {
        try {
            const qRef = query(collection(db, 'attendance'), where('staffId', '==', staffId));
            const snapshot = await getDocs(qRef);
            const list = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            } as AttendanceRecord));
            return list.sort((a, b) => b.date.localeCompare(a.date));
        } catch (error) {
            console.error('Error fetching staff attendance records from Firestore:', error);
            return [];
        }
    },

    getDateRecords: async (date: string): Promise<AttendanceRecord[]> => {
        const user = authService.getCurrentUser();
        try {
            const qRef = query(collection(db, 'attendance'), where('date', '==', date));
            const snapshot = await getDocs(qRef);
            let docs = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            } as AttendanceRecord));

            if (user && user.role !== 'admin' && user.branchId && user.branchId !== 'all') {
                const { isSameBranch } = await import('./authService');
                docs = docs.filter(d => isSameBranch(d.branchId, user.branchId));
            }
            return docs;
        } catch (error) {
            console.error('Error fetching date attendance from Firestore:', error);
            return [];
        }
    },

    checkIn: async (staffId: string, staffName: string, staffRole: string, explicitStatus?: 'Present' | 'Late' | 'Absent') => {
        const user = authService.getCurrentUser();
        const branchId = user?.branchId || 'branch1';
        const today = getISTDateString();
        const now = getISTTimeString();

        try {
            const qRef = query(
                collection(db, 'attendance'),
                where('staffId', '==', staffId),
                where('date', '==', today)
            );
            const existing = await getDocs(qRef);
            if (!existing.empty) return; // Already checked in

            let status: 'Present' | 'Late' | 'Absent' = 'Present';
            if (explicitStatus) {
                status = explicitStatus;
            } else {
                const isLate = new Date().getHours() > 10;
                status = isLate ? 'Late' : 'Present';
            }

            const attId = `att_${Date.now()}_${staffId}`;
            const newRecord: AttendanceRecord = {
                id: attId,
                date: today,
                checkIn: status === 'Absent' ? '--:--' : now,
                checkOut: '--:--',
                status: status,
                workHours: status === 'Absent' ? '0h' : 'Running',
                staffId,
                staffName,
                staffRole,
                branchId
            };

            await setDoc(doc(db, 'attendance', attId), newRecord);
        } catch (error) {
            console.error('Error in check-in Firestore:', error);
        }
    },

    checkOut: async (staffId: string) => {
        const today = getISTDateString();
        const now = getISTTimeString();

        try {
            const qRef = query(
                collection(db, 'attendance'),
                where('staffId', '==', staffId),
                where('date', '==', today)
            );
            const snapshot = await getDocs(qRef);

            if (!snapshot.empty) {
                const docSnap = snapshot.docs[0];
                const existing = docSnap.data();

                let calculatedHours = '0h 0m';
                if (existing.checkIn && existing.checkIn !== '--:--') {
                    try {
                        const parseMinutes = (timeStr: string) => {
                            const parts = timeStr.trim().split(' ');
                            const time = parts[0];
                            const period = (parts[1] || '').toUpperCase();
                            let [hours, minutes] = time.split(':').map(Number);
                            if (period === 'PM' && hours < 12) hours += 12;
                            if (period === 'AM' && hours === 12) hours = 0;
                            return hours * 60 + minutes;
                        };
                        const startMin = parseMinutes(existing.checkIn);
                        const endMin = parseMinutes(now);
                        let diffMin = endMin - startMin;
                        if (diffMin < 0) diffMin += 24 * 60;
                        const h = Math.floor(diffMin / 60);
                        const m = diffMin % 60;
                        calculatedHours = `${h}h ${m}m`;
                    } catch (e) {
                        calculatedHours = '8h 0m';
                    }
                }

                await updateDoc(doc(db, 'attendance', docSnap.id), {
                    checkOut: now,
                    workHours: calculatedHours
                });
            }
        } catch (error) {
            console.error('Error in check-out Firestore:', error);
        }
    },

    updateTime: async (recordId: string, type: 'checkIn' | 'checkOut', newTime: string) => {
        try {
            await updateDoc(doc(db, 'attendance', recordId), { [type]: newTime });
        } catch (error) {
            console.error('Error updating time in Firestore:', error);
        }
    }
};