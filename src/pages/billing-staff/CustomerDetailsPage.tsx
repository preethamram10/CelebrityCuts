import { useState, useEffect } from 'react'
import '../../theme.css'

import { customerService } from '../../services/customerService'
import { db } from '../../lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

interface Bill {
  id: string
  date: string // ISO format
  totalAmount: number
  services: Array<{ name: string; quantity: number; price: number }>
  products?: Array<{ name: string; amount: number }>
}

interface CustomerDetails {
  id: string
  name: string
  phoneNumber: string
  visits: Array<Bill>
}

const CustomerDetailsPage: React.FC<{ customerId: string }> = ({ customerId }) => {
  const [customer, setCustomer] = useState<CustomerDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        setLoading(true)

        // 1. Fetch Customer info
        const allCustomers = await customerService.getAllCustomers()
        const custData = allCustomers.find(c => c.id === customerId || c.phoneNumber === customerId)

        const custPhone = custData ? custData.phoneNumber : customerId
        const custName = custData ? custData.name : 'Customer'

        // 2. Fetch real Invoices for this customer
        const invSnap = await getDocs(collection(db, 'invoices'))
        const invList = invSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((inv: any) => inv.customer_phone === custPhone)
        invList.sort((a: any, b: any) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())

        const visits: Bill[] = (invList || []).map((inv: any) => {
          const items = Array.isArray(inv.items) ? inv.items : [];
          const services: any[] = [];
          const products: any[] = [];

          items.forEach((it: any) => {
            if (it.category === 'Product') {
              products.push({ name: it.name, amount: it.total || it.price || 0 });
            } else {
              services.push({ name: it.name, quantity: it.quantity || 1, price: it.price || it.total || 0 });
            }
          });

          return {
            id: inv.invoice_no || inv.id,
            date: inv.created_at || new Date().toISOString(),
            totalAmount: Number(inv.total_amount || 0),
            services,
            products
          };
        });

        setCustomer({
          id: customerId,
          name: custName || (invList && invList[0]?.customer_name) || 'Walk-in Customer',
          phoneNumber: custPhone,
          visits
        });
      } catch (error) {
        console.error('Failed to load real customer data:', error);
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerDetails()
  }, [customerId])

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading customer details...</div>
  }

  if (!customer) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-gray)' }}>No customer data found.</div>
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div className="card" style={{ marginBottom: 28, border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="card-title" style={{ fontSize: 20, marginBottom: 14 }}>Customer Details</div>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Name: <span style={{ color: 'var(--accent-gold)' }}>{customer.name}</span></div>
        <div style={{ fontSize: 15 }}>Mobile: <span style={{ color: 'var(--accent-gold)', fontWeight: 500 }}>{customer.phoneNumber}</span></div>
      </div>
      <div className="card" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="card-title" style={{ fontSize: 18, marginBottom: 14 }}>
          Previous Visits & Bills ({customer.visits.length})
        </div>
        {customer.visits.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-gray)', padding: 20 }}>No visits found for this customer.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Services</th>
                <th>Products</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {customer.visits.map(bill => (
                <tr key={bill.id}>
                  <td>{new Date(bill.date).toLocaleDateString('en-IN')} <span style={{ color: 'var(--text-gray)', fontSize: 11 }}>{new Date(bill.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></td>
                  <td style={{ fontSize: 13 }}>
                    {bill.services.map((s, i) => (
                      <div key={i}>{s.name} (x{s.quantity}) <span style={{ color: 'var(--text-gray)', fontWeight: 400 }}>₹{s.price}</span></div>
                    ))}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {bill.products?.length
                      ? bill.products.map((p, i) => (
                          <div key={i}>{p.name} <span style={{ color: 'var(--text-gray)', fontWeight: 400 }}>₹{p.amount}</span></div>
                        ))
                      : <i style={{ color: 'var(--text-gray)' }}>-</i>}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>₹{bill.totalAmount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default CustomerDetailsPage

