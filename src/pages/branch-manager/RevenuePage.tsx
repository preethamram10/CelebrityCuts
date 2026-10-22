import { useState, useEffect } from 'react';
import HeaderWithLogo from '../../components/HeaderWithLogo';
import Sidebar from '../../components/Sidebar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Printer, Filter, ArrowUpRight } from 'lucide-react';
import { transactionService } from '../../services/transactionService';
import { authService, isSameBranch } from '../../services/authService';

interface RevenuePageProps {
    onLogout: () => void;
}

export default function RevenuePage({ onLogout }: RevenuePageProps) {
    const [timeRange, setTimeRange] = useState('today');

    const [data, setData] = useState<any>({
        revenue: 0,
        visitors: 0,
        avgTicket: 0,
        trend: '0%',
        detailedList: [],
        chartData: []
    });

    useEffect(() => {
        getRealData(timeRange);
    }, [timeRange]);

    const getLocalDateStr = (dateInput?: Date | string) => {
        if (!dateInput) return '';
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return String(dateInput).split('T')[0];
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getRealData = async (range: string) => {
        // 1. Fetch Real Transactions (filtered by branch)
        const user = authService.getCurrentUser();
        const activeBranchId = user?.branchId || 'branch1';
        const rawTransactions = await transactionService.getAllTransactions();
        const allTransactions = (user && user.role !== 'admin')
            ? rawTransactions.filter(t => isSameBranch(t.branchId || t, activeBranchId))
            : rawTransactions;

        const today = new Date();
        const dailyMap = new Map<string, { revenue: number, visitors: number, count: number }>();

        if (range === 'month' || range === 'this_month') {
            const currentDay = today.getDate();
            for (let d = currentDay; d >= 1; d--) {
                const date = new Date(today.getFullYear(), today.getMonth(), d);
                const isoDate = getLocalDateStr(date);
                dailyMap.set(isoDate, { revenue: 0, visitors: 0, count: 0 });
            }
        } else {
            let days = 30;
            if (range === 'week') days = 7;
            if (range === 'today') days = 1;
            if (range === 'last-3-months') days = 90;

            for (let i = 0; i < days; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const isoDate = getLocalDateStr(date);
                dailyMap.set(isoDate, { revenue: 0, visitors: 0, count: 0 });
            }
        }

        // 3. Aggregate Transactions
        let totalRevenue = 0;
        let totalVisitors = 0;

        allTransactions.forEach(tx => {
            const txDate = getLocalDateStr(tx.date);
            if (dailyMap.has(txDate)) {
                const entry = dailyMap.get(txDate)!;
                const amt = Number(tx.amount || 0);
                entry.revenue += amt;
                entry.count += 1;
                totalRevenue += amt;
                entry.visitors += 1;
                totalVisitors += 1;
            }
        });

        // 4. Convert Map to Array for Display
        // detailedList needs: date (formatted), revenue, visitors, avgTicket
        const detailedList: any[] = [];
        const chartData: any[] = [];

        // Iterate map in chronological order (oldest to newest for chart, but table might want newest first)
        // Map keys insertion order? We inserted newest to oldest? No, loop was 0 to days backwards.
        // Let's sort keys.
        const sortedDates = Array.from(dailyMap.keys()).sort(); // YYYY-MM-DD sorts correctly

        sortedDates.forEach(dateStr => {
            const data = dailyMap.get(dateStr)!;
            const dateObj = new Date(dateStr);
            const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

            // Add to detailed list (reverse order later for table)
            detailedList.push({
                date: formattedDate,
                revenue: data.revenue,
                visitors: data.visitors,
                avgTicket: data.visitors > 0 ? Math.floor(data.revenue / data.visitors) : 0
            });

            // Chart data
            chartData.push({ time: formattedDate.split(' ')[0], sales: data.revenue });
        });

        setData({
            revenue: totalRevenue,
            visitors: totalVisitors,
            avgTicket: totalVisitors > 0 ? Math.floor(totalRevenue / totalVisitors) : 0,
            trend: '+100%', // Placeholder trend logic or calc vs previous period
            detailedList: detailedList.reverse(), // Newest first for table
            chartData // Oldest first for chart
        });
    };

    const handleDownloadCSV = () => {
        const headers = ['Date', 'Revenue', 'Visitors', 'Avg Ticket'];
        const rows = data.detailedList.map((d: any) => [d.date, d.revenue, d.visitors, d.avgTicket]);

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += `Revenue Report - ${timeRange.toUpperCase()}\n\n`;
        csvContent += headers.join(",") + "\n";
        rows.forEach((row: any) => csvContent += row.join(",") + "\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `revenue_report_${timeRange}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGeneratePDF = async () => {
        try {
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            // --- HEADER ---
            doc.setFillColor(18, 18, 18);
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(212, 175, 55); // GOLD
            doc.setFontSize(22);
            doc.text("REVENUE ANALYTICS", 14, 20);

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
            doc.text(`Generated: ${dateStr}`, 14, 30);
            doc.text(`PERIOD: ${timeRange.toUpperCase().replace('-', ' ')}`, pageWidth - 14, 20, { align: 'right' });

            let yPos = 50;

            // --- KPI SUMMARY ---
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.text("EXECUTIVE SUMMARY", 14, yPos);
            yPos += 10;

            const kpiData = [
                ['Total Revenue', `Rs. ${Number(data.revenue || 0).toLocaleString('en-IN')}`],
                ['Total Visitors', Number(data.visitors || 0).toLocaleString('en-IN')],
                ['Avg Ticket Size', `Rs. ${Number(data.avgTicket || 0).toLocaleString('en-IN')}`],
                ['Est. Product Sales', `Rs. ${Math.floor(data.revenue * 0.15).toLocaleString('en-IN')}`]
            ];

            autoTable(doc, {
                startY: yPos,
                head: [['KPI', 'Value']],
                body: kpiData,
                theme: 'grid',
                headStyles: { fillColor: [20, 20, 20], textColor: [212, 175, 55] },
                styles: { fontSize: 10, cellPadding: 6 },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
            });

            yPos = (doc as any).lastAutoTable.finalY + 15;

            // --- DETAILED BREAKDOWN ---
            doc.setFontSize(14);
            doc.text("DETAILED REVENUE BREAKDOWN", 14, yPos);
            yPos += 10;

            const tableRows = data.detailedList.map((item: any) => [
                item.date,
                `Rs. ${Number(item.revenue || 0).toLocaleString('en-IN')}`,
                item.visitors,
                `Rs. ${Number(item.avgTicket || 0).toLocaleString('en-IN')}`
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Date', 'Revenue', 'Visitors', 'Avg Ticket']],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255] },
                styles: { fontSize: 9 },
                columnStyles: { 1: { fontStyle: 'bold', textColor: [0, 100, 0] } } // Greenish for revenue
            });

            doc.save(`Revenue_Report_${timeRange}_${new Date().getTime()}.pdf`);

        } catch (error) {
            console.error("PDF Gen Error", error);
            alert("Failed to generate PDF");
        }
    };

    return (
        <div className="app-container">
            <Sidebar userType="manager" />
            <div className="main-content">
                <HeaderWithLogo title="REVENUE ANALYTICS" onLogout={onLogout} />

                <div className="content-area">
                    {/* --- CONTROL BAR --- */}
                    <div className="card no-print" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <Filter size={18} color="#888" />
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                style={{
                                    background: '#111', color: '#fff', border: '1px solid #333', padding: '8px 12px', borderRadius: '6px', outline: 'none', fontWeight: 600
                                }}
                            >
                                <option value="month">📅 This Month (Sep 2026)</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="last-3-months">Last 3 Months</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleDownloadCSV} className="button button-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                                <Download size={16} /> Export to Excel/CSV
                            </button>
                            <button onClick={handleGeneratePDF} className="button button-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                                <Printer size={16} /> PDF Report
                            </button>
                        </div>
                    </div>

                    <div className="print-header" style={{ display: 'none', marginBottom: '20px' }}>
                        <h1>Revenue Report</h1>
                        <p>Period: {timeRange.toUpperCase()}</p>
                    </div>

                    {/* --- KPI CARDS --- */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">TOTAL REVENUE</div>
                            <div className="stat-value" style={{ color: 'var(--accent-gold)' }}>₹{Number(data.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', marginTop: '5px' }}>
                                <ArrowUpRight size={14} style={{ marginRight: '4px' }} /> {data.trend} vs last period
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">TOTAL VISITORS</div>
                            <div className="stat-value">{Number(data.visitors || 0).toLocaleString('en-IN')}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">AVG TICKET SIZE</div>
                            <div className="stat-value" style={{ color: '#06b6d4' }}>₹{Number(data.avgTicket || 0).toLocaleString('en-IN')}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">PRODUCT SALES</div>
                            <div className="stat-value" style={{ color: '#f59e0b' }}>₹{Math.floor(data.revenue * 0.15).toLocaleString('en-IN')}</div>
                        </div>
                    </div>

                    {/* --- DETAILED REVENUE LIST (SCROLLABLE) --- */}
                    <div className="card avoid-break" style={{ marginTop: '20px' }}>
                        <div className="card-title">
                            Detailed Revenue Breakdown <span style={{ fontSize: '12px', color: '#888' }}>(Daily Breakdown)</span>
                        </div>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #333', borderRadius: '4px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#1a1a1a', zIndex: 1 }}>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #444' }}>DATE / MONTH</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #444' }}>REVENUE</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #444' }}>VISITORS</th>
                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #444' }}>AVG TICKET</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.detailedList.map((item: any, idx: number) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #333', background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                            <td style={{ padding: '12px' }}>{item.date}</td>
                                            <td style={{ padding: '12px', color: 'var(--accent-gold)' }}>₹{Number(item.revenue || 0).toLocaleString('en-IN')}</td>
                                            <td style={{ padding: '12px' }}>{item.visitors}</td>
                                            <td style={{ padding: '12px', color: '#888' }}>₹{Number(item.avgTicket || 0).toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* --- TREND CHART --- */}
                    <div className="card avoid-break" style={{ marginTop: '20px' }}>
                        <div className="card-title">Revenue Trend</div>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.chartData}>
                                    <defs>
                                        <linearGradient id="colorSalesM" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="time" stroke="#666" />
                                    <YAxis stroke="#666" />
                                    <Tooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #444', color: '#fff' }} />
                                    <Area type="monotone" dataKey="sales" stroke="#8884d8" fillOpacity={1} fill="url(#colorSalesM)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
