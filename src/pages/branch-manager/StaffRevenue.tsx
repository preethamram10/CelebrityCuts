import { useState, useEffect } from 'react';
import HeaderWithLogo from '../../components/HeaderWithLogo';
import Sidebar from '../../components/Sidebar';
import { transactionService } from '../../services/transactionService';
import { staffService } from '../../services/staffService';
import { Printer } from 'lucide-react';
interface StaffRevenue {
    id: string;
    name: string;
    role: string;
    overallRevenue: number;
    overallCount: number;
    serviceRevenue: number;
    serviceCount: number;
    extensionRevenue: number;
    extensionCount: number;
}
import { useNavigate } from 'react-router-dom';

export default function StaffRevenuePage({ onLogout }: { onLogout: () => void }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overall' | 'service' | 'extension'>('overall');
    const [timeRange, setTimeRange] = useState('today');
    const [revenueData, setRevenueData] = useState<StaffRevenue[]>([]);
    const [totals, setTotals] = useState({ overall: 0, service: 0, extension: 0 });

    const getLocalDateStr = (dateInput?: Date | string) => {
        if (!dateInput) return '';
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return String(dateInput).split('T')[0];
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        calculateRevenue();
    }, [timeRange]);

    const calculateRevenue = async () => {
        const allTransactions = await transactionService.getAllTransactions();
        const staffList = await staffService.getStaffByBranch();

        const today = new Date();
        const todayStr = getLocalDateStr(today);

        // Filter Transactions by Time Range
        let filteredTransactions = allTransactions;

        if (timeRange === 'today') {
            filteredTransactions = allTransactions.filter(t => getLocalDateStr(t.date) === todayStr);
        } else if (timeRange === 'yesterday') {
            const yest = new Date(today);
            yest.setDate(yest.getDate() - 1);
            const yestStr = getLocalDateStr(yest);
            filteredTransactions = allTransactions.filter(t => getLocalDateStr(t.date) === yestStr);
        } else if (timeRange === 'this_week') {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const startStr = getLocalDateStr(startOfWeek);
            filteredTransactions = allTransactions.filter(t => getLocalDateStr(t.date) >= startStr && getLocalDateStr(t.date) <= todayStr);
        } else if (timeRange === 'this_month') {
            const startOfMonth = getLocalDateStr(new Date(today.getFullYear(), today.getMonth(), 1));
            filteredTransactions = allTransactions.filter(t => getLocalDateStr(t.date) >= startOfMonth && getLocalDateStr(t.date) <= todayStr);
        }

        // Initialize Map with staff by ID and Name lookup
        const staffMap = new Map<string, StaffRevenue>();
        staffList.forEach(s => {
            if (!staffMap.has(s.id)) {
                staffMap.set(s.id, {
                    id: s.id,
                    name: s.name,
                    role: s.role,
                    overallRevenue: 0,
                    overallCount: 0,
                    serviceRevenue: 0,
                    serviceCount: 0,
                    extensionRevenue: 0,
                    extensionCount: 0
                });
            }
        });

        const findStaffEntry = (identifier: string, nameFallback?: string): StaffRevenue | undefined => {
            if (!identifier && !nameFallback) return undefined;
            if (identifier && staffMap.has(identifier)) return staffMap.get(identifier);
            
            const cleanId = (identifier || '').toLowerCase().trim();
            const cleanName = (nameFallback || identifier || '').toLowerCase().trim();

            for (const entry of staffMap.values()) {
                if (entry.id.toLowerCase().trim() === cleanId || entry.name.toLowerCase().trim() === cleanName) {
                    return entry;
                }
            }
            return undefined;
        };

        // Process Transactions
        filteredTransactions.forEach(tx => {
            if (tx.items && Array.isArray(tx.items)) {
                tx.items.forEach((item: any) => {
                    const isExt = item.type === 'hair_extension' || item.category === 'Hair Extensions';
                    const totalItemAmt = Number(item.amount || item.total || 0);

                    let itemStaffList: StaffRevenue[] = [];

                    if (item.staffSplits && item.staffSplits.length > 0) {
                        item.staffSplits.forEach((split: any) => {
                            const staffStat = findStaffEntry(split.id, split.name);
                            if (staffStat) {
                                const share = split.amount !== undefined 
                                    ? Number(split.amount) 
                                    : (split.percentage ? (split.percentage / 100) * totalItemAmt : totalItemAmt / item.staffSplits.length);
                                staffStat.overallRevenue += share;
                                staffStat.overallCount += 1;
                                if (isExt) {
                                    staffStat.extensionRevenue += share;
                                    staffStat.extensionCount += 1;
                                } else {
                                    staffStat.serviceRevenue += share;
                                    staffStat.serviceCount += 1;
                                }
                            }
                        });
                    } else if (item.staffIds && item.staffIds.length > 0) {
                        const count = item.staffIds.length;
                        const share = totalItemAmt / count;
                        item.staffIds.forEach((sId: string) => {
                            const staffStat = findStaffEntry(sId);
                            if (staffStat) {
                                staffStat.overallRevenue += share;
                                staffStat.overallCount += 1;
                                if (isExt) {
                                    staffStat.extensionRevenue += share;
                                    staffStat.extensionCount += 1;
                                } else {
                                    staffStat.serviceRevenue += share;
                                    staffStat.serviceCount += 1;
                                }
                            }
                        });
                    } else if (staffMap.size > 0) {
                        // Fallback: If no explicit staff assigned to item, split equally across active branch staff
                        const staffList = Array.from(staffMap.values());
                        const share = totalItemAmt / staffList.length;
                        staffList.forEach(staffStat => {
                            staffStat.overallRevenue += share;
                            staffStat.overallCount += 1;
                            if (isExt) {
                                staffStat.extensionRevenue += share;
                                staffStat.extensionCount += 1;
                            } else {
                                staffStat.serviceRevenue += share;
                                staffStat.serviceCount += 1;
                            }
                        });
                    }
                });
            }
        });

        // Convert to Array
        const results = Array.from(staffMap.values());
        setRevenueData(results);
        setTotals({
            overall: results.reduce((sum, s) => sum + s.overallRevenue, 0),
            service: results.reduce((sum, s) => sum + s.serviceRevenue, 0),
            extension: results.reduce((sum, s) => sum + s.extensionRevenue, 0)
        });
    };

    const getDisplayData = () => {
        return revenueData.map(s => ({
            ...s,
            currentRevenue: activeTab === 'overall' ? s.overallRevenue : activeTab === 'service' ? s.serviceRevenue : s.extensionRevenue,
            currentCount: activeTab === 'overall' ? s.overallCount : activeTab === 'service' ? s.serviceCount : s.extensionCount
        })).sort((a, b) => b.currentRevenue - a.currentRevenue);
    };

    const displayData = getDisplayData();

    return (
        <div className="app-container">
            <Sidebar userType="manager" />
            <div className="main-content">
                <HeaderWithLogo title="STAFF REVENUE" onLogout={onLogout} />

                <div className="content-area">
                    {/* TABS & TIME FILTER */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
                            <button
                                onClick={() => setActiveTab('overall')}
                                className="button"
                                style={{
                                    background: activeTab === 'overall' ? '#D4AF37' : 'transparent',
                                    color: activeTab === 'overall' ? '#000' : '#D4AF37',
                                    border: '1px solid #D4AF37',
                                    padding: '10px 24px', borderRadius: '30px', fontWeight: 600, transition: 'all 0.3s'
                                }}>
                                Overall
                            </button>
                            <button
                                onClick={() => setActiveTab('service')}
                                className="button"
                                style={{
                                    background: activeTab === 'service' ? '#D4AF37' : 'transparent',
                                    color: activeTab === 'service' ? '#000' : '#ccc',
                                    border: activeTab === 'service' ? '1px solid #D4AF37' : '1px solid #333',
                                    padding: '10px 24px', borderRadius: '30px', fontWeight: 600, transition: 'all 0.3s'
                                }}>
                                Services
                            </button>
                            <button
                                onClick={() => setActiveTab('extension')}
                                className="button"
                                style={{
                                    background: activeTab === 'extension' ? '#D4AF37' : 'transparent',
                                    color: activeTab === 'extension' ? '#000' : '#ccc',
                                    border: activeTab === 'extension' ? '1px solid #D4AF37' : '1px solid #333',
                                    padding: '10px 24px', borderRadius: '30px', fontWeight: 600, transition: 'all 0.3s'
                                }}>
                                Hair Extensions
                            </button>
                        </div>

                        {/* TIME RANGE FILTER */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#888', fontSize: '13px' }}>Period:</span>
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                style={{
                                    background: '#111', color: 'var(--accent-gold)',
                                    border: '1px solid var(--accent-gold)',
                                    padding: '8px 16px', borderRadius: '20px',
                                    fontWeight: 600, outline: 'none', cursor: 'pointer'
                                }}
                            >
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="this_week">This Week</option>
                                <option value="this_month">This Month</option>
                                <option value="all">Overall (All Time)</option>
                            </select>
                        </div>
                    </div>

                    {/* Summary Card with Glassmorphism */}
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)', marginBottom: '40px' }}>
                        <div className="stat-card" style={{
                            background: 'linear-gradient(135deg, rgba(20,20,20,0.95) 0%, rgba(10,10,10,0.98) 100%)',
                            border: '1px solid rgba(212, 175, 55, 0.1)',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                            position: 'relative',
                            overflow: 'hidden',
                            padding: '30px'
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #D4AF37 0%, #AA8C2C 100%)' }}></div>

                            <div className="stat-label" style={{ letterSpacing: '2px', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>
                                Total {activeTab === 'overall' ? 'Overall' : activeTab === 'service' ? 'Service' : 'Hair Extension'} Revenue
                            </div>
                            <div className="stat-value" style={{
                                background: 'linear-gradient(90deg, #fff 0%, #ccc 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontSize: '42px',
                                letterSpacing: '-1px'
                            }}>
                                ₹{activeTab === 'overall' ? totals.overall.toFixed(2) : activeTab === 'service' ? totals.service.toFixed(2) : totals.extension.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '13px', color: '#555', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '6px', height: '6px', background: '#D4AF37', borderRadius: '50%' }}></div>
                                Revenue from {activeTab === 'overall' ? 'Services & Extensions' : activeTab === 'service' ? 'Services' : 'Hair Extensions'} (Split by Staff Count)
                            </div>
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="card" style={{ border: '1px solid rgba(255,255,255,0.05)', background: '#0a0a0a' }}>
                        <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '4px', height: '20px', background: '#D4AF37', borderRadius: '2px' }}></div>
                                <span style={{ letterSpacing: '1px', fontWeight: 700, fontSize: '16px' }}>PERFORMANCE LEADERBOARD</span>
                            </div>
                            <button onClick={() => window.print()} className="button button-sec" style={{
                                background: 'transparent',
                                border: '1px solid #333',
                                color: '#ccc',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                transition: 'all 0.2s'
                            }}>
                                <Printer size={14} /> PRINT
                            </button>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <th style={{ padding: '15px 20px' }}>Rank</th>
                                    <th style={{ padding: '15px' }}>Staff Member</th>
                                    <th style={{ padding: '15px' }}>Role</th>
                                    <th style={{ padding: '15px', textAlign: 'center' }}>Jobs Done</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>Revenue Share</th>
                                    <th style={{ width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayData.map((staff, idx) => (
                                    <tr
                                        key={staff.id}
                                        onClick={() => navigate(`/manager/staffrevenue/${staff.id}`)}
                                        style={{
                                            background: idx === 0 ? 'linear-gradient(90deg, rgba(212, 175, 55, 0.05) 0%, rgba(0,0,0,0) 100%)' : 'rgba(255,255,255,0.01)',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s, background 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = idx === 0 ? 'linear-gradient(90deg, rgba(212, 175, 55, 0.05) 0%, rgba(0,0,0,0) 100%)' : 'rgba(255,255,255,0.01)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <td style={{ padding: '20px', color: idx === 0 ? '#D4AF37' : '#444', fontWeight: 800, fontSize: '18px' }}>
                                            {idx + 1}
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <div style={{ fontWeight: 600, fontSize: '15px', color: '#fff' }}>{staff.name}</div>
                                        </td>
                                        <td style={{ padding: '20px', color: '#888', fontSize: '13px' }}>{staff.role}</td>
                                        <td style={{ padding: '20px', textAlign: 'center' }}>
                                            <span style={{ background: '#1a1a1a', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', color: '#ccc', border: '1px solid #333' }}>
                                                {staff.currentCount}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px', textAlign: 'right', fontWeight: 700, fontSize: '16px', color: idx === 0 ? '#D4AF37' : '#fff' }}>
                                            ₹{staff.currentRevenue.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '20px', color: '#444' }}>
                                            →
                                        </td>
                                    </tr>
                                ))}
                                {displayData.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#444' }}>
                                            No {activeTab} revenue data available.<br />
                                            <span style={{ fontSize: '12px', color: '#333' }}>Process a bill with staff assigned to see data here.</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
