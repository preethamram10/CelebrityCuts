import { useState, useEffect } from 'react';
import HeaderWithLogo from '../../components/HeaderWithLogo';
import Sidebar from '../../components/Sidebar';
import { Search, Edit } from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { customerService } from '../../services/customerService';
import { authService, isSameBranch } from '../../services/authService';

interface CustomerData {
    firstName: string;
    lastName: string;
    mobile: string;
    visits: number;
    lastVisit: string;
    source: string;
    totalPurchaseValue: number; // Added
}

interface CustomersProps {
    onLogout: () => void;
    userRole?: 'manager' | 'billing' | 'admin'; // Added admin for safety
}

export default function Customers({ onLogout, userRole = 'manager' }: CustomersProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [letterFilter, setLetterFilter] = useState('All');
    const [periodFilter, setPeriodFilter] = useState<'this_month' | 'last_month' | 'all'>('this_month');
    const [customers, setCustomers] = useState<CustomerData[]>([]);

    useEffect(() => {
        loadData(periodFilter);
    }, [periodFilter]);

    const loadData = async (period: 'this_month' | 'last_month' | 'all' = periodFilter) => {
        // 1. Get Current User Branch ID
        const user = authService.getCurrentUser();
        const currentBranchId = user?.branchId;

        // 2. Get all transactions (Service already attempts to filter by branch)
        const allTransactions = await transactionService.getAllTransactions();

        // 3. Robust Filter: Normalize strings to avoid case mismatch ('Branch1' vs 'branch1')
        // If user is 'admin' (all), they see everything.
        // If 'manager', ensure we act strictly but allow case-insensitive match just in case.
        let branchTransactions = allTransactions;

        if (user && user.role !== 'admin' && currentBranchId && currentBranchId.toLowerCase() !== 'all') {
            branchTransactions = allTransactions.filter(t => isSameBranch(t.branchId, currentBranchId));
        }

        // 4. Period Filter
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const thisMonthKey = `${y}-${m}`;
        const lastMDate = new Date(y, today.getMonth() - 1, 1);
        const lastMonthKey = `${lastMDate.getFullYear()}-${String(lastMDate.getMonth() + 1).padStart(2, '0')}`;

        if (period === 'this_month') {
            branchTransactions = branchTransactions.filter(t => (t.date || '').startsWith(thisMonthKey));
        } else if (period === 'last_month') {
            branchTransactions = branchTransactions.filter(t => (t.date || '').startsWith(lastMonthKey));
        }

        // 5. Aggregate from branch transactions
        const customerMap = new Map<string, {
            firstName: string,
            lastName: string,
            visits: number,
            lastVisitDate: Date,
            source: string,
            totalValue: number
        }>();

        branchTransactions.forEach(t => {
            const phone = t.customerId || 'Unknown';
            const fullName = t.customerName || 'Customer';
            const nameParts = fullName.trim().split(' ');
            const firstName = nameParts[0] || 'Customer';
            const lastName = nameParts.slice(1).join(' ') || '';

            const txDate = new Date(t.date);
            const txAmount = Number(t.amount) || 0;

            if (customerMap.has(phone)) {
                const existing = customerMap.get(phone)!;
                existing.visits += 1;
                existing.totalValue += txAmount;
                if (txDate > existing.lastVisitDate) {
                    existing.lastVisitDate = txDate;
                    existing.firstName = firstName;
                    existing.lastName = lastName;
                }
            } else {
                customerMap.set(phone, {
                    firstName,
                    lastName,
                    visits: 1,
                    lastVisitDate: txDate,
                    source: 'Walk-in',
                    totalValue: txAmount
                });
            }
        });

        // 6. When viewing 'all', also seed directory profiles
        if (period === 'all') {
            const dbCustomers = await customerService.getAllCustomers();
            dbCustomers.forEach(c => {
                const phone = c.phoneNumber || c.id;
                if (!phone || customerMap.has(phone)) return;
                const fullName = (c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()) || 'Customer';
                const nameParts = fullName.split(' ');
                customerMap.set(phone, {
                    firstName: c.firstName || nameParts[0] || 'Customer',
                    lastName: c.lastName || nameParts.slice(1).join(' ') || '',
                    visits: c.visitCount || c.visitsCount || 1,
                    lastVisitDate: c.visitDate ? new Date(c.visitDate) : new Date('2026-01-01'),
                    source: c.source || 'Walk-in',
                    totalValue: Number(c.totalAmount || c.totalSpent || 0)
                });
            });
        }

        // 5. Convert Map to Array
        const aggregated: CustomerData[] = Array.from(customerMap.entries()).map(([phone, data]) => ({
            firstName: data.firstName,
            lastName: data.lastName,
            mobile: phone,
            visits: data.visits,
            lastVisit: data.lastVisitDate.toISOString().split('T')[0],
            source: data.source,
            totalPurchaseValue: data.totalValue
        }));

        // Sort by Last Visit (Newest first)
        aggregated.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());

        setCustomers(aggregated);
    };

    const alphabet = ['All', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

    const filtered = customers.filter(c => {
        // 1. Search Term Check
        const searchMatch =
            c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.mobile.includes(searchTerm);

        // 2. Letter Filter Check
        const letterMatch =
            letterFilter === 'All' ||
            c.firstName.toUpperCase().startsWith(letterFilter);

        return searchMatch && letterMatch;
    });

    return (
        <div className="app-container">
            <Sidebar userType={userRole as any} />
            <div className="main-content">
                <HeaderWithLogo title="CUSTOMER DIRECTORY" onLogout={onLogout} />

                <div className="content-area">
                    {userRole === 'billing' ? (
                        /* BILLING STAFF VIEW: Today & Yesterday Only */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                            {/* Today's Customers */}
                            <div className="card">
                                <div className="card-title" style={{ color: 'var(--accent-gold)' }}>Today's Customers</div>
                                <CustomerTable
                                    customers={customers.filter(c => {
                                        const today = new Date().toISOString().split('T')[0];
                                        return c.lastVisit === today;
                                    })}
                                />
                            </div>

                            {/* Yesterday's Customers */}
                            <div className="card">
                                <div className="card-title" style={{ color: '#aaa' }}>Yesterday's Customers</div>
                                <CustomerTable
                                    customers={customers.filter(c => {
                                        const yesterday = new Date();
                                        yesterday.setDate(yesterday.getDate() - 1);
                                        const yStr = yesterday.toISOString().split('T')[0];
                                        return c.lastVisit === yStr;
                                    })}
                                />
                            </div>
                        </div>
                    ) : (
                        /* DEFAULT VIEW (Manager/Admin): All Customers with Filters */
                        <>
                            {/* Period Filter Bar */}
                            <div className="card" style={{ marginBottom: '20px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Filter Period:</span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {[
                                            { key: 'this_month', label: '📅 This Month (Sep 2026)' },
                                            { key: 'last_month', label: 'August 2026' },
                                            { key: 'all', label: 'All Time' }
                                        ].map(p => (
                                            <button
                                                key={p.key}
                                                onClick={() => setPeriodFilter(p.key as any)}
                                                style={{
                                                    padding: '7px 14px',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    border: periodFilter === p.key ? '1px solid var(--accent-gold)' : '1px solid #333',
                                                    background: periodFilter === p.key ? 'rgba(212, 175, 55, 0.15)' : '#161616',
                                                    color: periodFilter === p.key ? 'var(--accent-gold)' : '#999',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ fontSize: '13px', color: '#aaa' }}>
                                    Branch: <strong style={{ color: 'var(--accent-gold)' }}>{authService.getCurrentUser()?.branchName || 'Current Branch'}</strong>
                                </div>
                            </div>

                            {/* Alphabet Filter */}
                            <div className="card" style={{ marginBottom: '20px', padding: '15px', overflowX: 'auto' }}>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                                    {alphabet.map(letter => (
                                        <button
                                            key={letter}
                                            onClick={() => setLetterFilter(letter)}
                                            style={{
                                                minWidth: '36px',
                                                height: '36px',
                                                padding: '0 8px',
                                                borderRadius: '6px',
                                                border: letterFilter === letter ? '1px solid var(--accent-gold)' : '1px solid #333',
                                                background: letterFilter === letter ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                                                color: letterFilter === letter ? 'var(--accent-gold)' : '#888',
                                                cursor: 'pointer',
                                                fontWeight: letterFilter === letter ? 'bold' : 'normal',
                                                fontSize: '14px',
                                                flexShrink: 0
                                            }}
                                        >
                                            {letter}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="card" style={{ marginBottom: '20px', padding: '15px' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                                    <input
                                        placeholder="Search by Name or Mobile..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 16px 12px 42px',
                                            background: '#111', border: '1px solid #333', borderRadius: '8px',
                                            color: '#fff', outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Customer Table */}
                            <div className="card">
                                <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                    <span>
                                        {periodFilter === 'this_month' ? '📅 This Month (Sep 2026) Customers' : (periodFilter === 'last_month' ? 'August 2026 Customers' : 'All Customer Visits')}
                                    </span>
                                    <span style={{ fontSize: '13px', color: 'var(--accent-gold)', fontWeight: 600 }}>
                                        {filtered.length} Customers • Total Spent: ₹{filtered.reduce((sum, c) => sum + c.totalPurchaseValue, 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <CustomerTable customers={filtered} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Reusable Table Component (Internal)
function CustomerTable({ customers }: { customers: CustomerData[] }) {
    if (customers.length === 0) {
        return (
            <div style={{ padding: '30px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                No customers found.
            </div>
        );
    }
    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                <thead>
                    <tr style={{ color: '#666', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #333' }}>
                        <th style={{ padding: '15px' }}>First Name</th>
                        <th style={{ padding: '15px' }}>Last Name</th>
                        <th style={{ padding: '15px' }}>Mobile Number</th>
                        <th style={{ padding: '15px' }}>Total Purchase Value</th>
                        <th style={{ padding: '15px' }}>Lifetime Visit Count</th>
                        <th style={{ padding: '15px' }}>Last Visited Date</th>
                        <th style={{ padding: '15px' }}>Source</th>
                        <th style={{ padding: '15px' }}>Edit</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((c, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                            <td style={{ padding: '15px', fontWeight: '600', color: '#fff' }}>{c.firstName}</td>
                            <td style={{ padding: '15px', color: '#ccc' }}>{c.lastName}</td>
                            <td style={{ padding: '15px', color: 'var(--accent-gold)' }}>{c.mobile}</td>
                            <td style={{ padding: '15px', fontWeight: 'bold', color: '#fff' }}>₹{c.totalPurchaseValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                            <td style={{ padding: '15px', textAlign: 'center' }}>
                                <span style={{ background: '#333', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                    {c.visits}
                                </span>
                            </td>
                            <td style={{ padding: '15px', color: '#ccc' }}>{c.lastVisit}</td>
                            <td style={{ padding: '15px' }}>{c.source}</td>
                            <td style={{ padding: '15px' }}>
                                <button style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                                    <Edit size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
