import { useState, useEffect } from 'react'
import { staffService, Staff } from '../services/staffService'
import { db } from '../lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'

interface QuickSaleProps {
  onClose: () => void
}

export default function QuickSale({ onClose }: QuickSaleProps) {
  const [customerName, setCustomerName] = useState('')
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedServices, setSelectedServices] = useState<any[]>([])
  const [discountType, setDiscountType] = useState('percentage')
  const [discountValue, setDiscountValue] = useState(0)
  const [staffList, setStaffList] = useState<Staff[]>([])

  useEffect(() => {
    // 1. Initial Load
    staffService.getStaffByBranch().then(setStaffList)

    // 2. Realtime sync with Firestore
    const unsubscribe = onSnapshot(collection(db, 'staff'), () => {
      staffService.getStaffByBranch().then(setStaffList)
    }, (err) => console.warn('QuickSale staff sync error:', err))

    return () => {
      unsubscribe()
    }
  }, [])


  const removeService = (index: number) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index))
  }

  const updateServiceQty = (index: number, qty: number) => {
    const updated = [...selectedServices]
    updated[index].qty = Math.max(1, qty)
    setSelectedServices(updated)
  }

  const subtotal = selectedServices.reduce((sum, service) => sum + (service.price * service.qty), 0)
  const discount = discountType === 'percentage' ? (subtotal * discountValue / 100) : discountValue
  const netAmount = subtotal - discount
  const tax = netAmount * 0.05
  const total = netAmount + tax

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Quick Sale</h2>
        <button className="button button-secondary" onClick={onClose}>
          ← Back to Dashboard
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
        {/* Left Side - Service Selection */}
        <div className="card">
          <div className="card-title">Service Details</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label className="form-label">Customer Name/Mobile</label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter customer name or mobile"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Billing Date</label>
              <input
                type="date"
                className="input-field"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button className="button button-primary" style={{ padding: '8px 15px', fontSize: '14px' }}>+ Add Service</button>
            <button className="button button-primary" style={{ padding: '8px 15px', fontSize: '14px' }}>+ Add Package</button>
            <button className="button button-primary" style={{ padding: '8px 15px', fontSize: '14px' }}>+ Add Product</button>
          </div>

          {selectedServices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#1a1f3a', borderRadius: '6px' }}>
              <p style={{ color: '#9ca3af' }}>No services added yet</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Staff</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Disc. Amt</th>
                  <th>Disc. %</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedServices.map((service, idx) => (
                  <tr key={idx}>
                    <td>{service.name}</td>
                    <td style={{ fontSize: '12px' }}>
                      <select className="input-field" style={{ padding: '4px' }} defaultValue={service.staff}>
                        {staffList.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                        {staffList.length === 0 && <option>{service.staff}</option>}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="input-field"
                        value={service.qty}
                        onChange={(e) => updateServiceQty(idx, parseInt(e.target.value))}
                        style={{ width: '50px', padding: '4px' }}
                      />
                    </td>
                    <td>₹{service.price}</td>
                    <td>₹0</td>
                    <td>0%</td>
                    <td style={{ color: '#06b6d4', fontWeight: 'bold' }}>₹{service.price * service.qty}</td>
                    <td>
                      <button
                        onClick={() => removeService(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#1a1f3a', borderRadius: '6px' }}>
            <h4 style={{ marginBottom: '15px', fontWeight: 'bold' }}>Apply Discount on Overall Invoice</h4>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
              The overall discount is only applicable to services and products separately. It cannot be clubbed with the discount applied to the services and products.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input
                type="number"
                className="input-field"
                placeholder="Disc. by value"
                value={discountType === 'value' ? discountValue : ''}
                onChange={(e) => { setDiscountType('value'); setDiscountValue(parseFloat(e.target.value) || 0); }}
                style={{ fontSize: '12px' }}
              />
              <input
                type="number"
                className="input-field"
                placeholder="Disc. by percentage"
                value={discountType === 'percentage' ? discountValue : ''}
                onChange={(e) => { setDiscountType('percentage'); setDiscountValue(parseFloat(e.target.value) || 0); }}
                style={{ fontSize: '12px' }}
              />
            </div>
            <div style={{ marginTop: '10px' }}>
              <button className="button button-secondary" style={{ width: '100%' }}>Redeem Reward Points</button>
            </div>
          </div>
        </div>

        {/* Right Side - Bill Summary */}
        <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '20px' }}>
          <div className="card-title">Bill Summary</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', cursor: 'pointer' }}>
            <input type="checkbox" />
            <span style={{ fontSize: '12px' }}>Apply Tax</span>
          </label>

          <div className="bill-summary">
            <div className="bill-row">
              <span>Sub Total</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="bill-row">
              <span>Discount</span>
              <span style={{ color: '#f59e0b' }}>-₹{discount.toFixed(2)}</span>
            </div>
            <div className="bill-row">
              <span>Reward Value Discount</span>
              <span>₹0.00</span>
            </div>
            <div className="bill-row">
              <span>Net Amount</span>
              <span style={{ color: '#06b6d4' }}>₹{netAmount.toFixed(2)}</span>
            </div>
            <div className="bill-row">
              <span>Tax (5%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="bill-row total">
              <span>Total</span>
              <span style={{ color: '#f59e0b', fontSize: '20px' }}>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="number"
              className="input-field"
              placeholder="Remarks"
              style={{ fontSize: '12px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="button button-primary" style={{ flex: 1, fontSize: '12px' }}>
                💳 Card
              </button>
              <button className="button button-primary" style={{ flex: 1, fontSize: '12px' }}>
                💰 Cash
              </button>
            </div>
            <button className="button button-yellow" style={{ width: '100%', fontWeight: 'bold' }}>
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
