import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import HeaderWithLogo from '../../components/HeaderWithLogo';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { transactionService } from '../../services/transactionService';
import { customerService } from '../../services/customerService';
import { staffService } from '../../services/staffService';
import { authService, isSameBranch } from '../../services/authService';
import ActiveSessions from '../../components/ActiveSessions';
// @ts-ignore
import { SERVICE_DATA } from '../billing-staff/services-data';

interface AdminDashboardProps {
    onLogout: () => void
}

export default function Dashboard({ onLogout }: AdminDashboardProps) {
    const [stats, setStats] = useState({
        revenue: 0,
        customers: 0,
        staff: 0,
        branches: 4
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [branchPerformance, setBranchPerformance] = useState<any[]>([]);
    const [categorySales, setCategorySales] = useState<any[]>([]);
    const [timeRange, setTimeRange] = useState<'this_month' | 'last_month' | 'today' | 'all'>('this_month');
    const [selectedCount, setSelectedCount] = useState(0);

    useEffect(() => {
        loadData(timeRange);
    }, [timeRange]);

    const loadData = async (range: string = timeRange) => {
        const rawTransactions = await transactionService.getAllTransactions();
        const customers = await customerService.getAllCustomers();
        const staff = await staffService.getAllStaff();

        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const thisMonthKey = `${y}-${m}`;
        const lastMDate = new Date(y, today.getMonth() - 1, 1);
        const lastMonthKey = `${lastMDate.getFullYear()}-${String(lastMDate.getMonth() + 1).padStart(2, '0')}`;
        const todayStr = `${y}-${m}-${String(today.getDate()).padStart(2, '0')}`;

        let transactions = rawTransactions;
        if (range === 'this_month') {
            transactions = rawTransactions.filter(t => (t.date || '').startsWith(thisMonthKey));
        } else if (range === 'last_month') {
            transactions = rawTransactions.filter(t => (t.date || '').startsWith(lastMonthKey));
        } else if (range === 'today') {
            transactions = rawTransactions.filter(t => (t.date || '').startsWith(todayStr));
        }
        setSelectedCount(transactions.length);

        // 1. Top Level Stats (Split Revenue)
        let totalServiceRevenue = 0;
        let totalProductRevenue = 0;
        let totalExtensionRevenue = 0;

        transactions.forEach(t => {
            if (t.items && Array.isArray(t.items)) {
                t.items.forEach((item: any) => {
                    const amt = item.total || item.amount || 0;
                    if (item.type === 'product') {
                        totalProductRevenue += amt;
                    } else if (item.type === 'hair_extension') {
                        totalExtensionRevenue += amt;
                    } else {
                        // Default to service
                        totalServiceRevenue += amt;
                    }
                });
            } else {
                // Legacy support: if no items, assume whole amount is service
                totalServiceRevenue += t.amount;
            }
        });

        const totalRevenue = totalServiceRevenue + totalProductRevenue + totalExtensionRevenue;
        const activeStaff = staff.filter(s => s.status === 'Active').length;

        // 2. Branch Performance
        const realBranches = await authService.getAllBranches();
        const branches = realBranches.map(b => ({ id: b.branchId, name: b.branchName }));

        setStats({
            revenue: totalRevenue,
            // @ts-ignore
            serviceRevenue: totalServiceRevenue,
            // @ts-ignore
            productRevenue: totalProductRevenue,
            // @ts-ignore
            extensionRevenue: totalExtensionRevenue,
            customers: customers.length,
            staff: activeStaff,
            branches: realBranches.length
        });

        const perfData = branches.map(b => {
            const bTrans = transactions.filter(t => isSameBranch(t.branchId || t, b.id));
            let bServiceRev = 0;
            let bProductRev = 0;
            let bExtensionRev = 0;

            bTrans.forEach(t => {
                if (t.items && Array.isArray(t.items)) {
                    t.items.forEach((item: any) => {
                        const amt = item.total || item.amount || 0;
                        if (item.type === 'product' || item.category === 'Product') {
                            bProductRev += amt;
                        } else if (item.type === 'hair_extension' || item.category === 'Hair Extensions') {
                            bExtensionRev += amt;
                        } else {
                            bServiceRev += amt;
                        }
                    });
                } else {
                    bServiceRev += t.amount;
                }
            });

            const bRev = bServiceRev + bProductRev + bExtensionRev;
            const bCust = new Set(bTrans.map(t => t.customerId)).size; // Unique customers transacted
            const bStaff = staff.filter(s => isSameBranch(s.branchId, b.id) && s.status === 'Active').length;

            return {
                name: b.name,
                revenue: bRev,
                serviceRevenue: bServiceRev,
                extensionRevenue: bExtensionRev,
                productRevenue: bProductRev,
                customers: bCust,
                staff: bStaff
            };
        });
        setBranchPerformance(perfData);

        // 3. Category Sales (Super Categories: Hair, Skin, Makeup, Spa)
        const superCats = {
            'Hair': 0,
            'Skin': 0,
            'Makeup': 0,
            'Spa': 0
        };

        const getSuperCategory = (subCat: string): string => {
            if (['Haircut', 'Hair Treatment', 'Hair Texture', 'Hair Color', 'Styling', 'Hair Extensions'].includes(subCat)) return 'Hair';
            if (['D-Tan', 'Clean Up', 'Facial', 'Luxury Facial', 'Threading', 'Waxing', 'Piercing'].includes(subCat)) return 'Skin';
            if (['Makeup'].includes(subCat)) return 'Makeup';
            if (['Massage', 'Pedicure', 'Manicure', 'Nails', 'Package'].includes(subCat)) return 'Spa'; // Put Package in Spa or maybe distributed? For now Spa.
            return 'Spa'; // Default/Fallback
        };

        transactions.forEach(t => {
            if (t.items && Array.isArray(t.items)) {
                t.items.forEach((item: any) => {
                    // Find actual category from SERVICE_DATA since item might not have it stored directly if old data
                    // Or ideally check if we matched by name.
                    const serviceDef = SERVICE_DATA.find((s: any) => s.name === item.name);
                    const subCategory = serviceDef ? serviceDef.category : 'Package'; // Default to Package/Spa if unknown

                    const superCat = getSuperCategory(subCategory);
                    // @ts-ignore
                    if (superCats[superCat] !== undefined) {
                        // @ts-ignore
                        superCats[superCat] += (item.total || item.amount || 0);
                    }
                });
            }
        });

        const pieData = [
            { name: 'Hair', value: superCats['Hair'], color: '#f59e0b' },   // Amber
            { name: 'Skin', value: superCats['Skin'], color: '#ec4899' },   // Pink
            { name: 'Makeup', value: superCats['Makeup'], color: '#8b5cf6' }, // Violet
            { name: 'Spa', value: superCats['Spa'], color: '#06b6d4' }      // Cyan
        ].filter(d => d.value > 0); // Only show categories with sales

        setCategorySales(pieData);


        // 4. Monthly Trend (Mocking historical distribution based on current data for demo if empty, ideally process dates)
        // Since we did a "Fresh Start", let's aggregate whatever real data we have by Month, 
        // using Date objects.
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentMonthIdx = new Date().getMonth();

        // Initialize last 6 months
        const trend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(currentMonthIdx - i);
            const mStr = months[d.getMonth()];
            // Year string no longer needed; Using actual dates
            const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM

            // Filter transactions for this month
            const mTrans = transactions.filter(t => t.date.startsWith(mKey));
            const mRev = mTrans.reduce((sum, t) => sum + t.amount, 0);
            const mCust = new Set(mTrans.map(t => t.customerId)).size;

            trend.push({
                month: mStr,
                revenue: mRev,
                customers: mCust
            });
        }
        setChartData(trend);
    };

    return (
        <div className="app-container">
            <Sidebar userType="admin" />
            <div className="main-content">
                <HeaderWithLogo title="Admin Dashboard" onLogout={onLogout} />
                <div className="content-area">
                    {/* Period Filter Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', background: '#0d0d0d', padding: '12px 18px', borderRadius: '12px', border: '1px solid #222', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>Period:</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {[
                                    { key: 'this_month', label: '📅 This Month (Sep 2026)' },
                                    { key: 'last_month', label: 'August 2026' },
                                    { key: 'today', label: 'Today' },
                                    { key: 'all', label: 'All Time' }
                                ].map(p => (
                                    <button
                                        key={p.key}
                                        onClick={() => setTimeRange(p.key as any)}
                                        style={{
                                            padding: '7px 14px',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            border: timeRange === p.key ? '1px solid #D4AF37' : '1px solid #2a2a2a',
                                            background: timeRange === p.key ? 'rgba(212, 175, 55, 0.15)' : '#161616',
                                            color: timeRange === p.key ? '#D4AF37' : '#999',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>
                            Showing <span style={{ color: '#D4AF37', fontWeight: 600 }}>{selectedCount}</span> invoices
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card stat-card-blue">
                            <div className="stat-label">Service Revenue</div>
                            {/* @ts-ignore */}
                            <div className="stat-value">₹{Number(stats.serviceRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                        <div className="stat-card stat-card-pink">
                            <div className="stat-label">Product Revenue</div>
                            {/* @ts-ignore */}
                            <div className="stat-value">₹{Number(stats.productRevenue || 0).toLocaleString('en-IN')}</div>
                        </div>
                        <div className="stat-card stat-card-yellow">
                            <div className="stat-label">Extension Revenue</div>
                            {/* @ts-ignore */}
                            <div className="stat-value">₹{Number(stats.extensionRevenue || 0).toLocaleString('en-IN')}</div>
                        </div>
                        <div className="stat-card stat-card-cyan">
                            <div className="stat-label">Total Revenue</div>
                            <div className="stat-value">₹{Number(stats.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                    </div>

                    {/* Top Row Charts */}
                    <div className="dashboard-grid">
                        <div className="card">
                            <div className="card-title">Revenue Trend (Last 6 Months)</div>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#404861" />
                                    <XAxis dataKey="month" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* New Category Pie Chart */}
                        <div className="card">
                            <div className="card-title">Category Sales (Hair/Skin/Makeup/Spa)</div>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={categorySales}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categorySales.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} formatter={(value: number) => `₹${Number(value || 0).toLocaleString('en-IN')}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Active Sessions Widget */}
                    <div style={{ marginTop: '20px' }}>
                        <ActiveSessions />
                    </div>

                    <div className="dashboard-grid" style={{ marginTop: '20px' }}>
                        <div className="card">
                            <div className="card-title">Customer Growth</div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#404861" />
                                    <XAxis dataKey="month" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                                    <Bar dataKey="customers" fill="#06b6d4" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="card" style={{ gridColumn: '1 / -1' }}>
                            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>🏢 Branch Revenue & Catalog Breakdown</span>
                                <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'normal' }}>Individual Branch Revenue • Services • Hair Extensions • Products</span>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ddd' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                                            <th style={{ padding: '12px 14px' }}>Branch Name</th>
                                            <th style={{ padding: '12px 14px' }}>Total Revenue</th>
                                            <th style={{ padding: '12px 14px', color: '#93c5fd' }}>Services</th>
                                            <th style={{ padding: '12px 14px', color: '#fcd34d' }}>Hair Extensions</th>
                                            <th style={{ padding: '12px 14px', color: '#f472b6' }}>Products</th>
                                            <th style={{ padding: '12px 14px' }}>Customers</th>
                                            <th style={{ padding: '12px 14px' }}>Staff</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {branchPerformance.map((branch, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                                                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#fff' }}>
                                                    {branch.name}
                                                </td>
                                                <td style={{ padding: '12px 14px', color: '#D4AF37', fontWeight: 700 }}>
                                                    ₹{Number(branch.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ padding: '12px 14px', color: '#93c5fd' }}>
                                                    ₹{Number(branch.serviceRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ padding: '12px 14px', color: '#fcd34d' }}>
                                                    ₹{Number(branch.extensionRevenue || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td style={{ padding: '12px 14px', color: '#f472b6' }}>
                                                    ₹{Number(branch.productRevenue || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td style={{ padding: '12px 14px' }}>{branch.customers}</td>
                                                <td style={{ padding: '12px 14px' }}>{branch.staff}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}