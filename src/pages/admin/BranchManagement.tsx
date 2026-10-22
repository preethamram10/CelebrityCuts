import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import HeaderWithLogo from '../../components/HeaderWithLogo';
import { transactionService } from '../../services/transactionService';
import { customerService } from '../../services/customerService';
import { staffService } from '../../services/staffService';
import { authService, isSameBranch } from '../../services/authService';

interface BranchManagementProps {
    onLogout: () => void
}
interface BranchStat {
    id: string;
    name: string;
    location: string;
    manager: string;
    revenue: number;
    customers: number;
    staff: number;
}
export default function BranchManagement({ onLogout }: BranchManagementProps) {
    const navigate = useNavigate();
    const [branchStats, setBranchStats] = useState<BranchStat[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newBranch, setNewBranch] = useState({
        name: '',
        id: '',
        location: '',
        manager: '',
        mobile: '',
        username: '',
        password: '',
        billingUsername: '',
        billingPassword: ''
    });

    useEffect(() => {
        loadBranchStats();
    }, []);

    const loadBranchStats = async () => {
        // 1. Fetch ALL data (Admin view has 'all' permission)
        // Ensure we are logged in as admin to get all data, or services might filter.
        // Assuming current user is Admin based on this page access.
        const branches = await authService.getAllBranches();
        const allTransactions = await transactionService.getAllTransactions();
        const allCustomers = await customerService.getAllCustomers();
        const allStaff = await staffService.getAllStaff();

        // Calculate Weekly Revenue Date Range (Last 7 Days)
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const stats: BranchStat[] = branches.map(branch => {
            // Filter Transactions for this branch
            const branchTx = allTransactions.filter(t => isSameBranch(t.branchId || t, branch.branchId));

            // Calculate Weekly Revenue
            const weeklyRevenue = branchTx
                .filter(t => {
                    const tDate = new Date(t.date);
                    return tDate >= sevenDaysAgo && tDate <= today;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            // Active Customers (Count for now)
            const branchCustomers = allCustomers.filter(c => isSameBranch(c.branch, branch.branchId));

            // Staff Count
            const branchStaff = allStaff.filter(s => isSameBranch(s.branchId, branch.branchId) && s.status === 'Active');

            return {
                id: branch.branchId,
                name: branch.branchName,
                location: branch.location || 'Unknown Location',
                manager: branch.fullName || branch.username,
                revenue: weeklyRevenue,
                customers: branchCustomers.length,
                staff: branchStaff.length
            };
        });

        setBranchStats(stats);
    };

    const handleAddBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authService.createBranchUser({
                branchName: newBranch.name,
                branchId: newBranch.id, // e.g. 'branch5'
                location: newBranch.location,
                managerName: newBranch.manager,
                mobile: newBranch.mobile,
                username: newBranch.username,
                password: newBranch.password,
                billingUsername: newBranch.billingUsername,
                billingPassword: newBranch.billingPassword
            });
            alert("New Branch, Manager, and Billing User Created Successfully!");
            setShowModal(false);
            setNewBranch({
                name: '', id: '', location: '', manager: '', mobile: '', // Reset
                username: '', password: '',
                billingUsername: '', billingPassword: ''
            });
            loadBranchStats(); // Refresh list
        } catch (err: any) {
            alert("Error adding branch: " + err.message);
        }
    };

    return (
        <div className="app-container">
            <Sidebar userType="admin" />
            <div className="main-content">
                <HeaderWithLogo title="Branch Management" onLogout={onLogout} />
                <div className="content-area">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                        <button onClick={() => setShowModal(true)} className="button button-primary">+ Add New Branch</button>
                    </div>

                    <div className="dashboard-grid">
                        {branchStats.map((branch, index) => (
                            <div key={`${branch.id || 'b'}-${index}`} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <div className="card-title" style={{ marginBottom: 0 }}>{branch.name}</div>
                                    <span style={{ fontSize: '12px', background: '#222', padding: '4px 8px', borderRadius: '4px', color: '#888' }}>Active</span>
                                </div>

                                <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '20px' }}>📍 {branch.location}</div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                                        <span>Weekly Revenue</span>
                                        <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>₹{branch.revenue.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                                        <span>Active Customers</span>
                                        <span style={{ color: '#06b6d4' }}>{branch.customers}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                                        <span>Staff Count</span>
                                        <span style={{ color: '#10b981' }}>{branch.staff} Members</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                                        <span>Manager</span>
                                        <span style={{ color: '#fff' }}>{branch.manager}</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                    <button
                                        className="button button-secondary"
                                        style={{ flex: 1, fontSize: '12px' }}
                                        onClick={() => navigate(`/branches/${branch.id}`)}
                                    >
                                        View Details
                                    </button>
                                    <button className="button button-secondary" style={{ flex: 1, fontSize: '12px' }}>Settings</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add Branch Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div className="card" style={{ width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: '20px', color: 'var(--accent-gold)' }}>Add New Branch</h2>
                        <form onSubmit={handleAddBranch}>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Branch Name</label>
                                <input className="input-field" required placeholder="e.g. West Branch"
                                    value={newBranch.name} onChange={e => setNewBranch({ ...newBranch, name: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Branch ID (Unique)</label>
                                <input className="input-field" required placeholder="e.g. branch5"
                                    value={newBranch.id} onChange={e => setNewBranch({ ...newBranch, id: e.target.value.toLowerCase().replace(/\s/g, '') })} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Location</label>
                                <input className="input-field" required placeholder="e.g. West Avenue"
                                    value={newBranch.location} onChange={e => setNewBranch({ ...newBranch, location: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Manager Name</label>
                                <input className="input-field" required placeholder="Full Name"
                                    value={newBranch.manager} onChange={e => setNewBranch({ ...newBranch, manager: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Branch Mobile Number</label>
                                <input className="input-field" required placeholder="e.g. 9876543210"
                                    value={newBranch.mobile} onChange={e => setNewBranch({ ...newBranch, mobile: e.target.value })} />
                            </div>

                            <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px', marginTop: '20px' }}>Manager Login Credentials</div>

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Manager Username</label>
                                <input className="input-field" required placeholder="Manager Login"
                                    value={newBranch.username} onChange={e => setNewBranch({ ...newBranch, username: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Manager Password</label>
                                <input className="input-field" required type="password" placeholder="Manager Password"
                                    value={newBranch.password} onChange={e => setNewBranch({ ...newBranch, password: e.target.value })} />
                            </div>

                            <hr style={{ borderColor: '#333', margin: '20px 0' }} />
                            <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px' }}>Billing Staff Login Credentials</div>

                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Billing Username</label>
                                <input className="input-field" required placeholder="Biller Login"
                                    value={newBranch.billingUsername} onChange={e => setNewBranch({ ...newBranch, billingUsername: e.target.value })} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#888' }}>Billing Password</label>
                                <input className="input-field" required type="password" placeholder="Biller Password"
                                    value={newBranch.billingPassword} onChange={e => setNewBranch({ ...newBranch, billingPassword: e.target.value })} />
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="button button-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="button button-primary" style={{ flex: 1 }}>Create Branch & Users</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
