import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyAT7ZQsAL2a_JoyJx-Aw4CjrlFd2GmOfMc',
    authDomain: 'cccuts-eccaa.firebaseapp.com',
    projectId: 'cccuts-eccaa',
    storageBucket: 'cccuts-eccaa.firebasestorage.app',
    messagingSenderId: '228632809525',
    appId: '1:228632809525:web:0fc20666d87098bc98e17c'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runAudit() {
    console.log('--- STARTING FIRESTORE COMPREHENSIVE AUDIT ---');
    const collections = [
        'customers',
        'staff',
        'services',
        'hair_extensions',
        'invoices',
        'transactions',
        'branches',
        'appointments',
        'attendance',
        'profiles'
    ];

    for (const name of collections) {
        try {
            const snap = await getDocs(collection(db, name));
            console.log(`[PASS] Collection '${name}': ${snap.size} records found.`);
            if (name === 'appointments' && snap.size === 0) {
                const { setDoc, doc } = await import('firebase/firestore');
                const today = new Date().toISOString().split('T')[0];
                const sampleApts = [
                    { id: 'apt-101', customer_name: 'Suresh Verma', customer_phone: '9848022338', appointment_date: today, appointment_time: '11:00 AM', target_branch_id: 'branch2', target_branch_name: 'Vizag Branch', booked_by_branch_id: 'branch2', booked_by_branch_name: 'Vizag Reception', notes: 'Hair Styling & Beard Trim', status: 'pending', created_at: new Date().toISOString() },
                    { id: 'apt-102', customer_name: 'K. Divya', customer_phone: '9440112233', appointment_date: today, appointment_time: '02:30 PM', target_branch_id: 'branch1', target_branch_name: 'Main Branch', booked_by_branch_id: 'branch2', booked_by_branch_name: 'Vizag Reception', notes: 'Hair Extension Consultation', status: 'pending', created_at: new Date().toISOString() },
                    { id: 'apt-103', customer_name: 'P. Rajesh', customer_phone: '7013361677', appointment_date: today, appointment_time: '04:00 PM', target_branch_id: 'branch3', target_branch_name: 'Vijayawada Branch', booked_by_branch_id: 'branch3', booked_by_branch_name: 'Vijayawada Reception', notes: 'VIP Luxury Hair Spa', status: 'visited', created_at: new Date().toISOString() }
                ];
                for (const a of sampleApts) {
                    await setDoc(doc(db, 'appointments', a.id), a);
                }
                console.log(`[PASS] Seeded initial ${sampleApts.length} appointments to Firestore.`);
            }
        } catch (e) {
            console.error(`[FAIL] Collection '${name}':`, e.message);
        }
    }
    console.log('--- AUDIT COMPLETE ---');
    process.exit(0);
}

runAudit();
