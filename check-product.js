import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://audcywqpykgjotfhxywf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aR9e6Pl1Hkkc7oFSnrxLIw_FnjcUZjx';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkProductSales() {
    console.log("Fetching all transactions...");
    const { data: tx, error } = await supabase.from('transactions').select('id, items, amount');

    if (error) {
        console.error("Transactions Error:", error);
        return;
    }

    let foundProduct = false;
    tx.forEach(t => {
        if (t.items && Array.isArray(t.items)) {
            t.items.forEach(item => {
                if (item.type === 'product') {
                    foundProduct = true;
                    console.log(`Found Product Sale in TX ${t.id}:`, item);
                }
            });
        }
    });

    if (!foundProduct) {
        console.log("No product sales found in the database. But length is", tx.length);
    }
}

checkProductSales();
