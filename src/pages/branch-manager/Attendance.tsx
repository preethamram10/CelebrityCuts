import { useState, useEffect } from 'react';
import HeaderWithLogo from '../../components/HeaderWithLogo';
import Sidebar from '../../components/Sidebar';
import { Download, Printer, Calendar as CalendarIcon, User } from 'lucide-react';
import { attendanceService, AttendanceRecord } from '../../services/attendanceService';
import { staffService, Staff } from '../../services/staffService';

interface AttendancePageProps {
    onLogout: () => void;
}
export default function ManagerAttendance({ onLogout }: AttendancePageProps) {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [staffList, setStaffList] = useState<Staff[]>([]);

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        const staff = await staffService.getStaffByBranch();
        setStaffList(staff);
    };

    // Helper to calculate duration
    const calculateDuration = (checkIn: string, checkOut: string) => {
        if (!checkIn || checkIn === '--:--') return '-';
        if (!checkOut || checkOut === '--:--') return 'Running';

        const parseTime = (timeStr: string) => {
            const [time, period] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
        };

        const start = parseTime(checkIn);
        const end = parseTime(checkOut);

        let diff = end - start;
        if (diff < 0) diff += 24 * 60; // Handle overnight if needed, though rare for shifts

        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return `${h}h ${m}m`;
    };

    // Fetch Records on Filter Change
    useEffect(() => {
        const fetchRecords = async () => {
            if (viewMode === 'daily') {
                // Get records for the selected date
                const dailyData = await attendanceService.getDateRecords(selectedDate);

                // Merge with staff list to show "Absent" for those who haven't checked in
                const fullList = staffList.map(staff => {
                    const found = dailyData.find(r => r.staffId === staff.id);
                    if (found) {
                        return {
                            ...found,
                            workHours: calculateDuration(found.checkIn, found.checkOut)
                        };
                    }
                    return {
                        date: selectedDate,
                        checkIn: '--:--',
                        checkOut: '--:--',
                        status: 'Absent' as const,
                        workHours: '-',
                        staffId: staff.id,
                        staffName: staff.name,
                        staffRole: staff.role,
                        branchId: staff.branchId
                    };
                });
                setRecords(fullList);
            } else {
                // Monthly View
                if (selectedStaffId === 'all') {
                    setRecords([]);
                } else {
                    const data = await attendanceService.getStaffRecords(selectedStaffId);
                    const staffData = data.map(r => ({
                        ...r,
                        workHours: calculateDuration(r.checkIn, r.checkOut)
                    }));
                    setRecords(staffData);
                }
            }
        };
        fetchRecords();
    }, [selectedDate, selectedStaffId, viewMode, staffList]);

    // Stats for Daily View
    const dailyStats = {
        total: staffList.length,
        present: records.filter(r => r.status === 'Present' || r.status === 'Late').length,
        late: records.filter(r => r.status === 'Late').length,
        absent: records.filter(r => r.status === 'Absent' || r.status === 'Leave').length
    };

    const handleDownloadCSV = () => {
        const headers = ['Staff Name', 'Date', 'Status', 'Check In', 'Check Out', 'Work Hours'];
        const rows = records.map((r) => [r.staffName, r.date, r.status, r.checkIn, r.checkOut, r.workHours]);

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += `Attendance Report\n\n`;
        csvContent += headers.join(",") + "\n";
        rows.forEach(row => csvContent += row.join(",") + "\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "attendance_report.csv");
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
            doc.setFillColor(18, 18, 18); // Dark BG
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(212, 175, 55); // GOLD
            doc.setFontSize(20);
            const title = viewMode === 'daily' ? `DAILY ATTENDANCE: ${selectedDate}` : `MONTHLY LOG: ${selectedStaffId === 'all' ? 'ALL STAFF' : selectedStaffId}`;
            doc.text(title, 14, 20);

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            doc.text(`Generated: ${dateStr}`, 14, 30);
            doc.text("MANAGER COPY", pageWidth - 14, 20, { align: 'right' });

            let yPos = 50;

            // --- SUMMARY SECTION (Daily Only) ---
            if (viewMode === 'daily') {
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(14);
                doc.text("DAILY SUMMARY", 14, yPos);
                yPos += 10;

                autoTable(doc, {
                    startY: yPos,
                    head: [['Metric', 'Count']],
                    body: [
                        ['Total Staff', dailyStats.total],
                        ['Present', dailyStats.present],
                        ['Late', dailyStats.late],
                        ['Absent', dailyStats.absent]
                    ],
                    theme: 'grid',
                    headStyles: { fillColor: [20, 20, 20], textColor: [212, 175, 55] },
                    styles: { fontSize: 10, cellPadding: 5 }
                });
                yPos = (doc as any).lastAutoTable.finalY + 15;
            }

            // --- ATTENDANCE TABLE ---
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.text("ATTENDANCE RECORDS", 14, yPos);
            yPos += 10;

            const tableRows = records.map(r => [
                viewMode === 'monthly' ? r.date : selectedDate,
                r.staffName || '-',
                r.staffRole || '-',
                r.status,
                r.checkIn,
                r.checkOut,
                r.workHours
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['Date', 'Name', 'Role', 'Status', 'Check In', 'Check Out', 'Hours']],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255] },
                styles: { fontSize: 9 },
                didParseCell: (data: any) => {
                    if (data.section === 'body' && data.column.index === 3) {
                        const status = data.cell.raw;
                        if (status === 'Present') data.cell.styles.textColor = [16, 185, 129]; // Green
                        if (status === 'Late') data.cell.styles.textColor = [245, 158, 11]; // Orange
                        if (status === 'Absent') data.cell.styles.textColor = [239, 68, 68]; // Red
                    }
                }
            });

            doc.save(`Attendance_Report_${new Date().getTime()}.pdf`);

        } catch (error) {
            console.error("PDF Generation failed", error);
            alert("Failed to generate PDF");
        }
    };

    return (
        <div className="app-container">
            <Sidebar userType="manager" />
            <div className="main-content">
                <HeaderWithLogo title="ATTENDANCE TRACKING (LIVE)" onLogout={onLogout} />

                <div className="content-area">
                    {/* --- CONTROLS --- */}
                    <div className="card" style={{ marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>

                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* View Mode Toggle */}
                            <div style={{ display: 'flex', background: '#111', borderRadius: '6px', border: '1px solid #333', overflow: 'hidden' }}>
                                <button
                                    onClick={() => setViewMode('daily')}
                                    style={{
                                        padding: '8px 16px', border: 'none', background: viewMode === 'daily' ? 'var(--accent-gold)' : 'transparent',
                                        color: viewMode === 'daily' ? '#000' : '#888', fontWeight: 600, cursor: 'pointer'
                                    }}>
                                    Daily View
                                </button>
                                <button
                                    onClick={() => setViewMode('monthly')}
                                    style={{
                                        padding: '8px 16px', border: 'none', background: viewMode === 'monthly' ? 'var(--accent-gold)' : 'transparent',
                                        color: viewMode === 'monthly' ? '#000' : '#888', fontWeight: 600, cursor: 'pointer'
                                    }}>
                                    Monthly Log
                                </button>
                            </div>

                            {/* Date Picker (Only for Daily) */}
                            {viewMode === 'daily' && (
                                <div style={{ position: 'relative' }}>
                                    <CalendarIcon size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: '8px 10px 8px 32px', borderRadius: '6px', outline: 'none' }}
                                    />
                                </div>
                            )}

                            {/* Staff Selector */}
                            <div style={{ position: 'relative' }}>
                                <User size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                                <select
                                    value={selectedStaffId}
                                    onChange={(e) => setSelectedStaffId(e.target.value)}
                                    style={{
                                        background: '#111', color: '#fff', border: '1px solid #333',
                                        padding: '8px 10px 8px 32px', borderRadius: '6px', outline: 'none',
                                        minWidth: '180px'
                                    }}
                                >
                                    <option value="all">All Staff {viewMode === 'monthly' && '(Select One)'}</option>
                                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleDownloadCSV} className="button button-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                                <Download size={16} /> Export CSV
                            </button>
                            <button onClick={handleGeneratePDF} className="button button-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                                <Printer size={16} /> PDF Report
                            </button>
                        </div>
                    </div>

                    {/* --- SUMMARY CARDS (Daily Only) --- */}
                    {viewMode === 'daily' && (
                        <div className="stats-grid" style={{ marginBottom: '20px' }}>
                            <div className="stat-card">
                                <div className="stat-label">Total Staff</div>
                                <div className="stat-value">{dailyStats.total}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Present Today</div>
                                <div className="stat-value" style={{ color: '#10b981' }}>{dailyStats.present}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Late Arrivals</div>
                                <div className="stat-value" style={{ color: '#f59e0b' }}>{dailyStats.late}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Absent</div>
                                <div className="stat-value" style={{ color: '#ef4444' }}>{dailyStats.absent}</div>
                            </div>
                        </div>
                    )}

                    {/* --- DATA TABLE --- */}
                    <div className="card">
                        <div className="card-title">
                            {viewMode === 'daily' ? `Attendance for ${selectedDate}` : `Monthly Attendance Log`}
                            {viewMode === 'monthly' && selectedStaffId === 'all' && <span style={{ color: '#ef4444', fontSize: '13px', marginLeft: '10px' }}> (Please select a staff member)</span>}
                        </div>

                        {viewMode === 'monthly' && selectedStaffId === 'all' ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                Please select a staff member to view their monthly attendance log.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: '#888', fontSize: '12px' }}>
                                        {viewMode === 'monthly' && <th style={{ padding: '12px' }}>Date</th>}
                                        <th style={{ padding: '12px' }}>Staff Name</th>
                                        <th style={{ padding: '12px' }}>Role</th>
                                        <th style={{ padding: '12px' }}>Status</th>
                                        <th style={{ padding: '12px' }}>Check In</th>
                                        <th style={{ padding: '12px' }}>Check Out</th>
                                        <th style={{ padding: '12px' }}>Work Hours</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.length > 0 ? records.map((record, idx) => (
                                        <tr key={idx} style={{ background: 'rgba(255,255,255,0.02)' }}>
                                            {viewMode === 'monthly' && <td style={{ padding: '14px', color: '#ccc' }}>{record.date}</td>}
                                            <td style={{ padding: '14px', fontWeight: 600 }}>{record.staffName}</td>
                                            <td style={{ padding: '14px', color: '#aaa' }}>{record.staffRole}</td>
                                            <td style={{ padding: '14px' }}>
                                                <span style={{
                                                    color: record.status === 'Present' ? '#10b981' : (record.status === 'Late' ? '#f59e0b' : '#ef4444'),
                                                    background: record.status === 'Present' ? 'rgba(16,185,129,0.1)' : (record.status === 'Late' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239,68,68,0.1)'),
                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600
                                                }}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px' }}>{record.checkIn}</td>
                                            <td style={{ padding: '14px' }}>{record.checkOut}</td>
                                            <td style={{ padding: '14px', color: '#ccc' }}>{record.workHours}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                                                No attendance records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
