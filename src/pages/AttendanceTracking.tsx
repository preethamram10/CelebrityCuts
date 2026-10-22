import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import HeaderWithLogo from '../components/HeaderWithLogo';
import '../theme.css';
import { staffService, Staff } from '../services/staffService';
import { attendanceService } from '../services/attendanceService';
import { authService, isSameBranch } from '../services/authService';


interface AttendanceTrackingProps {
  onLogout?: () => void;
}

export default function AttendanceTracking({ onLogout = () => { } }: AttendanceTrackingProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [filterBranch, setFilterBranch] = useState('all');
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (staffList.length > 0) {
      loadAttendance();
    }
  }, [selectedDate, staffList, filterBranch]);

  const loadInitialData = async () => {
    const staff = await staffService.getAllStaff();
    setStaffList(staff);
    const branchUsers = await authService.getAllBranches();
    const branchList = branchUsers.map((b: any) => ({
      id: b.branchId,
      name: b.branchName || b.branchId
    }));
    const uniqueBranches = Array.from(new Map(branchList.map((item: any) => [item.id, item])).values());
    setBranches(uniqueBranches);
  };

  const loadAttendance = async () => {
    const dailyRecords = await attendanceService.getDateRecords(selectedDate);
    let merged = staffList.map(staff => {
      const found = dailyRecords.find(r => r.staffId === staff.id);
      const checkIn = found ? found.checkIn : '--:--';
      const checkOut = found ? found.checkOut : '--:--';
      return {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        branchId: staff.branchId,
        branchName: getBranchName(staff.branchId),
        status: found ? found.status : 'Absent',
        checkIn,
        checkOut,
        workHours: calculateDuration(checkIn, checkOut)
      };
    });
    if (filterBranch !== 'all') {
      merged = merged.filter(m => isSameBranch(m.branchId, filterBranch));
    }
    setRecords(merged);
  };

  const getBranchName = (id: string) => {
    const found = branches.find(b => isSameBranch(b.id, id));
    return found ? found.name : id;
  };

  const calculateDuration = (checkIn: string, checkOut: string) => {
    if (!checkIn || checkIn === '--:--') return '-';
    if (!checkOut || checkOut === '--:--') return 'Running';
    try {
      const [time1, period1] = checkIn.split(' ');
      const [time2, period2] = checkOut.split(' ');

      let [h1, m1] = time1.split(':').map(Number);
      if (period1 === 'PM' && h1 !== 12) h1 += 12;
      if (period1 === 'AM' && h1 === 12) h1 = 0;

      let [h2, m2] = time2.split(':').map(Number);
      if (period2 === 'PM' && h2 !== 12) h2 += 12;
      if (period2 === 'AM' && h2 === 12) h2 = 0;

      let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diff < 0) diff += 24 * 60;

      return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    } catch (e) { return '-'; }
  };

  const stats = {
    present: records.filter(r => r.status === 'Present' || r.status === 'Late').length,
    late: records.filter(r => r.status === 'Late').length,
    absent: records.filter(r => r.status === 'Absent').length,
    total: records.length
  };

  return (
    <div className="app-container">
      <Sidebar userType="admin" />
      <div className="main-content">
        <HeaderWithLogo title="Global Attendance Tracking" onLogout={onLogout} />
        <div className="content-area">

          {/* Controls */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>

              {/* Date */}
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '5px' }}>Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    padding: '10px', borderRadius: '8px', border: '1px solid #333',
                    background: '#111', color: '#fff', fontSize: '14px'
                  }}
                />
              </div>

              {/* Branch Filter */}
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '5px' }}>Branch</label>
                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  style={{
                    padding: '10px', borderRadius: '8px', border: '1px solid #333',
                    background: '#111', color: '#fff', fontSize: '14px', minWidth: '150px'
                  }}
                >
                  <option value="all">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Stats */}
          < div className="stats-grid" style={{ marginBottom: '20px' }
          }>
            <div className="stat-card">
              <div className="stat-label">Total Staff</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Present</div>
              <div className="stat-value" style={{ color: '#10b981' }}>{stats.present}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Late</div>
              <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.late}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Absent</div>
              <div className="stat-value" style={{ color: '#ef4444' }}>{stats.absent}</div>
            </div>
          </div >

          {/* Table */}
          < div className="card" >
            <div className="card-title">Attendance Log</div>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ color: '#888', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px' }}>Branch</th>
                  <th style={{ padding: '12px' }}>Staff Name</th>
                  <th style={{ padding: '12px' }}>Role</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Check In</th>
                  <th style={{ padding: '12px' }}>Check Out</th>
                  <th style={{ padding: '12px' }}>Work Hours</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? records.map((r, i) => (
                  <tr key={i} style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '14px' }}>
                      <span style={{ fontSize: '11px', background: '#333', padding: '2px 6px', borderRadius: '4px' }}>
                        {r.branchName}
                      </span>
                    </td>
                    <td style={{ padding: '14px', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '14px', color: '#aaa' }}>{r.role}</td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        color: r.status === 'Present' ? '#10b981' : (r.status === 'Late' ? '#f59e0b' : '#ef4444'),
                        background: r.status === 'Present' ? 'rgba(16,185,129,0.1)' : (r.status === 'Late' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239,68,68,0.1)'),
                        padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>{r.checkIn}</td>
                    <td style={{ padding: '14px' }}>{r.checkOut}</td>
                    <td style={{ padding: '14px', color: '#ccc' }}>{r.workHours}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#666' }}>No records found</td></tr>
                )}
              </tbody>
            </table>
          </div >

        </div >
      </div >
    </div >
  );
}
