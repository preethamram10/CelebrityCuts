import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HeaderWithLogo from '../../components/HeaderWithLogo';
import Sidebar from '../../components/Sidebar';
import { transactionService } from '../../services/transactionService';
import { staffService, Staff } from '../../services/staffService';
import { ArrowLeft, Printer, Calendar, Clock, User } from 'lucide-react';

interface BillingRecord {
    id: string; // Transaction ID
    date: string;
    time: string;
    customerName: string;
    serviceName: string;
    type: 'service' | 'hair_extension';
    fullAmount: number;
    splitAmount: number;
    splitCount: number; // How many staff shared this
}

export default function StaffBillingDetails({ onLogout }: { onLogout: () => void }) {
    const { staffId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overall' | 'service' | 'extension'>('overall');
    const [staff, setStaff] = useState<Staff | null>(null);
    const [records, setRecords] = useState<BillingRecord[]>([]);
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        if (staffId) {
            loadData(staffId);
        }
    }, [staffId]);

    const loadData = async (id: string) => {
        try {
            // 1. Get Staff Details
            const allStaff = await staffService.getAllStaff();
            const found = allStaff.find(s => s.id === id);
            if (found) setStaff(found);

            // 2. Process Transactions
            const allTx = await transactionService.getAllTransactions();
            const history: BillingRecord[] = [];

            allTx.forEach(tx => {
                if (tx.items) {
                    tx.items.forEach(item => {
                        // Only care about SERVICES or EXTENSIONS assigned to THIS staff
                        if ((item.type === 'service' || item.type === 'hair_extension') && item.staffIds && item.staffIds.includes(id)) {
                            // Find percentage split if any
                            let share = 0;
                            if (item.staffSplits && item.staffSplits.length > 0) {
                                const split: any = item.staffSplits.find((s: any) => s.id === id);
                                if (split) share = split.amount !== undefined ? split.amount : (split.percentage / 100) * item.amount;
                            } else {
                                share = item.amount / item.staffIds.length;
                            }

                            const count = item.staffIds.length;

                            history.push({
                                id: tx.id,
                                date: tx.date,
                                time: tx.time,
                                customerName: tx.customerName,
                                serviceName: item.name,
                                type: item.type as 'service' | 'hair_extension',
                                fullAmount: item.amount,
                                splitAmount: share,
                                splitCount: count
                            });
                        }
                    });
                }
            });

            // Sort by newest first
            history.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

            setRecords(history);
        } catch (error) {
            console.error("Error loading staff billing details", error);
        }
    };

    const tabFilteredRecords = records.filter(r => {
        if (activeTab === 'overall') return true;
        if (activeTab === 'service') return r.type === 'service';
        if (activeTab === 'extension') return r.type === 'hair_extension';
        return true;
    });

    const filteredRecords = dateFilter
        ? tabFilteredRecords.filter(r => r.date === dateFilter)
        : tabFilteredRecords;

    const totalRevenue = filteredRecords.reduce((sum, r) => sum + r.splitAmount, 0);

    if (!staff) return <div style={{ padding: 40, color: '#fff' }}>Loading Staff Details...</div>;

    const handlePrintLog = async () => {
        try {
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            // --- HEADER ---
            doc.setFillColor(18, 18, 18);
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(212, 175, 55); // GOLD
            doc.setFontSize(20);
            doc.text("SERVICE HISTORY LOG", 14, 20);

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            // Format mm/dd/yyyy
            const now = new Date();
            const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;

            doc.text(`DATE: ${dateStr}`, 14, 30);
            doc.text(`${staff?.name.toUpperCase()} - ${staff?.role.toUpperCase()}`, pageWidth - 14, 20, { align: 'right' });
            doc.text("PRINT LOG", pageWidth - 14, 30, { align: 'right' });

            let yPos = 50;

            // --- DATA TABLE ---
            const rows = filteredRecords.map(r => {
                // Format mm/dd/yyyy for row date as well
                const d = new Date(r.date);
                const rowDate = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

                return [
                    rowDate,
                    r.time,
                    r.customerName,
                    r.serviceName,
                    r.splitCount > 1 ? `Yes (${r.splitCount})` : 'No',
                    `Rs. ${r.splitAmount.toFixed(2)}`
                ];
            });

            autoTable(doc, {
                startY: yPos,
                head: [['Date', 'Time', 'Customer', 'Service', 'Split', 'Revenue']],
                body: rows,
                theme: 'grid',
                headStyles: { fillColor: [20, 20, 20], textColor: [212, 175, 55] },
                styles: { fontSize: 9, cellPadding: 4 },
                columnStyles: { 5: { halign: 'right', fontStyle: 'bold' } }
            });

            // Total Footer
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.text("TOTAL REVENUE CONTRIBUTION:", 14, finalY);
            doc.setFont("helvetica", "bold");
            doc.text(`Rs. ${totalRevenue.toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' });

            doc.save(`${staff?.name.replace(' ', '_')}_Service_Log_${dateStr.replace(/\//g, '-')}.pdf`);

        } catch (err) {
            console.error("PDF generation failed", err);
            alert("Failed to generate PDF");
        }
    };

    return (
        <div className="app-container">
            <Sidebar userType="manager" />
            <div className="main-content">
                <HeaderWithLogo title="STAFF PERFORMANCE LOG" onLogout={onLogout} />

                <div className="content-area">
                    {/* Header / Back */}
                    <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <button
                                onClick={() => navigate(-1)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#ccc',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                                <ArrowLeft size={18} /> BACK
                            </button>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '28px', color: '#fff', letterSpacing: '1px' }}>{staff.name}</h2>
                                <div style={{ color: '#D4AF37', fontSize: '14px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '2px' }}>{staff.role}</div>
                            </div>
                        </div>
                    </div>

                    {/* TABS */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '10px' }}>
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

                    {/* Stats Card */}
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '40px' }}>
                        <div className="stat-card" style={{
                            background: 'linear-gradient(135deg, rgba(20,20,20,0.95) 0%, rgba(10,10,10,0.98) 100%)',
                            border: '1px solid rgba(212, 175, 55, 0.2)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                            position: 'relative', overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', right: '-20px', top: '-20px', fontSize: '120px', color: 'rgba(212,175,55,0.05)', fontWeight: 700, pointerEvents: 'none' }}>₹</div>
                            <div className="stat-label" style={{ color: '#888', letterSpacing: '1px', textTransform: 'uppercase' }}>Total {activeTab === 'overall' ? 'Overall' : activeTab === 'service' ? 'Service' : 'Hair Extension'} Revenue Contribution</div>
                            <div className="stat-value" style={{ color: '#fff', fontSize: '36px', marginTop: '5px' }}>₹{totalRevenue.toFixed(2)}</div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>From {filteredRecords.length} Completed {activeTab === 'overall' ? 'Jobs' : activeTab === 'service' ? 'Services' : 'Extensions'}</div>
                        </div>

                        <div className="stat-card" style={{ background: '#0a0a0a', border: '1px solid #222' }}>
                            <div className="stat-label" style={{ color: '#888', letterSpacing: '1px', textTransform: 'uppercase' }}>{activeTab === 'overall' ? 'Total' : activeTab === 'service' ? 'Service' : 'Extension'} Volume</div>
                            <div className="stat-value" style={{ color: '#ccc', fontSize: '36px', marginTop: '5px' }}>{filteredRecords.length}</div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>Total Jobs Performed</div>
                        </div>
                    </div>

                    {/* Table Filters */}
                    <div className="card" style={{ border: '1px solid rgba(255,255,255,0.05)', background: '#0a0a0a' }}>
                        <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '4px', height: '20px', background: '#D4AF37', borderRadius: '2px' }}></div>
                                    <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '1px' }}>SERVICE HISTORY LOG</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', background: '#111', borderRadius: '6px', border: '1px solid #333', padding: '2px 8px' }}>
                                    <Calendar size={14} color="#666" />
                                    <input
                                        type="date"
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                        style={{ background: 'transparent', border: 'none', color: '#ccc', padding: '6px', fontSize: '13px', outline: 'none' }}
                                    />
                                    {dateFilter && (
                                        <button onClick={() => setDateFilter('')} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '0 5px' }}>
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>
                            <button onClick={handlePrintLog} className="button button-sec" style={{
                                background: 'transparent',
                                border: '1px solid #333',
                                color: '#ccc',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                transition: 'all 0.2s'
                            }}>
                                <Printer size={14} /> PRINT LOG
                            </button>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    <th style={{ padding: '15px 20px' }}>Date & Time</th>
                                    <th style={{ padding: '15px' }}>Customer</th>
                                    <th style={{ padding: '15px' }}>Service Details</th>
                                    <th style={{ padding: '15px' }}>Split Status</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>Revenue Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map((rec, idx) => (
                                    <tr key={idx} style={{ background: 'rgba(255,255,255,0.015)' }}>
                                        <td style={{ padding: '20px', borderLeft: '2px solid transparent' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#eee', fontWeight: 500 }}>
                                                {rec.date}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '12px', marginTop: '6px' }}>
                                                <Clock size={12} /> {rec.time}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={14} color="#666" />
                                                </div>
                                                <span style={{ color: '#ccc' }}>{rec.customerName}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D4AF37', fontWeight: 600 }}>
                                                {rec.serviceName}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#555', marginTop: '6px' }}>
                                                Full Price: ₹{rec.fullAmount}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            {rec.splitCount > 1 ? (
                                                <span style={{ background: 'rgba(255,255,255,0.05)', color: '#888', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', border: '1px solid #333' }}>
                                                    Shared with {rec.splitCount - 1} others
                                                </span>
                                            ) : (
                                                <span style={{ color: '#4CAF50', fontSize: '11px', background: 'rgba(76, 175, 80, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>Full Credit</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '20px', textAlign: 'right', fontWeight: 700, fontSize: '16px', color: '#fff' }}>
                                            ₹{rec.splitAmount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                {filteredRecords.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: '#444' }}>
                                            No billing records found for this period.
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
