import { useState, useEffect } from 'react'
import '../../theme.css'
import { db } from '../../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { authService, isSameBranch } from '../../services/authService'
import { getISTDateString, getISTYesterdayDateString } from '../../utils/dateUtils'

interface Invoice {
  id: string;
  invoice_no: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  payment_mode: string;
  created_at: string;
  items: any[];
}

interface CustomersPageProps {
  onShowCustomerDetails?: (customerId: string) => void;
}

const CustomersPage: React.FC<CustomersPageProps> = ({ onShowCustomerDetails }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  // Tab + History filter state
  const [activeTab, setActiveTab] = useState<'today' | 'yesterday' | 'history'>('today')
  const [historyDate, setHistoryDate] = useState(getISTDateString())

  const fetchInvoices = async () => {
    try {
      const user = authService.getCurrentUser()
      const branchId = user?.branchId || 'branch1'

      const invSnap = await getDocs(collection(db, 'invoices'))
      const data = invSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Invoice[]
      data.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())

      let filteredData = data

      if (user && user.role !== 'admin' && branchId !== 'all') {
        const uBranch = user.branchId || user.branchName || 'branch1';

        filteredData = filteredData.filter(inv => isSameBranch(inv, uBranch));
      }

      setInvoices(filteredData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching invoices:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading bills...</div>
  }

  // Date helpers (IST Asia/Kolkata)
  const todayStr = getISTDateString();
  const yesterdayStr = getISTYesterdayDateString();

  const todayInvoices = invoices.filter(inv => inv && inv.created_at && getISTDateString(inv.created_at) === todayStr);
  const yesterdayInvoices = invoices.filter(inv => inv && inv.created_at && getISTDateString(inv.created_at) === yesterdayStr);
  const historyInvoices = invoices.filter(inv => inv && inv.created_at && getISTDateString(inv.created_at) === historyDate);

  // Payment breakdown helper
  const calcBreakdown = (list: Invoice[]) => {
    let cash = 0, card = 0, upi = 0
    let services = 0, products = 0, extensions = 0
    list.forEach(inv => {
      const pMode = inv.payment_mode || 'Cash'
      if (pMode.includes('₹')) {
        const cm = pMode.match(/Cash:\s*₹([\d.]+)/); if (cm) cash += parseFloat(cm[1])
        const dm = pMode.match(/Card:\s*₹([\d.]+)/); if (dm) card += parseFloat(dm[1])
        const um = pMode.match(/UPI:\s*₹([\d.]+)/); if (um) upi += parseFloat(um[1])
      } else {
        const mode = pMode.toLowerCase()
        const amt = inv.total_amount || 0
        if (mode === 'cash') cash += amt
        else if (mode === 'card') card += amt
        else if (mode === 'upi') upi += amt
        else cash += amt
      }
      
      if (inv.items && Array.isArray(inv.items)) {
        inv.items.forEach((item: any) => {
           const amt = item.total || item.amount || 0;
           if (item.category === 'Hair Extensions') extensions += amt;
           else if (item.category === 'Product') products += amt;
           else if (item.category !== 'Tax' && !item.name?.includes('Surcharge')) services += amt;
        });
      }
    })
    return { cash, card, upi, services, products, extensions, total: cash + card + upi }
  }

  const todayBreakdown = calcBreakdown(todayInvoices)
  const yesterdayBreakdown = calcBreakdown(yesterdayInvoices)
  const histBreakdown = calcBreakdown(historyInvoices)

  // WhatsApp share of entire day summary
  const handleShareDaySummary = () => {
    const dateLabel = historyDate === todayStr
      ? 'Today'
      : new Date(historyDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

    const lines = historyInvoices.map((inv, i) =>
      `${i + 1}. ${inv.customer_name || 'Customer'} (${inv.customer_phone || '-'}) — ₹${(inv.total_amount || 0).toLocaleString('en-IN')} [${inv.payment_mode || 'Cash'}]`
    ).join('\n')

    const message =
      `📋 *Celebrity Cuts — Daily Bill Summary*\n` +
      `📅 Date: ${dateLabel}\n` +
      `👥 Total Customers: ${historyInvoices.length}\n` +
      `💰 Total Revenue: ₹${histBreakdown.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}\n\n` +
      `💵 Cash: ₹${histBreakdown.cash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}\n` +
      `💳 Card: ₹${histBreakdown.card.toLocaleString('en-IN', { maximumFractionDigits: 0 })}\n` +
      `📱 UPI:  ₹${histBreakdown.upi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}\n\n` +
      `📝 *Bill Details:*\n${lines || 'No bills found.'}\n\n` +
      `_Celebrity Cuts — Professional Salon Brand_`

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const tabStyle = (tab: typeof activeTab): React.CSSProperties => ({
    padding: '10px 22px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '13px',
    letterSpacing: '0.5px',
    transition: 'all 0.2s',
    background: activeTab === tab ? 'var(--accent-gold)' : 'transparent',
    color: activeTab === tab ? '#000' : '#666',
    borderRadius: '8px 8px 0 0',
    borderBottom: activeTab === tab ? '2px solid var(--accent-gold)' : '2px solid transparent',
  })

  // Helper to dynamically get active tab data and breakdown
  const getActiveTabData = () => {
    if (activeTab === 'today') {
      return { list: todayInvoices, label: "Today", breakdown: todayBreakdown };
    }
    if (activeTab === 'yesterday') {
      return { list: yesterdayInvoices, label: "Yesterday", breakdown: yesterdayBreakdown };
    }
    return { list: historyInvoices, label: historyDate, breakdown: histBreakdown };
  };

  const activeData = getActiveTabData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', minHeight: '80vh' }}>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '130px', justifyContent: 'center' }}>
          <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Total Customers ({activeData.label})</div>
          <div style={{ color: '#fff', fontSize: '38px', fontWeight: 700, lineHeight: 1 }}>{activeData.list.length}</div>
        </div>

        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '130px', justifyContent: 'center' }}>
          <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Total Revenue ({activeData.label})</div>
          <div style={{ color: 'var(--accent-gold)', fontSize: '38px', fontWeight: 700, lineHeight: 1 }}>
            ₹{activeData.breakdown.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '130px', justifyContent: 'center' }}>
          <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '6px' }}>Collection Breakdown ({activeData.label})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Cash', value: activeData.breakdown.cash, color: '#10b981' },
              { label: 'Card', value: activeData.breakdown.card, color: '#3b82f6' },
              { label: 'UPI', value: activeData.breakdown.upi, color: '#8b5cf6' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#ccc' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }}></div>{label}:
                </span>
                <span style={{ fontWeight: 600, color: '#fff' }}>₹{value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '130px', justifyContent: 'center' }}>
          <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '6px' }}>Category Breakdown ({activeData.label})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Beauty', value: activeData.breakdown.services, color: '#f59e0b' },
              { label: 'Hair Extensions', value: activeData.breakdown.extensions, color: '#ec4899' },
              { label: 'Products', value: activeData.breakdown.products, color: '#0ea5e9' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#ccc' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }}></div>{label}:
                </span>
                <span style={{ fontWeight: 600, color: '#fff' }}>₹{value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS CARD */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: '2px', padding: '16px 20px 0', background: '#0d0d0d', borderBottom: '1px solid #1e1e1e' }}>
          <button style={tabStyle('today')} onClick={() => setActiveTab('today')}>Today's Bills</button>
          <button style={tabStyle('yesterday')} onClick={() => setActiveTab('yesterday')}>Yesterday's Bills</button>
          <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>📅 Total History</button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px' }}>

          {activeTab === 'today' && <InvoiceTable invoices={todayInvoices} onShowCustomerDetails={onShowCustomerDetails} />}
          {activeTab === 'yesterday' && <InvoiceTable invoices={yesterdayInvoices} onShowCustomerDetails={onShowCustomerDetails} />}

          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Date Filter + Summary + Share */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                flexWrap: 'wrap', padding: '16px 20px',
                background: '#0d0d0d', borderRadius: '10px',
                border: '1px solid #1e1e1e'
              }}>
                {/* Date picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#888', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>📅 Select Date:</span>
                  <input
                    type="date"
                    value={historyDate}
                    max={todayStr}
                    onChange={(e) => setHistoryDate(e.target.value)}
                    style={{
                      background: '#1a1a1a', border: '1px solid #333',
                      borderRadius: '8px', color: '#fff',
                      padding: '8px 14px', fontSize: '14px',
                      cursor: 'pointer', outline: 'none', colorScheme: 'dark',
                    }}
                  />
                </div>

                {/* Summary chips */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', color: '#888' }}>
                    👥 <strong style={{ color: '#fff' }}>{historyInvoices.length}</strong> Bills
                  </span>
                  <span style={{ background: '#1a1a1a', border: '1px solid var(--accent-gold)', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', color: '#888' }}>
                    💰 <strong style={{ color: 'var(--accent-gold)' }}>₹{histBreakdown.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                  </span>
                  <span style={{ background: '#1a1a1a', border: '1px solid #10b981', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', color: '#888' }}>
                    Cash <strong style={{ color: '#10b981' }}>₹{histBreakdown.cash.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                  </span>
                  <span style={{ background: '#1a1a1a', border: '1px solid #3b82f6', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', color: '#888' }}>
                    Card <strong style={{ color: '#3b82f6' }}>₹{histBreakdown.card.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                  </span>
                  <span style={{ background: '#1a1a1a', border: '1px solid #8b5cf6', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', color: '#888' }}>
                    UPI <strong style={{ color: '#8b5cf6' }}>₹{histBreakdown.upi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                  </span>
                </div>

                {/* Share Day Summary */}
                <button
                  onClick={handleShareDaySummary}
                  title="Share this day's full summary on WhatsApp"
                  style={{
                    marginLeft: 'auto',
                    display: 'flex', alignItems: 'center', gap: '7px',
                    background: '#25D366', border: 'none', borderRadius: '8px',
                    color: '#fff', fontWeight: 700, fontSize: '13px',
                    padding: '9px 18px', cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(37,211,102,0.35)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  Share Day Summary
                </button>
              </div>

              {/* Bills table for selected date */}
              <InvoiceTable invoices={historyInvoices} onShowCustomerDetails={onShowCustomerDetails} />
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

function InvoiceTable({ invoices, onShowCustomerDetails }: { invoices: Invoice[]; onShowCustomerDetails?: (customerId: string) => void }) {
  if (invoices.length === 0) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
        No customers found.
      </div>
    )
  }

  const getBranchName = (inv: Invoice) => {
    const user = authService.getCurrentUser();
    if (user && user.role !== 'admin') {
      const bName = user.branchName || authService.getBranchDetails(user.branchId).branchName;
      return bName.includes('Branch') ? bName : `${bName} Branch`;
    }

    const bId = (inv as any).branch_id || (inv as any).branchId;
    if (bId && bId !== 'all') return authService.getBranchDetails(bId).branchName;

    if (inv.invoice_no) {
      const invLower = inv.invoice_no.toLowerCase();
      if (invLower.includes('branch4') || invLower.includes('hyd') || invLower.includes('hyderabad') || invLower.includes('gachibowli')) return 'Hyderabad Branch';
      if (invLower.includes('branch3') || invLower.includes('vjw') || invLower.includes('vijayawada')) return 'Vijayawada Branch';
      if (invLower.includes('branch2') || invLower.includes('vizag')) return 'Vizag Branch';
      if (invLower.includes('branch1') || invLower.includes('main')) return 'Main Branch';
    }

    return 'Main Branch';
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1150px' }}>
        <thead>
          <tr style={{ color: '#666', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #333' }}>
            <th style={{ padding: '15px 10px', fontWeight: 600 }}>S.No</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>Time</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>Branch Name</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>Customer Name</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>Mobile Number</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>Total Value</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>Payment Mode</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>Items</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>WhatsApp Share</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv, idx) => {
            const cleanPhone = (inv.customer_phone || '').replace(/\D/g, '');
            const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

            return (
              <tr key={inv.id} style={{ borderBottom: '1px solid #111' }}>
                <td style={{ padding: '20px 10px', color: 'var(--accent-gold)', fontWeight: 700 }}>
                  {idx + 1}
                </td>
                <td style={{ padding: '20px 10px', color: '#888' }}>
                  {new Date(inv.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </td>
                <td style={{ padding: '20px 10px' }}>
                  <span style={{ background: '#1a1a1a', border: '1px solid #333', color: 'var(--accent-gold)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                    📍 {getBranchName(inv)}
                  </span>
                </td>
                <td 
                  style={{ padding: '20px 10px', color: '#fff', cursor: onShowCustomerDetails ? 'pointer' : 'default', textDecoration: onShowCustomerDetails ? 'underline' : 'none' }}
                  onClick={() => onShowCustomerDetails && onShowCustomerDetails(inv.customer_phone || inv.id)}
                  title={onShowCustomerDetails ? "Click to view full customer history" : ""}
                >
                  {inv.customer_name}
                </td>
                <td 
                  style={{ padding: '20px 10px', color: 'var(--accent-gold)', fontFamily: 'monospace', cursor: onShowCustomerDetails ? 'pointer' : 'default' }}
                  onClick={() => onShowCustomerDetails && onShowCustomerDetails(inv.customer_phone || inv.id)}
                >
                  {inv.customer_phone}
                </td>
                <td style={{ padding: '20px 10px', color: '#fff', fontWeight: 'bold' }}>₹{inv.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '20px 10px', color: '#ccc', textTransform: 'capitalize' }}>{inv.payment_mode || 'Cash'}</td>
                <td style={{ padding: '20px 10px', color: '#aaa', fontSize: '12px' }}>
                  {inv.items ? Array.isArray(inv.items) ? inv.items.map(i => i.name).join(', ') : 'Service' : 'Service'}
                </td>
                <td style={{ padding: '20px 10px' }}>
                  <a
                    href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                      `Hello ${inv.customer_name},\n\nThank you for visiting Celebrity Cuts!\n\nInvoice Number: ${inv.invoice_no}\nTotal Amount: Rs. ${inv.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n\nDownload your invoice:\n${window.location.origin}/#/invoice/${inv.invoice_no}\n\nWe'd love to hear your feedback!\n\nFollow us: https://www.instagram.com/celebritycutsinsta\n\nThank you,\nCelebrity Cuts`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#25D366', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontWeight: 600 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    Share
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )
}

export default CustomersPage
