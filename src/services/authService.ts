import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
export interface User {
    id: string;
    username: string;
    role: 'admin' | 'manager' | 'billing';
    branchId: string;
    branchName: string;
    location?: string;
    mobile?: string;
    fullName?: string;
    sessionToken?: string;
    password?: string;
}
const STORAGE_KEY = 'crm_auth_user';

// LOCAL FALLBACK ACCOUNTS (0ms Login, Bypasses Network Timeouts)
export const HARDCODED_USERS: User[] = [
    {
        id: 'admin-id-v1',
        username: 'Admin',
        password: 'Nag@123',
        role: 'admin',
        branchId: 'all',
        branchName: 'All Branches',
        location: 'Head Office',
        fullName: 'Super Admin'
    },
    // BRANCH 1 - MAIN BRANCH (MADHURAVADA)
    {
        id: 'bm1-id-v1',
        username: 'branchmanager1',
        password: 'madbranch1@123',
        role: 'manager',
        branchId: 'branch1',
        branchName: 'Main Branch (Madhuravada)',
        location: 'Madhuravada',
        fullName: 'Branch Manager (Main Branch)'
    },
    {
        id: 'bill1-id-v1',
        username: 'branch1',
        password: 'bill1',
        role: 'billing',
        branchId: 'branch1',
        branchName: 'Main Branch (Madhuravada)',
        location: 'Madhuravada',
        fullName: 'Biller - Main Branch'
    },
    // BRANCH 2 - VIZAG BRANCH
    {
        id: 'vizag12-mgr-id',
        username: 'Vizag12',
        password: 'Vizag12',
        role: 'manager',
        branchId: 'branch2',
        branchName: 'Vizag Branch',
        location: 'Vizag',
        fullName: 'Branch Manager (Vizag)'
    },
    {
        id: 'vizag12-lower-mgr-id',
        username: 'vizag12',
        password: 'Vizag12',
        role: 'manager',
        branchId: 'branch2',
        branchName: 'Vizag Branch',
        location: 'Vizag',
        fullName: 'Branch Manager (Vizag)'
    },
    {
        id: 'bm2-id-v1',
        username: 'branchmanager2',
        password: 'madbranch2@123',
        role: 'manager',
        branchId: 'branch2',
        branchName: 'Vizag Branch',
        location: 'Vizag',
        fullName: 'Branch Manager (Vizag)'
    },
    {
        id: 'bm2-alias-v1',
        username: 'vizagmanager',
        password: 'madbranch2@123',
        role: 'manager',
        branchId: 'branch2',
        branchName: 'Vizag Branch',
        location: 'Vizag',
        fullName: 'Branch Manager (Vizag)'
    },
    {
        id: 'bill2-id-v1',
        username: 'branch2',
        password: 'bill2',
        role: 'billing',
        branchId: 'branch2',
        branchName: 'Vizag Branch',
        location: 'Vizag',
        fullName: 'Biller - Vizag Branch'
    },
    {
        id: 'bill2-alias-v1',
        username: 'vizagbilling',
        password: 'bill2',
        role: 'billing',
        branchId: 'branch2',
        branchName: 'Vizag Branch',
        location: 'Vizag',
        fullName: 'Biller - Vizag Branch'
    },
    // BRANCH 3 - VIJAYAWADA BRANCH
    {
        id: 'bm3-id-v1',
        username: 'branchmanager3',
        password: 'madbranch3@123',
        role: 'manager',
        branchId: 'branch3',
        branchName: 'Vijayawada Branch',
        location: 'Vijayawada',
        fullName: 'Branch Manager (Vijayawada)'
    },
    {
        id: 'bm3-alias-v1',
        username: 'vjwmanager',
        password: 'madbranch3@123',
        role: 'manager',
        branchId: 'branch3',
        branchName: 'Vijayawada Branch',
        location: 'Vijayawada',
        fullName: 'Branch Manager (Vijayawada)'
    },
    {
        id: 'bill3-id-v1',
        username: 'branch3',
        password: 'bill3',
        role: 'billing',
        branchId: 'branch3',
        branchName: 'Vijayawada Branch',
        location: 'Vijayawada',
        fullName: 'Biller - Vijayawada Branch'
    },
    {
        id: 'bill3-alias-v1',
        username: 'vjwbilling',
        password: 'bill3',
        role: 'billing',
        branchId: 'branch3',
        branchName: 'Vijayawada Branch',
        location: 'Vijayawada',
        fullName: 'Biller - Vijayawada Branch'
    },
    // BRANCH 4 - HYDERABAD BRANCH
    {
        id: 'bm4-id-v1',
        username: 'branch4',
        password: 'hydbranch4',
        role: 'manager',
        branchId: 'branch4',
        branchName: 'Hyderabad Branch',
        location: 'Hyderabad (Gachibowli)',
        fullName: 'Branch Manager (Hyderabad)'
    },
    {
        id: 'bm4-alias-v1',
        username: 'branchmanager4',
        password: 'hydbranch4',
        role: 'manager',
        branchId: 'branch4',
        branchName: 'Hyderabad Branch',
        location: 'Hyderabad (Gachibowli)',
        fullName: 'Branch Manager (Hyderabad)'
    },
    {
        id: 'bm4-alias-v2',
        username: 'hydmanager',
        password: 'hydbranch4',
        role: 'manager',
        branchId: 'branch4',
        branchName: 'Hyderabad Branch',
        location: 'Hyderabad (Gachibowli)',
        fullName: 'Branch Manager (Hyderabad)'
    },
    {
        id: 'bill4-id-v1',
        username: 'branch4',
        password: 'branch4',
        role: 'billing',
        branchId: 'branch4',
        branchName: 'Hyderabad Branch',
        location: 'Hyderabad (Gachibowli)',
        fullName: 'Biller - Hyderabad Branch'
    },
    {
        id: 'bill4-alias-v1',
        username: 'hydbilling',
        password: 'branch4',
        role: 'billing',
        branchId: 'branch4',
        branchName: 'Hyderabad Branch',
        location: 'Hyderabad (Gachibowli)',
        fullName: 'Biller - Hyderabad Branch'
    }
];

