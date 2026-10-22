import React from 'react'


interface ServiceMenuProps {
  onClose: () => void
}

export default function ServiceMenu({ onClose }: ServiceMenuProps) {
  const [searchTerm, setSearchTerm] = React.useState('')

  const services = [
    // HAIRCUT SERVICES
    { id: 1, name: 'Basic Hair Cut', price: 300, duration: '20 min', category: 'Haircut' },
    { id: 2, name: 'Hair Cut + Shampoo', price: 400, duration: '35 min', category: 'Haircut' },
    { id: 3, name: 'Hair Cut + Shampoo + Blow Dry', price: 550, duration: '45 min', category: 'Haircut' },
    { id: 4, name: 'Premium Hair Cut', price: 600, duration: '50 min', category: 'Haircut' },

    // HAIR TREATMENT & CONDITIONING
    { id: 5, name: 'Hair Spa (Deep Conditioning)', price: 1200, duration: '60 min', category: 'Treatment' },
    { id: 6, name: 'Keratin Treatment', price: 3500, duration: '120 min', category: 'Treatment' },
    { id: 7, name: 'Hair Fall Control Treatment', price: 2000, duration: '90 min', category: 'Treatment' },
    { id: 8, name: 'Protein Treatment', price: 1500, duration: '75 min', category: 'Treatment' },
    { id: 9, name: 'Hair Smoothening', price: 2500, duration: '120 min', category: 'Treatment' },
    { id: 10, name: 'Hair Rebonding', price: 4000, duration: '150 min', category: 'Treatment' },

    // COLORING SERVICES
    { id: 11, name: 'Hair Coloring (Full)', price: 1800, duration: '90 min', category: 'Coloring' },
    { id: 12, name: 'Hair Coloring (Roots Only)', price: 1200, duration: '60 min', category: 'Coloring' },
    { id: 13, name: 'Highlights/Lowlights', price: 2500, duration: '120 min', category: 'Coloring' },
    { id: 14, name: 'Balayage', price: 3000, duration: '150 min', category: 'Coloring' },
    { id: 15, name: 'Color Correction', price: 3500, duration: '120 min', category: 'Coloring' },

    // BEARD & GROOMING
    { id: 16, name: 'Beard Trim', price: 200, duration: '15 min', category: 'Beard' },
    { id: 17, name: 'Beard Shaping & Styling', price: 350, duration: '25 min', category: 'Beard' },
    { id: 18, name: 'Beard Trim + Shampoo', price: 400, duration: '30 min', category: 'Beard' },
    { id: 19, name: 'Beard Care Treatment', price: 800, duration: '45 min', category: 'Beard' },

    // FACIAL SERVICES
    { id: 20, name: 'Basic Facial', price: 800, duration: '45 min', category: 'Facial' },
    { id: 21, name: 'Anti-Acne Facial', price: 1200, duration: '60 min', category: 'Facial' },
    { id: 22, name: 'Brightening Facial', price: 1500, duration: '60 min', category: 'Facial' },
    { id: 23, name: 'HydraFacial', price: 2500, duration: '60 min', category: 'Facial' },

    // MASSAGE & RELAXATION
    { id: 24, name: 'Head & Neck Massage', price: 400, duration: '30 min', category: 'Massage' },
    { id: 25, name: 'Head, Neck & Shoulder Massage', price: 600, duration: '45 min', category: 'Massage' },
    { id: 26, name: 'Full Body Massage', price: 1500, duration: '60 min', category: 'Massage' },
    { id: 27, name: 'Aromatherapy Massage', price: 1800, duration: '60 min', category: 'Massage' },

    // SPECIAL GROOMING
    { id: 28, name: 'Complete Grooming Package', price: 2000, duration: '90 min', category: 'Grooming' },
    { id: 29, name: 'Bridal Grooming', price: 3500, duration: '120 min', category: 'Grooming' },
    { id: 30, name: 'Party/Event Styling', price: 2500, duration: '90 min', category: 'Grooming' },
  ]

  const packages = [
    { id: 1, name: 'Monthly Hair Care', price: 2500, services: 4, validity: '30 days', desc: 'Haircut + Shampoo + 2 Treatments' },
    { id: 2, name: 'Premium Grooming', price: 4500, services: 6, validity: '30 days', desc: 'Haircut + Facial + Massage + Beard' },
    { id: 3, name: 'Signature Celebrity Plan', price: 6500, services: 8, validity: '30 days', desc: 'Complete Monthly Salon Package' },
    { id: 4, name: 'Hair Transformation', price: 5999, services: 5, validity: '60 days', desc: 'Color + Treatment + Cut + Spa' },
    { id: 5, name: 'Bridal Special', price: 8999, services: 10, validity: '90 days', desc: 'Pre-wedding Complete Grooming' },
  ]

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Available Services & Packages</h2>
        <button className="button button-secondary" onClick={onClose}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="search-bar" style={{ marginBottom: '20px' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>

      <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>Individual Services</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        {filteredServices.map((service) => (
          <div key={service.id} className="card" style={{ padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
              <div>
                <h4 style={{ fontWeight: 'bold', marginBottom: '5px' }}>{service.name}</h4>
                <span style={{ fontSize: '12px', color: '#9ca3af', backgroundColor: 'var(--primary-dark)', padding: '4px 8px', borderRadius: '4px' }}>
                  {service.category}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <div>
                <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '18px' }}>₹{service.price}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{service.duration}</div>
              </div>
              <button className="button button-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                Select
              </button>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>Package Deals</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
        {packages.map((pkg) => (
          <div key={pkg.id} className="card" style={{
            padding: '15px',
            border: '2px solid var(--accent-yellow)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: -12,
              right: 15,
              backgroundColor: 'var(--accent-yellow)',
              color: 'var(--primary-dark)',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              PACKAGE
            </div>
            <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>{pkg.name}</h4>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>{pkg.desc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Services Included:</span>
                <span style={{ color: '#06b6d4' }}>{pkg.services} services</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Validity:</span>
                <span style={{ color: '#10b981' }}>{pkg.validity}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '20px' }}>₹{pkg.price}</div>
              <button className="button button-primary" style={{ padding: '6px 12px' }}>
                Add Package
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
