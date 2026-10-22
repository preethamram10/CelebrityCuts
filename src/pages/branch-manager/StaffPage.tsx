import React, { useState, useEffect } from 'react';
import HeaderWithLogo from '../../components/HeaderWithLogo';
import Sidebar from '../../components/Sidebar';
import { staffService, Staff } from '../../services/staffService';
import { Plus, Search, Trash2, User, Phone, Briefcase, Edit2 } from 'lucide-react';

interface StaffPageProps {
    onLogout: () => void;
}

export default function StaffPage({ onLogout }: StaffPageProps) {
    const [staffList, setStaffList] = useState<Staff[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('Stylist');
    const [newMobile, setNewMobile] = useState('');

    // Edit Form State
    const [editName, setEditName] = useState('');
    const [editRole, setEditRole] = useState('Stylist');
    const [editMobile, setEditMobile] = useState('');

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        const data = await staffService.getStaffByBranch();
        setStaffList(data);
    }

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newMobile) {
            alert("Name and Mobile are required");
            return;
        }

        try {
            await staffService.addStaff({
                name: newName,
                role: newRole,
                mobile: newMobile,
                status: 'Active'
            });

            alert("Staff Added Successfully");
            setShowAddModal(false);
            setNewName('');
            setNewMobile('');
            setNewRole('Stylist');
            loadStaff();
        } catch (error: any) {
            console.error("Error adding staff:", error);
            alert("Error adding staff: " + error.message);
        }
    }

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to remove this staff member?")) {
            await staffService.deleteStaff(id);
            loadStaff();
        }
    }

    const handleEditClick = (staff: Staff) => {
        setEditingStaff(staff);
        setEditName(staff.name);
        setEditRole(staff.role);
        setEditMobile(staff.mobile);
        setShowEditModal(true);
    }

    const handleEditStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStaff) return;
        if (!editName || !editMobile) {
            alert("Name and Mobile are required");
            return;
        }

        try {
            await staffService.updateStaff(editingStaff.id, {
                name: editName,
                role: editRole,
                mobile: editMobile
            });

            alert("Staff Updated Successfully");
            setShowEditModal(false);
            setEditingStaff(null);
            loadStaff();
        } catch (error: any) {
            console.error("Error updating staff:", error);
            alert("Error updating staff: " + error.message);
        }
    }

    const filteredStaff = staffList.filter(s =>
        s.status !== 'Inactive' && (
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.role.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    return (
        <div className="app-container">
            <Sidebar userType="manager" />
            <div className="main-content">
                <HeaderWithLogo title="STAFF MANAGEMENT" onLogout={onLogout} />

                <div className="content-area">
                    {/* Controls */}
                    <div className="card no-print" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
                            <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px 10px 10px 40px',
                                        background: '#111', border: '1px solid #333',
                                        borderRadius: '8px', color: '#fff'
                                    }}
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="button button-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Plus size={18} /> Add New Staff
                        </button>
                    </div>

                    {/* Staff List */}
                    <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {filteredStaff.map(staff => (
                            <div key={staff.id} className="card" style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                    <div style={{
                                        width: '50px', height: '50px', borderRadius: '50%',
                                        background: staff.status === 'Inactive' ? '#333' : 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        color: staff.status === 'Inactive' ? '#888' : '#000', fontWeight: 'bold', fontSize: '20px'
                                    }}>
                                        {staff.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>{staff.name}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--accent-gold)' }}>{staff.role}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#ccc' }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <Phone size={14} /> {staff.mobile}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <Briefcase size={14} /> ID: {staff.id}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <User size={14} /> Joined: {staff.joinDate}
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #333',
                                    display: 'flex', justifyContent: 'flex-end', gap: '10px'
                                }}>
                                    <button
                                        onClick={() => handleEditClick(staff)}
                                        className="button button-secondary"
                                        style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <Edit2 size={14} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(staff.id)}
                                        className="button"
                                        style={{
                                            padding: '6px 12px', fontSize: '12px',
                                            background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: '1px solid #ff4444'
                                        }}
                                    >
                                        <Trash2 size={14} /> Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add Staff Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
                        <h2 style={{ marginBottom: '20px', color: 'var(--accent-gold)' }}>Add New Staff Member</h2>
                        <form onSubmit={handleAddStaff}>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Full Name</label>
                                <input
                                    className="input-field"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Enter name"
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Role</label>
                                <input
                                    className="input-field"
                                    value={newRole}
                                    onChange={e => setNewRole(e.target.value)}
                                    placeholder="Enter or select role"
                                    list="staff-roles"
                                    required
                                />
                                <datalist id="staff-roles">
                                    <option value="Senior Stylist" />
                                    <option value="Junior Stylist" />
                                    <option value="Hair Expert" />
                                    <option value="Barber" />
                                    <option value="Make-up Artist" />
                                    <option value="Receptionist" />
                                    <option value="Helper" />
                                </datalist>
                            </div>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Mobile Number</label>
                                <input
                                    className="input-field"
                                    value={newMobile}
                                    onChange={e => setNewMobile(e.target.value)}
                                    placeholder="Enter mobile"
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} className="button button-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="button button-primary" style={{ flex: 1 }}>Save Staff</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Staff Modal */}
            {showEditModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
                        <h2 style={{ marginBottom: '20px', color: 'var(--accent-gold)' }}>Edit Staff Member</h2>
                        <form onSubmit={handleEditStaff}>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Full Name</label>
                                <input
                                    className="input-field"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    placeholder="Enter name"
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Role</label>
                                <input
                                    className="input-field"
                                    value={editRole}
                                    onChange={e => setEditRole(e.target.value)}
                                    placeholder="Enter or select role"
                                    list="edit-staff-roles"
                                    required
                                />
                                <datalist id="edit-staff-roles">
                                    <option value="Senior Stylist" />
                                    <option value="Junior Stylist" />
                                    <option value="Hair Expert" />
                                    <option value="Barber" />
                                    <option value="Make-up Artist" />
                                    <option value="Receptionist" />
                                    <option value="Helper" />
                                </datalist>
                            </div>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Mobile Number</label>
                                <input
                                    className="input-field"
                                    value={editMobile}
                                    onChange={e => setEditMobile(e.target.value)}
                                    placeholder="Enter mobile"
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => { setShowEditModal(false); setEditingStaff(null); }} className="button button-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="button button-primary" style={{ flex: 1 }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