export interface BranchDetails {
    branchId: string;
    branchName: string;
    address: string;
    phone: string;
}

export const BRANCH_DETAILS: Record<string, BranchDetails> = {
    branch1: {
        branchId: 'branch1',
        branchName: 'Main Branch (Madhuravada)',
        address: '2nd floor, plot no.Hig-1262, beside Bank of Boroda, opp. Ramya Parasise Function Hall, Midhilapuri Vuda Colony, Pothinamallayya Palem, Madhuravada, Visakhapatnam, Andhra Pradesh 530041',
        phone: '77308 58858'
    },
    branch2: {
        branchId: 'branch2',
        branchName: 'Vizag Branch',
        address: '3rd floor, Rednam Gardens, Jail Rd, opposite Visakhapatnam, Rednam Garden Near Pydah Degree College, SBI Bank, Ram Nagar, Visakhapatnam, Andhra Pradesh',
        phone: '77308 58858'
    },
    branch3: {
        branchId: 'branch3',
        branchName: 'Vijayawada Branch',
        address: '17/2-9D, Funtime Rd, Gurunanak Nagar, RTC Colony, Vijayawada, Andhra Pradesh 520008',
        phone: '9666441144'
    },
    branch4: {
        branchId: 'branch4',
        branchName: 'Hyderabad Branch',
        address: 'BKR Enterprises, Plot No. 128, Survey Nos. 55, 56, 57 & 58, 3rd Floor, HK Hospitals, Lumbini Enclave, Gachibowli, Ranga Reddy District, Hyderabad - 500 032',
        phone: '77308 58858'
    }
};

