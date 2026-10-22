import React, { useState, useEffect } from 'react';
import '../../theme.css';
import { staffService, Staff } from '../../services/staffService';
import { attendanceService, AttendanceRecord } from '../../services/attendanceService';
import { LogOut } from 'lucide-react';

const AttendancePage: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  // Initial Load
  useEffect(() => {
    loadData();
    // Optional: Real-time poll every 10s to keep sync with Manager side
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);
  const loadData = async () => {
    const staff = await staffService.getStaffByBranch();
    setStaffList(staff.filter(s => s.status !== 'Inactive'));

    const today = new Date().toISOString().split('T')[0];
    const dailyData = await attendanceService.getDateRecords(today);
    setRecords(dailyData);
    setLoading(false);
  };

  const handleMarkAttendance = async (staff: Staff, status: 'Present' | 'Late' | 'Absent') => {
    await attendanceService.checkIn(staff.id, staff.name, staff.role, status);
    loadData(); // Refresh immediately
  };

  const handleCheckOut = async (staffId: string) => {
    await attendanceService.checkOut(staffId);
    loadData();
  };

  const handleEditTime = async (recordId: string, type: 'checkIn' | 'checkOut', current: string) => {
    const newTime = window.prompt(`Edit ${type === 'checkIn' ? 'Check In' : 'Check Out'} Time (e.g., 09:30 AM):`, current);
    if (newTime && newTime !== current) {
      await attendanceService.updateTime(recordId, type, newTime);
      loadData();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'var(--success)'; // Green
      case 'Late': return '#f59e0b'; // Amber
      case 'Absent': return '#ef4444'; // Red
      default: return 'var(--text-gray)';
    }
  };
  const calculateDuration = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || checkIn === '--:--') return '-';
    if (!checkOut || checkOut === '--:--') return 'Running';

    const parseTime = (timeStr: string) => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    try {
      const start = parseTime(checkIn);
      const end = parseTime(checkOut);

      let diff = end - start;
      if (diff < 0) diff += 24 * 60;

      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return `${h}h ${m}m`;
    } catch (e) {
      return '-';
    }
  };

  // Merge Staff + Attendance
  const mergedData = staffList.map(staff => {
    const record = records.find(r => r.staffId === staff.id);
    return {
      ...staff,
      attendance: record || null
    };
  });

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
        Loading real-time attendance...
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: '20px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <div className="card-title">Staff Attendance Management</div>

      <div style={{ marginBottom: '20px' }}>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Staff</div>
            <div className="stat-value">{staffList.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Present</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {records.filter(r => r.status === 'Present').length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Late</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>
              {records.filter(r => r.status === 'Late').length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Absent</div>
            <div className="stat-value" style={{ color: '#ef4444' }}>
              {records.filter(r => r.status === 'Absent').length}
            </div>
          </div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#888', fontSize: '12px' }}>
            <th style={{ padding: '12px' }}>Staff Name</th>
            <th style={{ padding: '12px' }}>Position</th>
            <th style={{ padding: '12px' }}>Status</th>
            <th style={{ padding: '12px' }}>Check In</th>
            <th style={{ padding: '12px' }}>Check Out</th>
            <th style={{ padding: '12px' }}>Work Hours</th>
            <th style={{ padding: '12px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {mergedData.length > 0 ? mergedData.map((item) => (
            <tr key={item.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
              <td style={{ padding: '12px' }}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
              </td>
              <td style={{ padding: '12px', color: '#aaa' }}>{item.role}</td>
              <td style={{ padding: '12px' }}>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: item.attendance ? (item.attendance.status === 'Present' ? 'rgba(16,185,129,0.1)' : item.attendance.status === 'Late' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)') : 'rgba(255,255,255,0.05)',
                    color: item.attendance ? getStatusColor(item.attendance.status) : '#888'
                  }}
                >
                  {item.attendance ? item.attendance.status.toUpperCase() : 'NOT MARKED'}
                </span>
              </td>
              <td style={{ padding: '12px' }}>{item.attendance?.checkIn || '-'}</td>
              <td style={{ padding: '12px' }}>{item.attendance?.checkOut || '-'}</td>
              <td style={{ padding: '12px', color: '#ccc' }}>
                {calculateDuration(item.attendance?.checkIn, item.attendance?.checkOut)}
              </td>
              <td style={{ padding: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!item.attendance || item.attendance.status === 'Absent' ? (
                    <>
                      <button
                        className="button"
                        style={{ background: 'var(--success)', color: '#000', padding: '6px 12px', fontSize: '12px', border: 'none' }}
                        onClick={() => handleMarkAttendance(item, 'Present')}
                      >
                        Present
                      </button>
                      <button
                        className="button"
                        style={{ background: '#f59e0b', color: '#000', padding: '6px 12px', fontSize: '12px', border: 'none' }}
                        onClick={() => handleMarkAttendance(item, 'Late')}
                      >
                        Late
                      </button>
                      <button
                        className="button"
                        style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => handleMarkAttendance(item, 'Absent')}
                      >
                        Absent
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {item.attendance.checkOut === '--:--' ? (
                        <button
                          className="button"
                          style={{ background: '#333', border: '1px solid #555', color: '#fff', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
                          onClick={() => handleCheckOut(item.id)}
                        >
                          <LogOut size={12} /> Check Out
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>Completed</span>
                      )}
                      
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          className="button"
                          style={{ background: 'transparent', border: '1px solid #D4AF37', color: '#D4AF37', padding: '4px 8px', fontSize: '10px' }}
                          onClick={() => handleEditTime(item.attendance!.id!, 'checkIn', item.attendance!.checkIn)}
                        >
                          Edit In
                        </button>
                        {item.attendance.checkOut !== '--:--' && (
                          <button
                            className="button"
                            style={{ background: 'transparent', border: '1px solid #D4AF37', color: '#D4AF37', padding: '4px 8px', fontSize: '10px' }}
                            onClick={() => handleEditTime(item.attendance!.id!, 'checkOut', item.attendance!.checkOut)}
                          >
                            Edit Out
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
                No staff members found. Please ask your Manager to add staff.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export default AttendancePage;