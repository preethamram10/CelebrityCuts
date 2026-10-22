import { initializeApp } from 'firebase/app';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAT7ZQsAL2a_JoyJx-Aw4CjrlFd2GmOfMc",
  authDomain: "cccuts-eccaa.firebaseapp.com",
  projectId: "cccuts-eccaa",
  storageBucket: "cccuts-eccaa.firebasestorage.app",
  messagingSenderId: "228632809525",
  appId: "1:228632809525:web:0fc20666d87098bc98e17c",
  measurementId: "G-LXKQJY74XM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SUPABASE_URL = 'https://audcywqpykgjotfhxywf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aR9e6Pl1Hkkc7oFSnrxLIw_FnjcUZjx';

async function fetchAllFromSupabase(table) {
  let allRows = [];
  let offset = 0;
  const limit = 1000;
  console.log(`Fetching ${table} from Supabase...`);

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!res.ok) {
      console.error(`Failed to fetch ${table} at offset ${offset}:`, res.statusText);
      break;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    allRows = allRows.concat(data);
    offset += data.length;
    console.log(`  Fetched ${allRows.length} rows from ${table}...`);
    if (data.length < limit) break;
  }

  return allRows;
}

async function batchWriteToFirestore(collectionName, items, mapDocId, mapData) {
  console.log(`Writing ${items.length} records into Firestore collection "${collectionName}"...`);
  let batch = writeBatch(db);
  let count = 0;
  let totalCommitted = 0;

  for (const item of items) {
    const docId = mapDocId(item);
    if (!docId) continue;
    const docData = mapData(item);
    const docRef = doc(db, collectionName, String(docId));
    batch.set(docRef, docData, { merge: true });
    count++;

    if (count === 400) {
      await batch.commit();
      totalCommitted += count;
      console.log(`  Committed ${totalCommitted}/${items.length} to "${collectionName}"...`);
      batch = writeBatch(db);
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
    totalCommitted += count;
  }

  console.log(`✓ Completed writing ${totalCommitted} records to "${collectionName}".\n`);
  return totalCommitted;
}

async function runFullMigration() {
  console.log('=== STARTING FULL SUPABASE -> FIREBASE MIGRATION ===\n');

  // 1. Staff
  const staffRows = await fetchAllFromSupabase('staff');
  if (staffRows.length > 0) {
    await batchWriteToFirestore(
      'staff',
      staffRows,
      item => item.id || item.mobile,
      item => ({
        id: item.id || item.mobile,
        name: item.name || '',
        role: item.role || 'Stylist',
        mobile: item.mobile || '',
        branchId: item.branchId || item.branch_id || 'branch1',
        status: item.status || 'Active',
        joinDate: item.join_date || item.joinDate || '2026-01-01',
        created_at: item.created_at || new Date().toISOString()
      })
    );
  }

  // 2. Customers
  const customerRows = await fetchAllFromSupabase('customers');
  if (customerRows.length > 0) {
    await batchWriteToFirestore(
      'customers',
      customerRows,
      item => item.id || item.phone_number,
      item => {
        const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Customer';
        return {
          id: item.id || item.phone_number,
          name: fullName,
          first_name: item.first_name || '',
          last_name: item.last_name || '',
          phoneNumber: item.phone_number || '',
          phone_number: item.phone_number || '',
          branchId: item.branch_id || 'branch1',
          branch_id: item.branch_id || 'branch1',
          visitsCount: Number(item.visit_count || 1),
          visit_count: Number(item.visit_count || 1),
          totalSpent: Number(item.total_amount || 0),
          total_amount: Number(item.total_amount || 0),
          visit_date: item.visit_date || '',
          created_at: item.created_at || new Date().toISOString()
        };
      }
    );
  }

  // 3. Hair Extensions
  const extRows = await fetchAllFromSupabase('hair_extensions');
  if (extRows.length > 0) {
    await batchWriteToFirestore(
      'hair_extensions',
      extRows,
      item => item.id,
      item => ({
        id: item.id,
        name: item.name || '',
        type: item.type || null,
        color: item.color || null,
        length: item.length || null,
        stock: Number(item.stock || 10),
        price: Number(item.price || item.selling_price || 0),
        selling_price: Number(item.selling_price || item.price || 0),
        cost_price: Number(item.cost_price || 0),
        branch_id: item.branch_id || 'branch1',
        category: item.category || 'Hair Extensions'
      })
    );
  }

  // 4. Invoices
  const invoiceRows = await fetchAllFromSupabase('invoices');
  if (invoiceRows.length > 0) {
    await batchWriteToFirestore(
      'invoices',
      invoiceRows,
      item => item.invoice_no || item.id,
      item => ({
        id: item.id || item.invoice_no,
        invoice_no: item.invoice_no || item.id,
        customer_name: item.customer_name || '',
        customer_phone: item.customer_phone || '',
        items: Array.isArray(item.items) ? item.items : [],
        total_amount: Number(item.total_amount || 0),
        payment_mode: item.payment_mode || 'Cash',
        branch_id: item.branch_id || '',
        created_at: item.created_at || new Date().toISOString()
      })
    );
  }

  // 5. Transactions
  const txRows = await fetchAllFromSupabase('transactions');
  if (txRows.length > 0) {
    await batchWriteToFirestore(
      'transactions',
      txRows,
      item => item.id,
      item => ({
        id: item.id,
        date: item.date || '',
        time: item.time || '',
        amount: Number(item.amount || 0),
        customerId: item.customerId || '',
        customerName: item.customerName || '',
        branchId: item.branchId || '',
        paymentMethod: item.paymentMethod || 'Cash',
        items: Array.isArray(item.items) ? item.items : []
      })
    );
  }

  console.log('=== FULL SUPABASE -> FIREBASE MIGRATION FINISHED SUCCESSFULLY! ===');
  process.exit(0);
}

runFullMigration().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