export const resolveBranchId = (invOrBranch?: any): string => {
    if (!invOrBranch) return 'branch1';

    let invNo = '';
    let invBranchId = '';
    let custName = '';

    if (typeof invOrBranch === 'object' && invOrBranch !== null) {
        invNo = (invOrBranch.invoice_no || invOrBranch.invoiceNo || invOrBranch.id || '').toLowerCase();
        invBranchId = (invOrBranch.branch_id || invOrBranch.branchId || '').toLowerCase();
        custName = (invOrBranch.customer_name || invOrBranch.customerName || '').toLowerCase();
    } else {
        invNo = String(invOrBranch || '').toLowerCase();
        invBranchId = invNo;
    }

    // 0. Hyderabad (Branch 4)
    if (
        invBranchId === 'branch4' || invBranchId.includes('branch4') || invBranchId.includes('hyderabad') || invBranchId.includes('hyd') || invBranchId.includes('gachibowli') ||
        invNo.endsWith('_branch4') || invNo.includes('branch4') || invNo.includes('hyderabad') || invNo.includes('hyd') || invNo.includes('gachibowli') ||
        custName.includes('(hyderabad)') || custName.includes('(hyd)')
    ) {
        return 'branch4';
    }

    // 1. Vijayawada (Branch 3)
    // Suffix: _1001, branchId: branch3 / 1001 / vjw / vijayawada
    if (
        invBranchId === 'branch3' || invBranchId === '1001' || invBranchId.includes('branch3') || invBranchId.includes('vijayawada') || invBranchId.includes('vjw') ||
        invNo.endsWith('_1001') || invNo.includes('_1001_') || invNo.endsWith('_branch3') || invNo.includes('branch3') || invNo.includes('vijayawada') || invNo.includes('vjw') ||
        custName.includes('(vijayawada)') || custName.includes('(vjw)')
    ) {
        return 'branch3';
    }

    // 2. Vizag (Branch 2)
    // Suffix: _598, _branch2, branchId: branch2 / 598 / vizag / gajuwaka
    if (
        invBranchId === 'branch2' || invBranchId === '598' || invBranchId.includes('branch2') || invBranchId.includes('vizag') || invBranchId.includes('gajuwaka') ||
        invNo.endsWith('_598') || invNo.includes('_598_') || invNo.endsWith('_branch2') || invNo.includes('branch2') || invNo.includes('vizag') || invNo.includes('gajuwaka') ||
        custName.includes('(vizag)') || custName.includes('(gajuwaka)')
    ) {
        return 'branch2';
    }

    // 3. Main Branch / Madhuravada (Branch 1)
    // Suffix: _branch1, branchId: branch1 / main / madhuravada
    if (
        invBranchId === 'branch1' || invBranchId.includes('branch1') || invBranchId.includes('madhuravada') || invBranchId.includes('main') ||
        invNo.endsWith('_branch1') || invNo.includes('branch1') || invNo.includes('madhuravada') || invNo.includes('main') ||
        custName.includes('(main)')
    ) {
        return 'branch1';
    }

    // 4. Default fallback if specific ID provided
    if (invBranchId && invBranchId !== 'all') {
        return invBranchId;
    }

    return 'branch1';
};

export const isSameBranch = (invOrBranch?: any, userBranch?: string): boolean => {
    if (!invOrBranch || !userBranch) return false;
    if (userBranch.toLowerCase() === 'all') return true;

    // Normalize active user's branch target
    const uNorm = userBranch.toLowerCase().trim();
    let targetBranch = uNorm;
    if (uNorm.includes('branch4') || uNorm.includes('hyd') || uNorm.includes('hyderabad') || uNorm.includes('gachibowli')) {
        targetBranch = 'branch4';
    } else if (uNorm.includes('branch3') || uNorm.includes('vjw') || uNorm.includes('vijayawada') || uNorm === '1001') {
        targetBranch = 'branch3';
    } else if (uNorm.includes('branch2') || uNorm.includes('vizag') || uNorm === '598' || uNorm.includes('vizag12')) {
        targetBranch = 'branch2';
    } else if (uNorm.includes('branch1') || uNorm.includes('main') || uNorm.includes('madhuravada')) {
        targetBranch = 'branch1';
    }

    // Direct match if exact ID matches target
    let invBranchId = '';
    if (typeof invOrBranch === 'object' && invOrBranch !== null) {
        invBranchId = (invOrBranch.branch_id || invOrBranch.branchId || '').toLowerCase();
    } else {
        invBranchId = String(invOrBranch || '').toLowerCase();
    }
    if (invBranchId && (invBranchId === targetBranch || invBranchId === uNorm)) {
        return true;
    }

    // Resolve branch of invoice and test strict equality
    const actualBranch = resolveBranchId(invOrBranch);
    return actualBranch === targetBranch;
};

