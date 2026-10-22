import { useState, useEffect } from 'react'
import '../../theme.css'
import { db } from '../../lib/firebase'
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import { authService, isSameBranch } from '../../services/authService'
import { getISTDateString, getISTYesterdayDateString } from '../../utils/dateUtils'
import { transactionService } from '../../services/transactionService'
import { customerService } from '../../services/customerService'
import HeaderWithLogo from '../../components/HeaderWithLogo'
import Sidebar from '../../components/Sidebar'
import { Edit, Search, X, Loader, Share2 } from 'lucide-react'

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

interface BillingHistoryProps {
  onLogout: () => void;
}

export default function ManagerBillingHistory({ onLogout }: BillingHistoryProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'today' | 'yesterday' | 'history' | 'all'>('all')
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0])
  
  // Edit Modal State
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editPaymentMode, setEditPaymentMode] = useState('')
  const [editItems, setEditItems] = useState<any[]>([])
  const [editTotal, setEditTotal] = useState<number>(0)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const user = authService.getCurrentUser()
      const branchId = user?.branchId || 'branch1'

      const invSnap = await getDocs(collection(db, 'invoices'))
      const data = invSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Invoice[]
      data.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())

      let filteredData = data

      // For managers, filter by branch ID embedded in the invoice number safely & case-insensitively
      if (user && user.role !== 'admin' && branchId !== 'all') {
        filteredData = filteredData.filter(inv => isSameBranch(inv, branchId))
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

  const todayStr = getISTDateString()
  const yesterdayStr = getISTYesterdayDateString()

  // Filter based on Search Term
  const getFilteredInvoices = (list: Invoice[]) => {
    return list.filter(inv => 
      inv && (
        !searchTerm ||
        (inv.customer_name && inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inv.customer_phone && inv.customer_phone.includes(searchTerm)) ||
        (inv.invoice_no && inv.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    )
  }

  const todayInvoices = getFilteredInvoices(invoices.filter(inv => inv && inv.created_at && getISTDateString(inv.created_at) === todayStr))
  const yesterdayInvoices = getFilteredInvoices(invoices.filter(inv => inv && inv.created_at && getISTDateString(inv.created_at) === yesterdayStr))
  const historyInvoices = getFilteredInvoices(invoices.filter(inv => inv && inv.created_at && getISTDateString(inv.created_at) === historyDate))

  // Payment breakdown helper
  const calcBreakdown = (list: Invoice[]) => {
    let cash = 0, card = 0, upi = 0
    let services = 0, products = 0, extensions = 0
    let totalRevenue = 0

    list.forEach(inv => {
      const amt = Number(inv.total_amount || 0)
      totalRevenue += amt

      const pMode = (inv.payment_mode || 'Cash').toLowerCase()
      if (pMode.includes('card')) card += amt
      else if (pMode.includes('upi')) upi += amt
      else cash += amt
      
      if (inv.items && Array.isArray(inv.items)) {
        inv.items.forEach((item: any) => {
           const itemAmt = item.total || item.amount || 0;
           if (item.category === 'Hair Extensions') extensions += itemAmt;
           else if (item.category === 'Product') products += itemAmt;
           else if (item.category !== 'Tax' && !item.name?.includes('Surcharge')) services += itemAmt;
        });
      }
    })
    return { cash, card, upi, services, products, extensions, total: totalRevenue }
  }

  const histBreakdown = calcBreakdown(historyInvoices)

  // Edit Handlers
  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(inv)
    setEditName(inv.customer_name || '')
    setEditPhone(inv.customer_phone || '')
    setEditPaymentMode(inv.payment_mode || 'Cash')
    setEditItems(inv.items ? JSON.parse(JSON.stringify(inv.items)) : [])
    setEditTotal(inv.total_amount || 0)
  }

  const handleItemChange = (index: number, field: 'price' | 'quantity', val: string) => {
    const num = parseFloat(val) || 0
    const updated = [...editItems]
    updated[index][field] = num
    updated[index].total = updated[index].price * updated[index].quantity
    setEditItems(updated)
    
    // Recalculate total spent on items
    const newTotal = updated.reduce((sum, item) => sum + (item.total || item.price * item.quantity), 0)
    setEditTotal(newTotal)
  }

  const handleSaveRevision = async () => {
    if (!editingInvoice) return
    if (!editPhone) {
      alert('Mobile number is required')
      return
    }

    try {
      setIsUpdating(true)
      const user = authService.getCurrentUser()
      const branchId = user?.branchId || 'branch1'

      // 1. Update Invoices Table
      await updateDoc(doc(db, 'invoices', editingInvoice.id || editingInvoice.invoice_no), {
        customer_name: editName,
        customer_phone: editPhone,
        payment_mode: editPaymentMode,
        items: editItems,
        total_amount: editTotal
      })

      // 2. Find and update matched transaction in transactions table
      const txId = editingInvoice.invoice_no.replace('INV', 'tx')
      let matchedTx: any = null

      try {
        const txDoc = await getDoc(doc(db, 'transactions', txId))
        if (txDoc.exists()) {
          matchedTx = { id: txDoc.id, ...txDoc.data() }
        }
      } catch (e) {
        console.warn('Direct tx lookup warning', e)
      }

      if (!matchedTx) {
        const dateStr = editingInvoice.created_at?.split('T')[0]
        const allTx = await transactionService.getAllTransactions()
        matchedTx = allTx.find(t => t.customerId === editingInvoice.customer_phone && t.date === dateStr && t.amount === editingInvoice.total_amount)
      }

      if (matchedTx) {
        const updatedTxItems = editItems.map((item: any) => ({
          type: item.category === 'Hair Extensions' ? 'hair_extension' : (item.category === 'Product' ? 'product' : 'service'),
          name: item.name,
          amount: item.total || item.price * item.quantity
        }))

        let txPaymentMethod = 'cash'
        const lowerMode = editPaymentMode.toLowerCase()
        if (lowerMode.includes('card')) txPaymentMethod = 'card'
        else if (lowerMode.includes('upi')) txPaymentMethod = 'upi'

        await transactionService.updateTransaction(matchedTx.id, {
          customerName: editName,
          customerId: editPhone,
          amount: editTotal,
          paymentMethod: txPaymentMethod as any,
          items: updatedTxItems as any
        })
      }

      // 3. Update lifetime spent of customers
      if (editPhone !== editingInvoice.customer_phone) {
        const custs = await customerService.getAllCustomers()
        const oldCust = custs.find(c => c.phoneNumber === editingInvoice.customer_phone)
        if (oldCust) {
          const newTotal = Math.max(0, Number(oldCust.totalSpent || 0) - editingInvoice.total_amount)
          await updateDoc(doc(db, 'customers', oldCust.id), {
            total_spent: newTotal,
            total_amount: newTotal
          })
        }

        // Add new total to the new customer
        await customerService.processCheckout(editPhone, editName, editTotal)
      } else {
        const custs = await customerService.getAllCustomers()
        const cust = custs.find(c => c.phoneNumber === editingInvoice.customer_phone)
        if (cust) {
          const diff = editTotal - editingInvoice.total_amount
          const newTotal = Number(cust.totalSpent || 0) + diff
          await updateDoc(doc(db, 'customers', cust.id), {
            total_spent: newTotal,
            total_amount: newTotal
          })
        }
      }

      alert('Bill revised successfully!')
      setEditingInvoice(null)
      fetchInvoices() // reload dashboard data
    } catch (err: any) {
      console.error(err)
      alert('Error updating bill: ' + err.message)
    } finally {
      setIsUpdating(false)
    }
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
      return { list: todayInvoices, label: "Today", breakdown: calcBreakdown(todayInvoices) };
    }
    if (activeTab === 'yesterday') {
      return { list: yesterdayInvoices, label: "Yesterday", breakdown: calcBreakdown(yesterdayInvoices) };
    }
    if (activeTab === 'history') {
      return { list: historyInvoices, label: historyDate, breakdown: calcBreakdown(historyInvoices) };
    }
    const allList = getFilteredInvoices(invoices);
    return { list: allList, label: "Overall", breakdown: calcBreakdown(allList) };
  };

  const activeData = getActiveTabData();

  return (
    <div className="app-container">
      <Sidebar userType="manager" />
      <div className="main-content">
        <HeaderWithLogo title="History of Billing" onLogout={onLogout} />
        
        <div className="content-area">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', padding: '30px' }}>
          
          {/* STATS CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '120px', justifyContent: 'center' }}>
              <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Total Customers ({activeData.label})</div>
              <div style={{ color: '#fff', fontSize: '36px', fontWeight: 700, lineHeight: 1 }}>{activeData.list.length}</div>
            </div>

            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '120px', justifyContent: 'center' }}>
              <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Total Revenue ({activeData.label})</div>
              <div style={{ color: 'var(--accent-gold)', fontSize: '36px', fontWeight: 700, lineHeight: 1 }}>
                ₹{activeData.breakdown.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>

            <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '6px' }}>Collections ({activeData.label})</div>
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

            <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '6px' }}>Categories ({activeData.label})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Beauty Services', value: activeData.breakdown.services, color: '#f59e0b' },
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

          {/* SEARCH BAR CARD */}
          <div className="card" style={{ padding: '15px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                placeholder="Search by Name, Mobile, or Invoice Number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px 12px 42px',
                  background: '#111', border: '1px solid #333', borderRadius: '8px',
                  color: '#fff', outline: 'none', fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* TABS & DETAILS CARD */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: '2px', padding: '16px 20px 0', background: '#0d0d0d', borderBottom: '1px solid #1e1e1e' }}>
              <button style={tabStyle('all')} onClick={() => setActiveTab('all')}>All Bills</button>
              <button style={tabStyle('today')} onClick={() => setActiveTab('today')}>Today's Bills</button>
              <button style={tabStyle('yesterday')} onClick={() => setActiveTab('yesterday')}>Yesterday's Bills</button>
              <button style={tabStyle('history')} onClick={() => setActiveTab('history')}>📅 Search History Date</button>
            </div>

            <div style={{ padding: '20px' }}>
              {activeTab === 'all' && <InvoicesTable list={getFilteredInvoices(invoices)} onEdit={handleOpenEdit} />}
              {activeTab === 'today' && <InvoicesTable list={todayInvoices} onEdit={handleOpenEdit} />}
              {activeTab === 'yesterday' && <InvoicesTable list={yesterdayInvoices} onEdit={handleOpenEdit} />}
              
              {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    flexWrap: 'wrap', padding: '16px 20px',
                    background: '#0d0d0d', borderRadius: '10px',
                    border: '1px solid #1e1e1e'
                  }}>
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

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', color: '#888' }}>
                        👥 <strong style={{ color: '#fff' }}>{historyInvoices.length}</strong> Bills
                      </span>
                      <span style={{ background: '#1a1a1a', border: '1px solid var(--accent-gold)', borderRadius: '20px', padding: '4px 14px', fontSize: '12px', color: '#888' }}>
                        💰 <strong style={{ color: 'var(--accent-gold)' }}>₹{histBreakdown.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                      </span>
                    </div>
                  </div>

                  <InvoicesTable list={historyInvoices} onEdit={handleOpenEdit} />
                </div>
              )}
            </div>
          </div>

          </div>
        </div>
      </div>

      {/* EDIT / REVISE MODAL */}
      {editingInvoice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(8px)'
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto',
            position: 'relative', border: '1px solid #333', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '15px' }}>
              <div>
                <h3 style={{ color: 'var(--accent-gold)', margin: 0, fontSize: '18px', fontWeight: 700 }}>REVISE INVOICE</h3>
                <span style={{ color: '#666', fontSize: '12px', fontFamily: 'monospace' }}>No: {editingInvoice.invoice_no}</span>
              </div>
              <button 
                onClick={() => setEditingInvoice(null)}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer Details Form */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '12px' }}>Customer Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ fontSize: '14px', padding: '10px' }}
                />
              </div>
              <div>
                <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '12px' }}>Customer Mobile (Required)</label>
                <input
                  type="text"
                  className="input-field"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  style={{ fontSize: '14px', padding: '10px' }}
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '12px' }}>Payment Mode</label>
              <select
                className="input-field"
                value={editPaymentMode}
                onChange={(e) => setEditPaymentMode(e.target.value)}
                style={{ fontSize: '14px', padding: '10px' }}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                {/* Support split display read-only or customizable */}
                {editingInvoice.payment_mode && editingInvoice.payment_mode.includes(',') && (
                  <option value={editingInvoice.payment_mode}>{editingInvoice.payment_mode}</option>
                )}
              </select>
            </div>

            {/* Items Editor */}
            <div>
              <label className="form-label" style={{ marginBottom: '10px', display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--accent-gold)' }}>ITEMS & QUANTITIES</label>
              {editItems.length === 0 ? (
                <div style={{ padding: '10px', color: '#666', fontSize: '12px', fontStyle: 'italic' }}>No items listed</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#0d0d0d', padding: '12px', borderRadius: '8px', border: '1px solid #1a1a1a' }}>
                  {editItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>{item.name}</span>
                      
                      {/* Price input */}
                      <div>
                        <input
                          type="number"
                          className="input-field"
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                          style={{ fontSize: '12px', padding: '6px 8px', textAlign: 'right' }}
                        />
                      </div>
                      
                      {/* Qty input */}
                      <div>
                        <input
                          type="number"
                          className="input-field"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          style={{ fontSize: '12px', padding: '6px 8px', textAlign: 'center' }}
                        />
                      </div>
                      
                      {/* Total price indicator */}
                      <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600, textAlign: 'right' }}>
                        ₹{(item.total || item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Final Total Amount Revision */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #222', paddingTop: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#888', fontSize: '12px' }}>Total Amount</span>
                <span style={{ color: '#666', fontSize: '10px' }}>Adjust items or override directly</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>₹</span>
                <input
                  type="number"
                  className="input-field"
                  value={editTotal}
                  onChange={(e) => setEditTotal(parseFloat(e.target.value) || 0)}
                  style={{
                    fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-gold)',
                    textAlign: 'right', width: '130px', padding: '8px 12px', border: '1px solid var(--accent-gold)'
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                onClick={() => setEditingInvoice(null)}
                style={{
                  background: 'none', border: '1px solid #444', color: '#aaa',
                  padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600
                }}
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRevision}
                style={{
                  background: 'var(--accent-gold)', border: 'none', color: '#000',
                  padding: '10px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader className="spin" size={16} />
                    Saving...
                  </>
                ) : 'Save Changes'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

function InvoicesTable({ list, onEdit }: { list: Invoice[]; onEdit: (inv: Invoice) => void }) {
  if (list.length === 0) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
        No bills found.
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

    return 'Vizag Branch';
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
        <thead>
          <tr style={{ color: '#666', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #333' }}>
            <th style={{ padding: '15px 10px', fontWeight: 600 }}>S.No</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>Time</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>Branch Name</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>Invoice No</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>Customer Name</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>Mobile Number</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>Total Value</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>Payment Mode</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>Items</th>
            <th style={{ padding: '15px 10px', fontWeight: 500, textAlign: 'center' }}>Revise</th>
            <th style={{ padding: '15px 10px', fontWeight: 500 }}>Invoice Link</th>
            <th style={{ padding: '15px 10px', fontWeight: 500, textAlign: 'center' }}>WhatsApp Share</th>
          </tr>
        </thead>
        <tbody>
          {list.map((inv, idx) => {
            const invoiceLink = `${window.location.origin}/#/invoice/${inv.invoice_no}`;
            const message = `Hello ${inv.customer_name},\n\nThank you for visiting Celebrity Cuts!\n\nInvoice Number: ${inv.invoice_no}\nTotal Amount: Rs. ${inv.total_amount}\n\nDownload Invoice:\n${invoiceLink}`;
            const cleanPhone = (inv.customer_phone || '').replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;

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
                <td style={{ padding: '20px 10px', color: '#aaa', fontSize: '12px', fontFamily: 'monospace' }}>
                  {inv.invoice_no}
                </td>
                <td style={{ padding: '20px 10px', color: '#fff' }}>{inv.customer_name}</td>
                <td style={{ padding: '20px 10px', color: '#fff', fontFamily: 'monospace' }}>{inv.customer_phone}</td>
                <td style={{ padding: '20px 10px', color: '#fff', fontWeight: 'bold' }}>
                  ₹{inv.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '20px 10px', color: '#ccc', textTransform: 'capitalize' }}>
                  {inv.payment_mode || 'Cash'}
                </td>
                <td style={{ padding: '20px 10px', color: '#aaa', fontSize: '12px' }}>
                  {inv.items ? Array.isArray(inv.items) ? inv.items.map(i => i.name).join(', ') : 'Service' : 'Service'}
                </td>
                <td style={{ padding: '20px 10px', textAlign: 'center' }}>
                  <button
                    onClick={() => onEdit(inv)}
                    style={{
                      background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--accent-gold)',
                      borderRadius: '4px', padding: '6px 12px', color: 'var(--accent-gold)',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px'
                    }}
                  >
                    <Edit size={12} />
                    Revise
                  </button>
                </td>
                <td style={{ padding: '20px 10px' }}>
                  <a
                    href={invoiceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-gold)', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}
                  >
                    View Invoice
                  </a>
                </td>
                <td style={{ padding: '20px 10px', textAlign: 'center' }}>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#25D366', color: '#fff', padding: '6px 12px',
                      borderRadius: '4px', textDecoration: 'none', fontSize: '12px',
                      fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px'
                    }}
                  >
                    <Share2 size={12} /> Share
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
