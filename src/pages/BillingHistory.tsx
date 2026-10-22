import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import HeaderWithLogo from '../components/HeaderWithLogo';
import '../theme.css';
import { transactionService } from '../services/transactionService';
import { authService, isSameBranch } from '../services/authService';
import { staffService } from '../services/staffService';

interface Bill {
  id: string;
  date: string;
  branchName: string;
  customerName: string;
  customerPhone: string;
  services: Array<{ name: string; price: number; quantity: number }>;
  staffMembers: Array<{ name: string; position: string }>;
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'upi';
  billType?: string;
}

interface BillingHistoryProps {
  onLogout?: () => void;
  userType?: 'admin' | 'manager' | 'billing';
}

export default function BillingHistory({ onLogout = () => { }, userType = 'billing' }: BillingHistoryProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = authService.getCurrentUser();
    const userBranch = user?.branchId || user?.branchName || 'branch1';
    let transactions = await transactionService.getAllTransactions();

    if (user && user.role !== 'admin' && userBranch.toLowerCase() !== 'all') {
      transactions = transactions.filter(t => isSameBranch(t.branchId, userBranch));
    }

    const allStaff = await staffService.getAllStaff();

    // Transform Transaction[] -> Bill[]
    const formattedBills: Bill[] = transactions.map(t => {
      // Resolve Staff Names
      const staffInvolved: any[] = [];
      if (t.items) {
        t.items.forEach(item => {
          if (item.staffIds) {
            item.staffIds.forEach(sid => {
              const s = allStaff.find(st => st.id === sid);
              if (s && !staffInvolved.find(si => si.name === s.name)) {
                staffInvolved.push({ name: s.name, position: s.role });
              }
            });
          }
        });
      }

      // Resolve Services for display
      const servicesList = t.items ? t.items.map(i => ({
        name: i.name,
        price: i.amount,
        quantity: 1,
        type: i.type // Capture type
      })) : [];

      // Determine Bill Type
      let billType = 'Service';
      if (t.items && t.items.some(i => i.type === 'hair_extension')) billType = 'Extension';
      else if (t.items && t.items.some(i => i.type === 'product')) billType = 'Product';

      return {
        id: t.id,
        date: t.date + ' ' + t.time,
        branchName: t.branchId ? authService.getBranchDetails(t.branchId).branchName : 'Main Branch',
        customerName: t.customerName,
        customerPhone: t.customerId,
        services: servicesList,
        staffMembers: staffInvolved,
        subtotal: t.subtotal || t.amount,
        discount: t.discount || 0,
        gst: t.gst || 0,
        total: t.amount,
        paymentMethod: t.paymentMethod || 'cash',
        billType: billType // New Field
      };
    });

    // Sort by newest first
    formattedBills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setBills(formattedBills);
  };

  // Filter bills based on period, search and payment method
  const filteredBills = bills.filter(bill => {
    const matchesSearch = !searchTerm ||
      bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.customerPhone.includes(searchTerm);

    const matchesPayment = paymentFilter === 'all' || bill.paymentMethod === paymentFilter;

    // Period Filter Logic
    let matchesPeriod = true;
    const billDate = new Date(bill.date);
    const now = new Date();

    if (selectedPeriod === 'today') {
      matchesPeriod = billDate.toDateString() === now.toDateString();
    } else if (selectedPeriod === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      matchesPeriod = billDate >= weekAgo;
    } else if (selectedPeriod === 'month') {
      matchesPeriod = billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesPayment && matchesPeriod;
  });

  // Calculate statistics
  const totalRevenue = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
  const totalBills = filteredBills.length;
  const cashTransactions = filteredBills.filter(b => b.paymentMethod === 'cash').length;
  const cardTransactions = filteredBills.filter(b => b.paymentMethod === 'card').length;
  const upiTransactions = filteredBills.filter(b => b.paymentMethod === 'upi').length;
  const totalDiscount = filteredBills.reduce((sum, bill) => sum + bill.discount, 0);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💰';
      case 'card': return '💳';
      case 'upi': return '📱';
      default: return '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="app-container">
      <Sidebar userType={userType} />
      <div className="main-content">
        <HeaderWithLogo title="Billing History" onLogout={onLogout} />
        <div className="content-area">
          {/* Stats Cards */}
          <div className="stats-grid" style={{ marginBottom: '25px' }}>
            <div className="stat-card">
              <div className="stat-label">Total Bills</div>
              <div className="stat-value">{totalBills}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value" style={{ color: 'var(--accent-gold)' }}>₹{totalRevenue.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Discount</div>
              <div className="stat-value" style={{ color: '#ef4444' }}>₹{totalDiscount.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Average Bill</div>
              <div className="stat-value">₹{totalBills > 0 ? (totalRevenue / totalBills).toFixed(0) : 0}</div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="card" style={{ marginBottom: '25px' }}>
            <div className="card-title">Filters</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '5px', display: 'block' }}>Search Customer</label>
                <input
                  type="text"
                  className="input-field"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or phone..."
                  style={{ fontSize: '14px' }}
                />
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: '5px', display: 'block' }}>Payment Method</label>
                <select
                  className="input-field"
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  style={{ fontSize: '14px' }}
                >
                  <option value="all">All Methods</option>
                  <option value="cash">💰 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="upi">📱 UPI</option>
                </select>
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: '5px', display: 'block' }}>Period</label>
                <select
                  className="input-field"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  style={{ fontSize: '14px' }}
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Method Summary */}
          <div className="card" style={{ marginBottom: '25px' }}>
            <div className="card-title">Payment Method Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '15px' }}>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'var(--tertiary-dark)', borderRadius: '8px', border: '1px solid #333' }}>
                <div style={{ fontSize: '20px', marginBottom: '5px' }}>💰</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{cashTransactions}</div>
                <div style={{ color: 'var(--text-gray)', fontSize: '12px' }}>Cash Transactions</div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'var(--tertiary-dark)', borderRadius: '8px', border: '1px solid #333' }}>
                <div style={{ fontSize: '20px', marginBottom: '5px' }}>💳</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#06b6d4' }}>{cardTransactions}</div>
                <div style={{ color: 'var(--text-gray)', fontSize: '12px' }}>Card Transactions</div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'var(--tertiary-dark)', borderRadius: '8px', border: '1px solid #333' }}>
                <div style={{ fontSize: '20px', marginBottom: '5px' }}>📱</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>{upiTransactions}</div>
                <div style={{ color: 'var(--text-gray)', fontSize: '12px' }}>UPI Transactions</div>
              </div>
            </div>
          </div>

          {/* Bills Table */}
          <div className="card">
            <div className="card-title">Billing History ({filteredBills.length} bills)</div>
            {filteredBills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-gray)' }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>📋</div>
                <div>No bills found matching your criteria</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                <thead>
                  <tr style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>#</th>
                    <th style={{ padding: '10px' }}>Date</th>
                    <th style={{ padding: '10px' }}>Type</th> {/* Added Type Header */}
                    <th style={{ padding: '10px' }}>Branch</th>
                    <th style={{ padding: '10px' }}>Customer</th>
                    <th style={{ padding: '10px' }}>Services</th>
                    <th style={{ padding: '10px' }}>Staff</th>
                    <th style={{ padding: '10px' }}>Subtotal</th>
                    <th style={{ padding: '10px' }}>Discount</th>
                    <th style={{ padding: '10px' }}>GST</th>
                    <th style={{ padding: '10px' }}>Total</th>
                    <th style={{ padding: '10px' }}>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((bill, index) => (
                    <tr key={bill.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <td style={{ fontWeight: 'bold', color: 'var(--accent-gold)', padding: '15px' }}>
                        #{filteredBills.length - index}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontSize: '12px', color: '#fff' }}>
                          {formatDate(bill.date)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>
                          {new Date(bill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '10px',
                          backgroundColor: bill.billType === 'Extension' ? '#f59e0b20' :
                            bill.billType === 'Product' ? '#ec489920' : '#3b82f620',
                          color: bill.billType === 'Extension' ? '#f59e0b' :
                            bill.billType === 'Product' ? '#ec4899' : '#3b82f6',
                          border: `1px solid ${bill.billType === 'Extension' ? '#f59e0b40' : bill.billType === 'Product' ? '#ec489940' : '#3b82f640'}`
                        }}>
                          {bill.billType}
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontSize: '12px', color: '#fff', background: '#333', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                          {bill.branchName}
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--accent-gold)' }}>
                          {bill.customerName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-gray)' }}>
                          {bill.customerPhone}
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ fontSize: '12px', color: '#ddd' }}>
                          {bill.services.map((service, i) => (
                            <div key={i} style={{ marginBottom: '2px' }}>
                              {service.name} ({service.quantity})
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-gray)', marginTop: '4px' }}>
                          {bill.services.length} services
                        </div>
                      </td>
                      <td style={{ fontSize: '11px', padding: '15px' }}>
                        {bill.staffMembers.map((staff, i) => (
                          <div key={i} style={{ marginBottom: '2px', color: '#ccc' }}>
                            {staff.name}
                          </div>
                        ))}
                      </td>
                      <td style={{ color: 'var(--text-gray)', padding: '15px' }}>
                        ₹{bill.subtotal.toLocaleString()}
                      </td>
                      <td style={{ color: bill.discount > 0 ? '#ef4444' : 'var(--text-gray)', padding: '15px' }}>
                        {bill.discount > 0 ? `-₹${bill.discount.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ color: 'var(--text-gray)', padding: '15px' }}>
                        ₹{bill.gst.toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 'bold', color: 'var(--accent-gold)', padding: '15px' }}>
                        ₹{bill.total.toLocaleString()}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          backgroundColor:
                            bill.paymentMethod === 'cash' ? '#10b98120' :
                              bill.paymentMethod === 'card' ? '#06b6d420' : '#f59e0b20',
                          color:
                            bill.paymentMethod === 'cash' ? '#10b981' :
                              bill.paymentMethod === 'card' ? '#06b6d4' : '#f59e0b',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          border: `1px solid ${bill.paymentMethod === 'cash' ? '#10b98140' : bill.paymentMethod === 'card' ? '#06b6d440' : '#f59e0b40'}`
                        }}>
                          {getPaymentIcon(bill.paymentMethod)} {bill.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}