export const authService = {
    getBranchDetails: (invOrBranch?: any): BranchDetails => {
        const branchKey = resolveBranchId(invOrBranch);
        if (BRANCH_DETAILS[branchKey]) {
            return BRANCH_DETAILS[branchKey];
        }

        // If untagged, check active logged-in user branch
        const currentUser = authService.getCurrentUser();
        if (currentUser && currentUser.branchId) {
            const uKey = resolveBranchId(currentUser.branchId);
            if (BRANCH_DETAILS[uKey]) {
                return BRANCH_DETAILS[uKey];
            }
        }

        return BRANCH_DETAILS.branch1;
    },

    login: async (username: string, password: string): Promise<User | null> => {
        const cleanUser = username.trim().toLowerCase();
        const cleanPass = password.trim();

        // 1. Instant Local Check (0ms Delay)
        const localUser = HARDCODED_USERS.find(
            u => u.username.toLowerCase() === cleanUser && (u.password === cleanPass || u.password === password)
        );

        if (localUser) {
            return authService.finalizeLogin(localUser);
        }

        // 2. Fallback to Firestore Database (if not in local hardcoded list)
        try {
            const q = query(
                collection(db, 'profiles'),
                where('username', '==', username),
                where('password', '==', password)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const profileData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as User;
                return authService.finalizeLogin(profileData);
            }
        } catch (e) {
            console.warn('Firestore profile login query error:', e);
        }

        throw new Error("Invalid username or password");
    },

    finalizeLogin: async (profileData: User): Promise<User> => {
        const sessionToken = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const activeUser: User = { ...profileData, sessionToken };
        delete activeUser.password;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeUser));
        return activeUser;
    },

    sendOtp: async (email: string) => {
        console.warn("OTP bypass: Simulated send to ", email);
        sessionStorage.setItem('temp_otp_email', email);
        return true;
    },

    verifyOtp: async (_code: string): Promise<User | null> => {
        console.error("OTP Verification not supported in offline mode");
        return null;
    },

    checkSessionValidity: async (_userId: string, _localToken: string): Promise<boolean> => {
        return true;
    },

    logout: () => {
        localStorage.removeItem(STORAGE_KEY);
    },

    getCurrentUser: (): User | null => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return null;
            const parsed = JSON.parse(stored) as User;

            // Re-resolve branchId and branchName if missing or mismatched from username
            if (parsed && parsed.username) {
                const matchedHardcoded = HARDCODED_USERS.find(
                    u => u.username.toLowerCase() === parsed.username.toLowerCase() && (!parsed.role || u.role === parsed.role)
                );
                if (matchedHardcoded) {
                    parsed.branchId = matchedHardcoded.branchId;
                    parsed.branchName = matchedHardcoded.branchName;
                }
            }

            return parsed;
        } catch (error) {
            console.error('Failed to parse user from local storage:', error);
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    },

    getAllBranches: async (): Promise<User[]> => {
        let dbBranches: User[] = [];
        try {
            const q = query(collection(db, 'profiles'), where('role', '==', 'manager'));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                dbBranches = snapshot.docs.map(docSnap => {
                    const p = docSnap.data();
                    const { password, ...safeData } = p as any;
                    return { id: docSnap.id, ...safeData } as User;
                });
            }
        } catch (err) {
            console.warn("Firestore branches fetch failed, using local branches.");
        }

        // Standard Hardcoded Managers (Unique by branchId)
        const hardcodedManagers = HARDCODED_USERS
            .filter(u => u.role === 'manager')
            .filter((u, index, self) => index === self.findIndex(t => t.branchId === u.branchId));

        // Deduplicate branches by branchId so each branch appears exactly once
        const branchMap = new Map<string, User>();
        dbBranches.forEach(b => {
            const bKey = (b.branchId || b.id || '').toLowerCase();
            if (bKey && !branchMap.has(bKey)) {
                branchMap.set(bKey, b);
            }
        });

        hardcodedManagers.forEach(hm => {
            const bKey = (hm.branchId || '').toLowerCase();
            if (bKey && !branchMap.has(bKey)) {
                branchMap.set(bKey, hm);
            }
        });

        return Array.from(branchMap.values());
    },

    createBranchUser: async (branchData: any) => {
        const newBranchId = branchData.branchId || `branch_${Date.now()}`;

        // 1. Create Manager Profile
        const managerId = `mgr-${Date.now()}`;
        const managerProfile = {
            id: managerId,
            username: branchData.username,
            password: branchData.password,
            role: 'manager',
            branchId: newBranchId,
            branchName: branchData.branchName,
            location: branchData.location,
            mobile: branchData.mobile,
            fullName: branchData.managerName
        };

        // 2. Create Billing Profile
        const billingId = `bill-${Date.now()}`;
        const billingProfile = {
            id: billingId,
            username: branchData.billingUsername,
            password: branchData.billingPassword,
            role: 'billing',
            branchId: newBranchId,
            branchName: branchData.branchName,
            location: branchData.location,
            mobile: branchData.mobile,
            fullName: `Biller - ${branchData.branchName}`
        };

        // 3. Save to Firestore
        try {
            await setDoc(doc(db, 'profiles', managerId), managerProfile);
            await setDoc(doc(db, 'profiles', billingId), billingProfile);
            return { success: true };
        } catch (insertError: any) {
            console.error('Error creating branch users in Firestore:', insertError);
            throw new Error('Failed to create branch users: ' + insertError.message);
        }
    }
};