import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { getISTDateString } from '../utils/dateUtils';
import { isSameBranch } from './authService';

export interface Appointment {
  id: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string; // YYYY-MM-DD in IST
  appointment_time: string; // HH:MM AM/PM
  target_branch_id: string; // 'branch1', 'branch2', 'branch3'
  target_branch_name: string; // 'Main Branch', 'Vizag Branch', 'Vijayawada Branch'
  booked_by_branch_id: string; // 'branch1', 'branch2', 'branch3'
  booked_by_branch_name: string; // e.g. 'Vizag Reception'
  notes?: string;
  status: 'pending' | 'visited' | 'cancelled';
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'celebrity_cuts_appointments';

const DEFAULT_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-101',
    customer_name: 'Suresh Verma',
    customer_phone: '9848022338',
    appointment_date: getISTDateString(),
    appointment_time: '11:00 AM',
    target_branch_id: 'branch2',
    target_branch_name: 'Vizag Branch',
    booked_by_branch_id: 'branch2',
    booked_by_branch_name: 'Vizag Reception',
    notes: 'Hair Styling & Beard Trim',
    status: 'pending',
    created_at: new Date().toISOString()
  },
  {
    id: 'apt-102',
    customer_name: 'K. Divya',
    customer_phone: '9440112233',
    appointment_date: getISTDateString(),
    appointment_time: '02:30 PM',
    target_branch_id: 'branch1',
    target_branch_name: 'Main Branch',
    booked_by_branch_id: 'branch2',
    booked_by_branch_name: 'Vizag Reception',
    notes: 'Booked by Vizag Reception for Main Branch - Hair Extension Consultation',
    status: 'pending',
    created_at: new Date().toISOString()
  },
  {
    id: 'apt-103',
    customer_name: 'P. Rajesh',
    customer_phone: '7013361677',
    appointment_date: getISTDateString(),
    appointment_time: '04:00 PM',
    target_branch_id: 'branch3',
    target_branch_name: 'Vijayawada Branch',
    booked_by_branch_id: 'branch3',
    booked_by_branch_name: 'Vijayawada Reception',
    notes: 'VIP Luxury Hair Spa',
    status: 'visited',
    created_at: new Date().toISOString()
  }
];

const getLocalAppointments = (): Appointment[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_APPOINTMENTS));
    return DEFAULT_APPOINTMENTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return DEFAULT_APPOINTMENTS;
  }
};

const saveLocalAppointments = (list: Appointment[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
};

export const appointmentService = {
  getAppointments: async (branchId?: string, dateStr?: string): Promise<Appointment[]> => {
    let list: Appointment[] = [];
    try {
      const snapshot = await getDocs(collection(db, 'appointments'));
      if (!snapshot.empty) {
        list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
        list.sort((a, b) => (a.appointment_time || '').localeCompare(b.appointment_time || ''));
        saveLocalAppointments(list);
      } else {
        list = getLocalAppointments();
      }
    } catch (e) {
      console.warn('Firestore appointments fetch offline or failed, using local storage:', e);
      list = getLocalAppointments();
    }

    // Filter by target branch
    if (branchId && branchId.toLowerCase() !== 'all') {
      list = list.filter(apt => isSameBranch(apt.target_branch_id, branchId));
    }

    // Filter by date if provided
    if (dateStr) {
      list = list.filter(apt => apt.appointment_date === dateStr);
    }

    return list;
  },

  createAppointment: async (appData: Omit<Appointment, 'id' | 'created_at' | 'status'>): Promise<Appointment> => {
    const newApt: Appointment = {
      ...appData,
      id: `apt-${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'appointments', newApt.id), newApt);
    } catch (e) {
      console.warn('Firestore appointment save failed, cached locally:', e);
    }

    const current = getLocalAppointments();
    const updated = [newApt, ...current.filter(a => a.id !== newApt.id)];
    saveLocalAppointments(updated);

    return newApt;
  },

  updateAppointment: async (id: string, updates: Partial<Appointment>): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'appointments', id), updates);
    } catch (e) {
      console.warn('Firestore update failed, fallback to local storage');
    }

    const current = getLocalAppointments();
    const updated = current.map(apt => apt.id === id ? { ...apt, ...updates } : apt);
    saveLocalAppointments(updated);

    return true;
  },

  updateStatus: async (id: string, newStatus: 'pending' | 'visited' | 'cancelled'): Promise<boolean> => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status: newStatus });
    } catch (e) {
      console.warn('Firestore status update failed, fallback to local storage');
    }

    const current = getLocalAppointments();
    const updated = current.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt);
    saveLocalAppointments(updated);

    return true;
  },

  deleteAppointment: async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'appointments', id));
    } catch (e) {}

    const current = getLocalAppointments();
    const updated = current.filter(apt => apt.id !== id);
    saveLocalAppointments(updated);

    return true;
  }
};
