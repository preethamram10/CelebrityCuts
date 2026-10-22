import React, { useState, useEffect } from 'react';
import HeaderWithLogo from '../components/HeaderWithLogo';
import Sidebar from '../components/Sidebar';
import { appointmentService, Appointment } from '../services/appointmentService';
import { authService, isSameBranch } from '../services/authService';
import { getISTDateString } from '../utils/dateUtils';
import { Calendar, Clock, Plus, Search, CheckCircle, Clock3, XCircle, Share2, MapPin, Trash2, Check, UserCheck, CalendarCheck, Edit2 } from 'lucide-react';
import { AnalogClockPickerModal } from '../components/AnalogClockPickerModal';
import '../theme.css';

// Helper to convert 12h "11:30 AM" to 24h "11:30" for <input type="time">
const convert12to24 = (time12: string): string => {
  if (!time12) return '11:00';
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12.includes(':') ? time12 : '11:00';
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

// Helper to convert 24h "13:30" or input to 12h "01:30 PM"
const convert24to12 = (time24: string): string => {
  if (!time24) return '11:00 AM';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].slice(0, 2);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

const TimePickerField: React.FC<{
  value: string;
  onChange: (val: string) => void;
  label?: string;
}> = ({ value, onChange, label = 'Appointment Time *' }) => {
  const [showAnalogClock, setShowAnalogClock] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <label style={{ color: '#aaa', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowAnalogClock(true)}
          style={{
            background: 'rgba(212, 175, 55, 0.15)',
            color: 'var(--accent-gold)',
            border: '1px solid var(--accent-gold)',
            padding: '3px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Clock size={12} /> 🕒 Analog Clock
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Native Clock Popup Input */}
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="time"
            value={convert12to24(value)}
            onChange={e => onChange(convert24to12(e.target.value))}
            style={{
              width: '100%',
              background: '#222',
              border: '1px solid #444',
              color: '#fff',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Display Current Selected 12-Hour Time & Trigger Analog Clock */}
        <button
          type="button"
          onClick={() => setShowAnalogClock(true)}
          title="Open Interactive Analog Clock"
          style={{
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid var(--accent-gold)',
            color: 'var(--accent-gold)',
            padding: '12px 14px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '13px',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Clock size={14} /> {value || 'Select Time'}
        </button>
      </div>

      {/* Analog Clock Modal Popup */}
      <AnalogClockPickerModal
        isOpen={showAnalogClock}
        onClose={() => setShowAnalogClock(false)}
        initialTime={value}
        onSelectTime={onChange}
      />
    </div>
  );
};

export const AppointmentsSection: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(getISTDateString());
  const [searchTerm, setSearchTerm] = useState('');

  // Book Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [targetBranchId, setTargetBranchId] = useState('branch2');
  const [appointmentTime, setAppointmentTime] = useState('11:00 AM');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editTargetBranchId, setEditTargetBranchId] = useState('branch2');
  const [editAppointmentDate, setEditAppointmentDate] = useState('');
  const [editAppointmentTime, setEditAppointmentTime] = useState('11:00 AM');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'visited' | 'cancelled'>('pending');
  const [savingEdit, setSavingEdit] = useState(false);

  const currentUser = authService.getCurrentUser();
  const rawBranch = currentUser?.branchId || currentUser?.branchName || currentUser?.username || '';

  const getBranchIdNormalized = (bStr: string) => {
    if (bStr === 'all') return 'all';
    if (isSameBranch(bStr, 'branch4')) return 'branch4';
    if (isSameBranch(bStr, 'branch3')) return 'branch3';
    if (isSameBranch(bStr, 'branch2')) return 'branch2';
    return 'branch1';
  };

  const activeUserBranchId = getBranchIdNormalized(rawBranch);

  // Branch list
  const BRANCH_OPTIONS = [
    { id: 'branch1', name: 'Main Branch' },
    { id: 'branch2', name: 'Vizag Branch' },
    { id: 'branch3', name: 'Vijayawada Branch' },
    { id: 'branch4', name: 'Hyderabad Branch' }
  ];

  useEffect(() => {
    if (activeUserBranchId && activeUserBranchId !== 'all') {
      setTargetBranchId(activeUserBranchId);
    }
    loadAppointments();
  }, [selectedDate, activeUserBranchId]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAppointments(activeUserBranchId, selectedDate);
      setAppointments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please fill in Customer Name and Mobile Number.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedTargetObj = BRANCH_OPTIONS.find(b => b.id === targetBranchId);
      const bookedByObj = BRANCH_OPTIONS.find(b => isSameBranch(b.id, activeUserBranchId)) || { name: 'Reception' };

      await appointmentService.createAppointment({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        appointment_date: selectedDate,
        appointment_time: appointmentTime,
        target_branch_id: targetBranchId,
        target_branch_name: selectedTargetObj ? selectedTargetObj.name : 'Branch',
        booked_by_branch_id: activeUserBranchId,
        booked_by_branch_name: `${bookedByObj.name} Reception`,
        notes: notes.trim()
      });

      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      setIsModalOpen(false);

      await loadAppointments();
      alert(`Appointment successfully booked for ${selectedTargetObj?.name || 'Branch'}!`);
    } catch (err: any) {
      alert('Error creating appointment: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (apt: Appointment) => {
    setEditingApt(apt);
    setEditCustomerName(apt.customer_name);
    setEditCustomerPhone(apt.customer_phone);
    setEditTargetBranchId(apt.target_branch_id);
    setEditAppointmentDate(apt.appointment_date);
    setEditAppointmentTime(apt.appointment_time);
    setEditNotes(apt.notes || '');
    setEditStatus(apt.status);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt) return;
    if (!editCustomerName.trim() || !editCustomerPhone.trim()) {
      alert('Please fill in Customer Name and Mobile Number.');
      return;
    }

    setSavingEdit(true);
    try {
      const selectedTargetObj = BRANCH_OPTIONS.find(b => b.id === editTargetBranchId);

      await appointmentService.updateAppointment(editingApt.id, {
        customer_name: editCustomerName.trim(),
        customer_phone: editCustomerPhone.trim(),
        target_branch_id: editTargetBranchId,
        target_branch_name: selectedTargetObj ? selectedTargetObj.name : 'Branch',
        appointment_date: editAppointmentDate,
        appointment_time: editAppointmentTime,
        notes: editNotes.trim(),
        status: editStatus
      });

      setIsEditModalOpen(false);
      setEditingApt(null);
      await loadAppointments();
      alert('Appointment updated successfully!');
    } catch (err: any) {
      alert('Error updating appointment: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'pending' | 'visited' | 'cancelled') => {
    await appointmentService.updateStatus(id, newStatus);
    setAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      await appointmentService.deleteAppointment(id);
      setAppointments(prev => prev.filter(apt => apt.id !== id));
    }
  };

  const handleWhatsAppReminder = (apt: Appointment) => {
    const text =
      `Hello ${apt.customer_name},\n\n` +
      `Reminder for your appointment at *Celebrity Cuts (${apt.target_branch_name})*:\n` +
      `📅 Date: ${apt.appointment_date}\n` +
      `⏰ Time: ${apt.appointment_time}\n` +
      (apt.notes ? `📝 Note: ${apt.notes}\n` : '') +
      `\nWe look forward to seeing you!\n` +
      `_Celebrity Cuts — Professional Salon Brand_`;

    window.open(`https://wa.me/91${apt.customer_phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredAppointments = appointments.filter(apt => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      apt.customer_name.toLowerCase().includes(term) ||
      apt.customer_phone.includes(term) ||
      apt.target_branch_name.toLowerCase().includes(term) ||
      apt.appointment_time.toLowerCase().includes(term)
    );
  });

  const totalCount = filteredAppointments.length;
  const visitedCount = filteredAppointments.filter(a => a.status === 'visited').length;
  const pendingCount = filteredAppointments.filter(a => a.status === 'pending').length;
  const cancelledCount = filteredAppointments.filter(a => a.status === 'cancelled').length;

  const getBranchBadgeStyle = (branchId: string) => {
    if (isSameBranch(branchId, 'branch4')) return { bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '#a855f7' };
    if (isSameBranch(branchId, 'branch3')) return { bg: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', border: '#ec4899' };
    if (isSameBranch(branchId, 'branch2')) return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '#3b82f6' };
    return { bg: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent-gold)', border: 'var(--accent-gold)' };
  };

  return (
    <div style={{ width: '100%' }}>
      {/* PAGE TITLE & HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarCheck size={26} color="var(--accent-gold)" /> Reception Appointments Portal
          </h1>
          <p style={{ color: '#888', fontSize: '14px', marginTop: '4px' }}>
            Book appointments for any branch (Vizag, Vijayawada, Main Branch) and track Visited OPD status in real time.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: 'var(--accent-gold)',
            color: '#000',
            border: 'none',
            padding: '12px 22px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          <Plus size={18} /> Book New Appointment
        </button>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '110px', justifyContent: 'center' }}>
          <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Total Appointments</div>
          <div style={{ color: '#fff', fontSize: '36px', fontWeight: 700, lineHeight: 1 }}>{totalCount}</div>
        </div>

        <div className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '110px', justifyContent: 'center' }}>
          <div style={{ color: '#10b981', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCheck size={16} /> Visited OPD (Completed)
          </div>
          <div style={{ color: '#10b981', fontSize: '36px', fontWeight: 700, lineHeight: 1 }}>{visitedCount}</div>
        </div>

        <div className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '110px', justifyContent: 'center' }}>
          <div style={{ color: '#f59e0b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock3 size={16} /> Pending / Awaiting Arrival
          </div>
          <div style={{ color: '#f59e0b', fontSize: '36px', fontWeight: 700, lineHeight: 1 }}>{pendingCount}</div>
        </div>

        <div className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '110px', justifyContent: 'center' }}>
          <div style={{ color: '#ef4444', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <XCircle size={16} /> Cancelled
          </div>
          <div style={{ color: '#ef4444', fontSize: '36px', fontWeight: 700, lineHeight: 1 }}>{cancelledCount}</div>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ color: '#aaa', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} color="var(--accent-gold)" /> Select Date:
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #444',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={() => setSelectedDate(getISTDateString())}
            style={{
              background: selectedDate === getISTDateString() ? 'var(--accent-gold)' : '#222',
              color: selectedDate === getISTDateString() ? '#000' : '#ccc',
              border: '1px solid #444',
              padding: '8px 14px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Today
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '320px', background: '#1a1a1a', padding: '8px 14px', borderRadius: '6px', border: '1px solid #333' }}>
          <Search size={16} color="#666" />
          <input
            type="text"
            placeholder="Search Name, Mobile, Time..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none', fontSize: '14px' }}
          />
        </div>
      </div>

      {/* APPOINTMENTS TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1150px' }}>
            <thead>
              <tr style={{ color: '#888', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #333', background: '#111' }}>
                <th style={{ padding: '16px 14px', fontWeight: 600 }}>S.No</th>
                <th style={{ padding: '16px 14px', fontWeight: 600 }}>Time</th>
                <th style={{ padding: '16px 14px', fontWeight: 600 }}>Customer Name</th>
                <th style={{ padding: '16px 14px', fontWeight: 600 }}>Mobile Number</th>
                <th style={{ padding: '16px 14px', fontWeight: 600 }}>Assigned Branch</th>
                <th style={{ padding: '16px 14px', fontWeight: 600 }}>Booked By</th>
                <th style={{ padding: '16px 14px', fontWeight: 600, textAlign: 'center' }}>Visited OPD Status</th>
                <th style={{ padding: '16px 14px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                    Loading appointments...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                    No appointments found for {selectedDate}. Click <strong>"+ Book New Appointment"</strong> to add one.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt, index) => {
                  const badge = getBranchBadgeStyle(apt.target_branch_id);
                  return (
                    <tr key={apt.id} style={{ borderBottom: '1px solid #222', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px 14px', color: '#888', fontWeight: 600 }}>{index + 1}</td>
                      <td style={{ padding: '16px 14px', color: 'var(--accent-gold)', fontWeight: 700 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} /> {apt.appointment_time}
                        </span>
                      </td>
                      <td style={{ padding: '16px 14px', color: '#fff', fontWeight: 600, fontSize: '15px' }}>
                        {apt.customer_name}
                      </td>
                      <td style={{ padding: '16px 14px', color: '#ccc' }}>{apt.customer_phone}</td>
                      <td style={{ padding: '16px 14px' }}>
                        <span style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <MapPin size={12} /> {apt.target_branch_name}
                        </span>
                      </td>
                      <td style={{ padding: '16px 14px', color: '#aaa', fontSize: '13px' }}>
                        {apt.booked_by_branch_name}
                      </td>

                      {/* VISITED OPD STATUS */}
                      <td style={{ padding: '16px 14px', textAlign: 'center' }}>
                        {apt.status === 'visited' && (
                          <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle size={14} /> Visited OPD
                          </span>
                        )}
                        {apt.status === 'pending' && (
                          <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid #f59e0b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Clock3 size={14} /> Awaiting Arrival
                          </span>
                        )}
                        {apt.status === 'cancelled' && (
                          <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <XCircle size={14} /> Cancelled
                          </span>
                        )}
                      </td>

                      {/* ACTION BUTTONS */}
                      <td style={{ padding: '16px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleEditClick(apt)}
                            title="Edit Appointment Date & Time"
                            style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#3b82f6',
                              border: '1px solid #3b82f6',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontWeight: 600,
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Edit2 size={14} /> Edit
                          </button>

                          {apt.status !== 'visited' && (
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'visited')}
                              title="Mark Visited OPD"
                              style={{
                                background: '#10b981',
                                color: '#000',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Check size={14} /> Visited
                            </button>
                          )}

                          {apt.status === 'visited' && (
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'pending')}
                              title="Mark Pending"
                              style={{
                                background: '#222',
                                color: '#f59e0b',
                                border: '1px solid #f59e0b',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Mark Pending
                            </button>
                          )}

                          {apt.status !== 'cancelled' && (
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                              title="Cancel Appointment"
                              style={{
                                background: 'transparent',
                                color: '#ef4444',
                                border: '1px solid #ef4444',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          )}

                          <button
                            onClick={() => handleWhatsAppReminder(apt)}
                            title="Send WhatsApp Reminder"
                            style={{
                              background: 'rgba(37, 211, 102, 0.2)',
                              color: '#25D366',
                              border: '1px solid #25D366',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Share2 size={14} />
                          </button>

                          <button
                            onClick={() => handleDelete(apt.id)}
                            title="Delete"
                            style={{ background: 'transparent', color: '#666', border: 'none', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOOK APPOINTMENT MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#141414',
            border: '2px solid var(--accent-gold)',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '540px',
            padding: '28px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} color="var(--accent-gold)" /> Book New Appointment
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '20px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#222',
                    border: '1px solid #444',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9848022338"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#222',
                    border: '1px solid #444',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* TARGET BRANCH DROPDOWN */}
              <div>
                <label style={{ display: 'block', color: 'var(--accent-gold)', fontSize: '12px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                  Assign To Branch * (Select Branch)
                </label>
                <select
                  value={targetBranchId}
                  onChange={e => setTargetBranchId(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#1f1a0e',
                    border: '2px solid var(--accent-gold)',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value="branch1">📍 Main Branch</option>
                  <option value="branch2">📍 Vizag Branch</option>
                  <option value="branch3">📍 Vijayawada Branch</option>
                  <option value="branch4">📍 Hyderabad Branch</option>
                </select>
                <p style={{ color: '#888', fontSize: '11px', marginTop: '4px' }}>
                  Select target branch for this appointment. It will instantly appear on that branch's reception portal.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>
                  Appointment Date *
                </label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#222',
                    border: '1px solid #444',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Clock Time Picker Component */}
              <TimePickerField
                value={appointmentTime}
                onChange={setAppointmentTime}
                label="Appointment Time (Clock Picker) *"
              />

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    background: '#222',
                    color: '#ccc',
                    border: '1px solid #444',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    background: 'var(--accent-gold)',
                    color: '#000',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {submitting ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT APPOINTMENT MODAL */}
      {isEditModalOpen && editingApt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#141414',
            border: '2px solid #3b82f6',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '540px',
            padding: '28px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={20} color="#3b82f6" /> Edit Appointment
              </h2>
              <button
                onClick={() => { setIsEditModalOpen(false); setEditingApt(null); }}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '20px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={editCustomerName}
                  onChange={e => setEditCustomerName(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#222',
                    border: '1px solid #444',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={editCustomerPhone}
                  onChange={e => setEditCustomerPhone(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#222',
                    border: '1px solid #444',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'var(--accent-gold)', fontSize: '12px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                  Assigned Branch *
                </label>
                <select
                  value={editTargetBranchId}
                  onChange={e => setEditTargetBranchId(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#1f1a0e',
                    border: '2px solid var(--accent-gold)',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  <option value="branch1">📍 Main Branch</option>
                  <option value="branch2">📍 Vizag Branch</option>
                  <option value="branch3">📍 Vijayawada Branch</option>
                  <option value="branch4">📍 Hyderabad Branch</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editAppointmentDate}
                    onChange={e => setEditAppointmentDate(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#222',
                      border: '1px solid #444',
                      color: '#fff',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase' }}>
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: '#222',
                      border: '1px solid #444',
                      color: '#fff',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="pending">⏳ Pending / Awaiting</option>
                    <option value="visited">✅ Visited OPD</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Clock Time Picker Component */}
              <TimePickerField
                value={editAppointmentTime}
                onChange={setEditAppointmentTime}
                label="Appointment Time (Clock Picker) *"
              />

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingApt(null); }}
                  style={{
                    flex: 1,
                    background: '#222',
                    color: '#ccc',
                    border: '1px solid #444',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{
                    flex: 2,
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {savingEdit ? 'Saving Changes...' : 'Save Appointment Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface AppointmentsPageProps {
  onLogout?: () => void;
}

const AppointmentsPage: React.FC<AppointmentsPageProps> = ({ onLogout }) => {
  const currentUser = authService.getCurrentUser();
  const userRole = currentUser?.role || 'billing';
  const sidebarRole = userRole === 'admin' ? 'admin' : userRole === 'manager' ? 'manager' : 'billing';

  const handleLogoutAction = () => {
    if (onLogout) {
      onLogout();
    } else {
      authService.logout();
      window.location.hash = '#/login';
    }
  };

  return (
    <div className="app-container" style={{ background: 'var(--primary-dark)', minHeight: '100vh', display: 'flex' }}>
      <Sidebar userType={sidebarRole} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <HeaderWithLogo onLogout={handleLogoutAction} />
        <div style={{ padding: '30px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
          <AppointmentsSection />
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;
