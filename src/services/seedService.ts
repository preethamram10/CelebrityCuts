import { db } from '../lib/firebase';
import { doc, setDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { SERVICE_DATA } from '../pages/billing-staff/services-data';
import { authService } from './authService';

export const INITIAL_STAFF = [
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

export const INITIAL_HAIR_EXTENSIONS = [
    { id: 'clip16', name: 'Clip-on 16 Inch', price: 16000, category: 'Hair Extensions', stock: 15 },
    { id: 'clip18', name: 'Clip-on 18 Inch', price: 18000, category: 'Hair Extensions', stock: 15 },
    { id: 'clip20', name: 'Clip-on 20 Inch', price: 20000, category: 'Hair Extensions', stock: 15 },
    { id: 'clip22', name: 'Clip-on 22 Inch', price: 22000, category: 'Hair Extensions', stock: 15 },
    { id: 'clip24', name: 'Clip-on 24 Inch', price: 24000, category: 'Hair Extensions', stock: 15 },
    { id: 'tape16', name: 'Tape-in 16 Inch', price: 18000, category: 'Hair Extensions', stock: 20 },
    { id: 'tape18', name: 'Tape-in 18 Inch', price: 20000, category: 'Hair Extensions', stock: 20 },
    { id: 'tape20', name: 'Tape-in 20 Inch', price: 22000, category: 'Hair Extensions', stock: 20 },
    { id: 'tape22', name: 'Tape-in 22 Inch', price: 24000, category: 'Hair Extensions', stock: 20 },
    { id: 'micro18', name: 'Micro-Ring 18 Inch', price: 21000, category: 'Hair Extensions', stock: 12 },
    { id: 'micro20', name: 'Micro-Ring 20 Inch', price: 23000, category: 'Hair Extensions', stock: 12 },
    { id: 'micro22', name: 'Micro-Ring 22 Inch', price: 25000, category: 'Hair Extensions', stock: 12 },
    { id: 'itip18', name: 'I-Tip 18 Inch', price: 22000, category: 'Hair Extensions', stock: 18 },
    { id: 'itip20', name: 'I-Tip 20 Inch', price: 24000, category: 'Hair Extensions', stock: 18 },
    { id: 'itip22', name: 'I-Tip 22 Inch', price: 26000, category: 'Hair Extensions', stock: 18 },
    { id: 'hf18', name: 'Hot-Fusion 18 Inch', price: 24000, category: 'Hair Extensions', stock: 10 },
    { id: 'hf20', name: 'Hot-Fusion 20 Inch', price: 26000, category: 'Hair Extensions', stock: 10 },
    { id: 'hf22', name: 'Hot-Fusion 22 Inch', price: 28000, category: 'Hair Extensions', stock: 10 },
    { id: 'ice50_16', name: 'Luxury Ice 50g - 16 Inch', price: 17000, category: 'Hair Extensions', stock: 8 },
    { id: 'ice50_18', name: 'Luxury Ice 50g - 18 Inch', price: 18000, category: 'Hair Extensions', stock: 8 },
    { id: 'ice50_20', name: 'Luxury Ice 50g - 20 Inch', price: 19000, category: 'Hair Extensions', stock: 8 }
];

export const INITIAL_CUSTOMERS = [
    { id: 'cust-1', name: 'Ananya Rao', phoneNumber: '9848012345', phone_number: '9848012345', first_name: 'Ananya', last_name: 'Rao', branchId: 'branch1', branch_id: 'branch1', visitsCount: 5, totalSpent: 18500, total_amount: 18500 },
    { id: 'cust-2', name: 'Vikram Reddy', phoneNumber: '9848023456', phone_number: '9848023456', first_name: 'Vikram', last_name: 'Reddy', branchId: 'branch1', branch_id: 'branch1', visitsCount: 3, totalSpent: 12400, total_amount: 12400 },
    { id: 'cust-3', name: 'Sneha Patel', phoneNumber: '9848034567', phone_number: '9848034567', first_name: 'Sneha', last_name: 'Patel', branchId: 'branch2', branch_id: 'branch2', visitsCount: 2, totalSpent: 8200, total_amount: 8200 },
    { id: 'cust-4', name: 'Karthik Krishna', phoneNumber: '9848045678', phone_number: '9848045678', first_name: 'Karthik', last_name: 'Krishna', branchId: 'branch3', branch_id: 'branch3', visitsCount: 4, totalSpent: 15600, total_amount: 15600 }
];

export const INITIAL_BRANCH_LIST = [
    {
        branchId: 'branch1',
        id: 'branch1',
        branchName: 'Main Branch',
        name: 'Main Branch (Madhuravada)',
        address: '2nd floor, plot no.Hig-1262, beside Bank of Boroda, opp. Ramya Parasise Function Hall, Midhilapuri Vuda Colony, Pothinamallayya Palem, Madhuravada, Visakhapatnam, Andhra Pradesh 530041',
        phone: '77308 58858',
        location: 'Visakhapatnam (Madhuravada)',
        manager: 'Branch Manager 1'
    },
    {
        branchId: 'branch2',
        id: 'branch2',
        branchName: 'Vizag Branch',
        name: 'Vizag Branch (Gajuwaka)',
        address: 'Beside Honda Showroom, Main Road, Gajuwaka, Visakhapatnam, Andhra Pradesh 530026',
        phone: '77308 58859',
        location: 'Visakhapatnam (Gajuwaka)',
        manager: 'Satish Varma'
    },
    {
        branchId: 'branch3',
        id: 'branch3',
        branchName: 'Vijayawada Branch',
        name: 'Vijayawada Branch (Benz Circle)',
        address: 'Near Benz Circle, MG Road, Vijayawada, Andhra Pradesh 520010',
        phone: '77308 58860',
        location: 'Vijayawada (Benz Circle)',
        manager: 'Venkatesh Naidu'
    },
    {
        branchId: 'branch4',
        id: 'branch4',
        branchName: 'Hyderabad Branch',
        name: 'Hyderabad Branch (Gachibowli)',
        address: 'BKR Enterprises, Plot No. 128, Survey Nos. 55, 56, 57 & 58, 3rd Floor, HK Hospitals, Lumbini Enclave, Gachibowli, Ranga Reddy District, Hyderabad - 500 032',
        phone: '77308 58858',
        location: 'Hyderabad (Gachibowli)',
        manager: 'Branch Manager (Hyderabad)'
    }
];

export const seedService = {
    seedAll: async (onProgress?: (msg: string) => void): Promise<{ success: boolean; summary: any }> => {
        const summary = {
            services: 0,
            staff: 0,
            hairExtensions: 0,
            branches: 0,
            customers: 0
        };

        try {
            // 1. Seed Services (in batches of 400 for Firestore 500-op limit)
            onProgress?.(`Starting Services seeding (${SERVICE_DATA.length} services)...`);
            let batch = writeBatch(db);
            let count = 0;

            for (const s of SERVICE_DATA) {
                const sRef = doc(db, 'services', s.id);
                batch.set(sRef, {
                    id: s.id,
                    name: s.name,
                    price: s.price,
                    duration: '30 min',
                    category: s.category || 'General',
                    updated_at: new Date().toISOString()
                }, { merge: true });
                count++;

                if (count % 350 === 0) {
                    await batch.commit();
                    batch = writeBatch(db);
                }
            }
            if (count % 350 !== 0) {
                await batch.commit();
            }
            summary.services = count;
            onProgress?.(`✓ Seeded ${count} Services successfully.`);

            // 2. Seed Staff
            onProgress?.(`Starting Staff seeding (${INITIAL_STAFF.length} staff)...`);
            const staffBatch = writeBatch(db);
            for (const st of INITIAL_STAFF) {
                staffBatch.set(doc(db, 'staff', st.id), {
                    ...st,
                    updated_at: new Date().toISOString()
                }, { merge: true });
            }
            await staffBatch.commit();
            summary.staff = INITIAL_STAFF.length;
            onProgress?.(`✓ Seeded ${INITIAL_STAFF.length} Staff members.`);

            // 3. Seed Hair Extensions
            onProgress?.(`Starting Hair Extensions seeding...`);
            const extBatch = writeBatch(db);
            for (const ext of INITIAL_HAIR_EXTENSIONS) {
                extBatch.set(doc(db, 'hair_extensions', ext.id), {
                    ...ext,
                    updated_at: new Date().toISOString()
                }, { merge: true });
            }
            await extBatch.commit();
            summary.hairExtensions = INITIAL_HAIR_EXTENSIONS.length;
            onProgress?.(`✓ Seeded ${INITIAL_HAIR_EXTENSIONS.length} Hair Extensions items.`);

            // 4. Seed Branches
            onProgress?.(`Starting Branches seeding...`);
            const branchBatch = writeBatch(db);
            for (const br of INITIAL_BRANCH_LIST) {
                branchBatch.set(doc(db, 'branches', br.branchId), {
                    ...br,
                    updated_at: new Date().toISOString()
                }, { merge: true });
            }
            await branchBatch.commit();
            summary.branches = INITIAL_BRANCH_LIST.length;
            onProgress?.(`✓ Seeded ${INITIAL_BRANCH_LIST.length} Branches.`);

            // 5. Seed Starter Customers
            onProgress?.(`Starting Customers seeding...`);
            const custBatch = writeBatch(db);
            for (const cu of INITIAL_CUSTOMERS) {
                custBatch.set(doc(db, 'customers', cu.id), {
                    ...cu,
                    created_at: new Date().toISOString()
                }, { merge: true });
            }
            await custBatch.commit();
            summary.customers = INITIAL_CUSTOMERS.length;
            onProgress?.(`✓ Seeded ${INITIAL_CUSTOMERS.length} Customers.`);

            // 6. Seed User Profiles into Firestore
            onProgress?.(`Starting User Profiles seeding...`);
            const { HARDCODED_USERS } = await import('./authService');
            const userBatch = writeBatch(db);
            for (const usr of HARDCODED_USERS) {
                userBatch.set(doc(db, 'profiles', usr.id), {
                    ...usr,
                    created_at: new Date().toISOString()
                }, { merge: true });
            }
            await userBatch.commit();
            onProgress?.(`✓ Seeded ${HARDCODED_USERS.length} User Profiles into Firestore.`);

            onProgress?.('All Firebase Firestore collections created and synchronized!');
            return { success: true, summary };
        } catch (error: any) {
            console.error('Error during full seeding:', error);
            onProgress?.(`Error: ${error.message}`);
            throw error;
        }
    }
};
