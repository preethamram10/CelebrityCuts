import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://audcywqpykgjotfhxywf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aR9e6Pl1Hkkc7oFSnrxLIw_FnjcUZjx';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function dumpTransactions() {
    const { data: tx } = await supabase.from('transactions').select('*');
    console.log(JSON.stringify(tx, null, 2));
}
dumpTransactions();