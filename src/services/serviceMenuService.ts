import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { SERVICE_DATA } from '../pages/billing-staff/services-data';

export interface ServiceItem {
    id: string;
    name: string;
    price: number;
    duration: string;
    category: string;
}

export const serviceMenuService = {
    getAllServices: async (): Promise<ServiceItem[]> => {
        try {
            const snapshot = await getDocs(collection(db, 'services'));
            if (!snapshot.empty) {
                const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ServiceItem));
                list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                return list;
            }
        } catch (err) {
            console.warn('Firestore services fetch failed, using local service catalog fallback:', err);
        }

        // Fallback to rich pre-configured salon service menu
        return SERVICE_DATA.map(s => ({
            id: s.id,
            name: s.name,
            price: s.price,
            duration: '30 min',
            category: s.category || 'General'
        }));
    },

    addService: async (service: Omit<ServiceItem, 'id'>) => {
        try {
            const sId = `srv_${Date.now()}`;
            const newService: ServiceItem = {
                id: sId,
                ...service
            };
            await setDoc(doc(db, 'services', sId), newService);
            return newService;
        } catch (error) {
            console.error('Error adding service in Firestore:', error);
            throw error;
        }
    },

    updateService: async (id: string, updates: Partial<ServiceItem>) => {
        try {
            await updateDoc(doc(db, 'services', id), updates);
        } catch (error) {
            console.error('Error updating service in Firestore:', error);
            throw error;
        }
    },

    deleteService: async (id: string) => {
        try {
            await deleteDoc(doc(db, 'services', id));
        } catch (error) {
            console.error('Error deleting service in Firestore:', error);
            throw error;
        }
    },

    seedDefaultServices: async () => {
        try {
            for (const s of SERVICE_DATA) {
                await setDoc(doc(db, 'services', s.id), {
                    id: s.id,
                    name: s.name,
                    price: s.price,
                    duration: '30 min',
                    category: s.category || 'General'
                }, { merge: true });
            }
            return true;
        } catch (error) {
            console.error('Error seeding services into Firestore:', error);
            throw error;
        }
    }
};
