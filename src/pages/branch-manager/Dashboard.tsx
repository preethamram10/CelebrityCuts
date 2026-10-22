import { useState, useEffect } from 'react';
import HeaderWithLogo from '../../components/HeaderWithLogo';
import Sidebar from '../../components/Sidebar';
import { IndianRupee, Clock, TrendingUp, Calendar } from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { attendanceService } from '../../services/attendanceService';
import { staffService } from '../../services/staffService';
import { authService, isSameBranch } from '../../services/authService';
import { getISTDateString, getISTYesterdayDateString } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
    onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();
    const branchId = currentUser?.branchId || 'branch1';

    const [stats, setStats] = useState({
        revenue: 0,
        appointments: 0,
        activeStaff: 0,
        totalStaff: 0,
        avgTicket: 0,
        serviceRevenue: 0,
        productRevenue: 0,
        extensionRevenue: 0
    });
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
    const [staffOnShift, setStaffOnShift] = useState<any[]>([]);

    // Time Filter State
    const [timeRange, setTimeRange] = useState('today');
    const [customDate, setCustomDate] = useState('');

    useEffect(() => {
        loadDashboardData();
        // Set up an interval to refresh data every 30 seconds for specific "real-time" feel
        const interval = setInterval(loadDashboardData, 30000);
        return () => clearInterval(interval);
    }, [timeRange, customDate]);

    const loadDashboardData = async () => {
        const user = authService.getCurrentUser();
        const activeBranchId = user?.branchId || 'branch1';
        const todayStr = getISTDateString();

        // 1. Transactions & Revenue
        const rawTransactions = await transactionService.getAllTransactions();

        // STRICT FILTERING: Ensure ONLY current manager's branch revenue is included
        const allTransactions = (user && user.role !== 'admin')
            ? rawTransactions.filter(t => isSameBranch(t.branchId || t, activeBranchId))
            : rawTransactions;

        // Calculate date ranges
        let filteredTransactions = allTransactions;

        if (timeRange === 'today') {
            filteredTransactions = allTransactions.filter(t => t.date === todayStr);
        } else if (timeRange === 'yesterday') {
            const yestStr = getISTYesterdayDateString();
            filteredTransactions = allTransactions.filter(t => t.date === yestStr);
        } else if (timeRange === 'this_week') {
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const startStr = getISTDateString(startOfWeek);
            filteredTransactions = allTransactions.filter(t => t.date >= startStr && t.date <= todayStr);
        } else if (timeRange === 'this_month') {
            const today = new Date();
            const startOfMonth = getISTDateString(new Date(today.getFullYear(), today.getMonth(), 1));
            filteredTransactions = allTransactions.filter(t => t.date >= startOfMonth && t.date <= todayStr);
        } else if (timeRange === 'last_month') {
            const today = new Date();
            const startOfLastMonth = getISTDateString(new Date(today.getFullYear(), today.getMonth() - 1, 1));
            const endOfLastMonth = getISTDateString(new Date(today.getFullYear(), today.getMonth(), 0));
            filteredTransactions = allTransactions.filter(t => t.date >= startOfLastMonth && t.date <= endOfLastMonth);
        } else if (timeRange === 'particular_date' && customDate) {
            filteredTransactions = allTransactions.filter(t => t.date === customDate);
        } else if (timeRange === 'overall') {
            filteredTransactions = allTransactions;
        }

        let totalServiceRev = 0;
        let totalProductRev = 0;
        let totalExtensionRev = 0;

        filteredTransactions.forEach(t => {
            if (t.items && Array.isArray(t.items)) {
                t.items.forEach((item: any) => {
                    const amt = item.total || item.amount || 0;
                    if (item.type === 'product') {
                        totalProductRev += amt;
                    } else if (item.type === 'hair_extension') {
                        totalExtensionRev += amt;
                    } else {
                        totalServiceRev += amt;
                    }
                });
            } else {
                totalServiceRev += t.amount;
            }
        });
        const totalRevenue = totalServiceRev + totalProductRev + totalExtensionRev;
        const avgTicket = filteredTransactions.length > 0 ? totalRevenue / filteredTransactions.length : 0;
        // 2. Staff Stats (Keep Attendance relative to today)
        const allStaff = await staffService.getStaffByBranch(activeBranchId);
        const attendance = await attendanceService.getDateRecords(todayStr);
        const presentStaff = attendance.filter(a => a.status === 'Present' || a.status === 'Late');
        // 3. Prepare Staff On Shift List with names
        const onShiftDetails = presentStaff.map(record => {
            const staffInfo = allStaff.find(s => s.id === record.staffId);
            return {
                name: staffInfo ? staffInfo.name : record.staffName,
                role: staffInfo ? staffInfo.role : 'Staff',
                checkIn: record.checkIn
            };
        });

        setStats({
            revenue: totalRevenue,
            serviceRevenue: totalServiceRev,
            productRevenue: totalProductRev,
            extensionRevenue: totalExtensionRev,
            appointments: filteredTransactions.length,
            activeStaff: presentStaff.length,
            totalStaff: allStaff.length,
            avgTicket: avgTicket
        });

        // Always show the 5 most recent transactions overall (or just within the filtered range)
        setRecentTransactions(filteredTransactions.slice(0, 5)); // Get last 5 inside range
        setStaffOnShift(onShiftDetails);
    };

    const statCards = [
        // @ts-ignore
        { title: 'Service Sales', value: `₹${Number(stats.serviceRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <TrendingUp size={24} />, color: '#3b82f6' },
        // @ts-ignore
        { title: 'Product Sales', value: `₹${Number(stats.productRevenue || 0).toLocaleString('en-IN')}`, icon: <TrendingUp size={24} />, color: '#ec4899' },
        // @ts-ignore
        { title: 'Extension Sales', value: `₹${Number(stats.extensionRevenue || 0).toLocaleString('en-IN')}`, icon: <TrendingUp size={24} />, color: '#f59e0b' },
        { title: "Total Revenue", value: `₹${Number(stats.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <IndianRupee size={24} />, color: 'var(--accent-gold)' },

        { title: 'Appointments', value: stats.appointments.toString(), icon: <Clock size={24} />, color: '#06b6d4' },
    ];

    const getDisplayDateString = () => {
        if (timeRange === 'yesterday') {
            const yest = new Date();
            yest.setDate(yest.getDate() - 1);
            return yest.toDateString();
        }
        if (timeRange === 'particular_date' && customDate) {
            return new Date(customDate).toDateString();
        }
        if (timeRange === 'this_week') return 'This Week';
        if (timeRange === 'this_month') return 'This Month';
        if (timeRange === 'last_month') return 'Last Month';
        if (timeRange === 'overall') return 'Overall Branch';
        return new Date().toDateString(); // Default to today
    };

    return (
        <div className="app-container">
            <Sidebar userType="manager" />
            <div className="main-content">
                <HeaderWithLogo title={`${(currentUser?.branchName || 'BRANCH').toUpperCase()} DASHBOARD`} onLogout={onLogout} />

                <div className="content-area">
                    {/* Welcome Section */}
                    <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>
                                Welcome back, Manager
                            </h1>
                            <p style={{ color: '#888' }}>
                                Real-time overview of <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{currentUser?.branchName || 'your branch'}</span> performance.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ fontSize: '14px', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)', padding: '6px 12px', borderRadius: '4px' }}>
                                {getDisplayDateString()}
                            </div>

                            {/* Time Range Filter */}
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                style={{
                                    background: '#111', color: '#fff', border: '1px solid #333',
                                    padding: '6px 12px', borderRadius: '4px', outline: 'none', cursor: 'pointer'
                                }}
                            >
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="this_week">This Week</option>
                                <option value="this_month">This Month</option>
                                <option value="last_month">Last Month</option>
                                <option value="particular_date">Particular Date</option>
                                <option value="overall">Overall Revenue</option>
                            </select>

                            {timeRange === 'particular_date' && (
                                <div style={{ display: 'flex', alignItems: 'center', background: '#111', borderRadius: '4px', border: '1px solid #333', padding: '2px 8px' }}>
                                    <Calendar size={14} color="#666" />
                                    <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        style={{ background: 'transparent', border: 'none', color: '#ccc', padding: '4px 6px', fontSize: '13px', outline: 'none' }}
                                    />
                                    {customDate && (
                                        <button
                                            onClick={() => { setTimeRange('today'); setCustomDate(''); }}
                                            style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '0 4px' }}>
                                            ×
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid">
                        {statCards.map((stat, index) => (
                            <div key={index} className="stat-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div className="stat-label">{stat.title}</div>
                                    <div style={{ color: stat.color }}>{stat.icon}</div>
                                </div>
                                <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="dashboard-grid" style={{ marginTop: '20px', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', display: 'grid' }}>

                        {/* Recent Activity */}
                        <div className="card">
                            <div className="card-title" style={{ borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '15px' }}>
                                Recent Transactions
                            </div>
                            {recentTransactions.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {recentTransactions.map((tx, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ color: '#fff', fontSize: '14px' }}>{tx.customerName}</span>
                                                <span style={{ color: '#666', fontSize: '11px' }}>{tx.time} • {tx.items ? `${tx.items.length} Items` : 'Service'}</span>
                                            </div>
                                            <div style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
                                                ₹{Number(tx.amount || 0).toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: '#666', fontSize: '14px', padding: '20px 0', textAlign: 'center', fontStyle: 'italic' }}>
                                    No transactions yet today.
                                </div>
                            )}
                        </div>
                        {/* Staff On Shift */}
                        <div className="card">
                            <div className="card-title" style={{ borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Staff On Shift</span>
                                <span style={{ fontSize: '12px', color: '#10b981' }}>{stats.activeStaff} Active</span>
                            </div>
                            {staffOnShift.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {staffOnShift.map((s, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ color: '#fff', fontSize: '14px' }}>{s.name}</span>
                                                    <span style={{ color: '#666', fontSize: '11px' }}>{s.role}</span>
                                                </div>
                                            </div>
                                            <div style={{ color: '#888', fontSize: '12px' }}>
                                                In: {s.checkIn}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: '#666', fontSize: '14px', padding: '20px 0', textAlign: 'center', fontStyle: 'italic' }}>
                                    No staff checked in yet.
                                </div>
                            )}
                            <div style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '15px', textAlign: 'center' }}>
                                <button
                                    onClick={() => navigate('/manager/attendance')}
                                    style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '13px' }}
                                >
                                    View Full Attendance Record →
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
