import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://audcywqpykgjotfhxywf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aR9e6Pl1Hkkc7oFSnrxLIw_FnjcUZjx';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const yesterdayISO = '2026-08-17T14:30:00.000Z';
const yesterdayDate = '2026-08-17';

const sampleInvoices = [
  {
    id: 'INV-branch1-1723891200001',
    invoice_no: 'INV-branch1-1723891200001',
    customer_name: 'Ramesh Kumar',
    customer_phone: '9849011111',
    total_amount: 3500,
    payment_mode: 'UPI',
    created_at: '2026-08-17T11:30:00.000Z',
    items: [
      { name: 'Haircut & Styling', price: 1500, quantity: 1, total: 1500, category: 'Haircut' },
      { name: 'Hair Color', price: 2000, quantity: 1, total: 2000, category: 'Hair Color' }
    ]
  },
  {
    id: 'INV-branch1-1723891200002',
    invoice_no: 'INV-branch1-1723891200002',
    customer_name: 'Sneha Reddy',
    customer_phone: '9849022222',
    total_amount: 18500,
    payment_mode: 'Card',
    created_at: '2026-08-17T14:15:00.000Z',
    items: [
      { name: 'Keratin 20 Inch Extension', price: 18500, quantity: 1, total: 18500, category: 'Hair Extensions' }
    ]
  },
  {
    id: 'INV-branch1-1723891200003',
    invoice_no: 'INV-branch1-1723891200003',
    customer_name: 'Kiran Verma',
    customer_phone: '9849033333',
    total_amount: 4200,
    payment_mode: 'Cash',
    created_at: '2026-08-17T16:45:00.000Z',
    items: [
      { name: 'Luxury Facial', price: 3500, quantity: 1, total: 3500, category: 'Facial' },
      { name: 'Hair Care Serum', price: 700, quantity: 1, total: 700, category: 'Product' }
    ]
  },
  {
    id: 'INV-branch2-1723891200004',
    invoice_no: 'INV-branch2-1723891200004',
    customer_name: 'Anil Varma (Vizag)',
    customer_phone: '9849044444',
    total_amount: 2500,
    payment_mode: 'UPI',
    created_at: '2026-08-17T12:10:00.000Z',
    items: [
      { name: 'Beard Trim & Haircut', price: 2500, quantity: 1, total: 2500, category: 'Styling' }
    ]
  },
  {
    id: 'INV-branch3-1723891200005',
    invoice_no: 'INV-branch3-1723891200005',
    customer_name: 'Pooja Naidu (Vijayawada)',
    customer_phone: '9849055555',
    total_amount: 12000,
    payment_mode: 'Card',
    created_at: '2026-08-17T15:20:00.000Z',
    items: [
      { name: 'Tape-In 20 Inch Extension', price: 12000, quantity: 1, total: 12000, category: 'Hair Extensions' }
    ]
  }
];

async function seedYesterday() {
  console.log('Inserting Yesterday sample invoices...');
  const { data, error } = await supabase.from('invoices').upsert(sampleInvoices);
  if (error) {
    console.error('Error inserting yesterday invoices:', error);
  } else {
    console.log('Successfully inserted yesterday sample invoices!');
  }
}

seedYesterday();
