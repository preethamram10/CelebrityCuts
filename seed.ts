import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { SERVICE_DATA } from './src/pages/billing-staff/services-data';

// Read .env file manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        env[match[1]] = match[2].replace(/^['"](.*)['"]$/, '$1').trim();
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error("Could not find Supabase URL or Key in .env file");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const HAIR_EXTENSIONS_DATA = [
    { name: 'Tape-In Hair Extensions Refill', price: 10000 },
    { name: 'Clip-In Hair Extensions 7 Set', price: 15000 },
    { name: 'Keratin Bond Refill', price: 8000 },
    { name: 'Micro-Ring Refill', price: 9000 },
    { name: 'Invisible Tapes 20 pcs', price: 12000 },
    { name: 'Halo Hair Extension', price: 11000 },
    { name: 'Volume Topper (Basic)', price: 6000 },
    { name: 'Volume Topper (Premium)', price: 15000 },
    { name: 'Clip-In Highlights (Per piece)', price: 1500 },
    { name: 'Ponytail Extension 20 Inch', price: 8000 },
    { name: 'Clip-In Volumizer', price: 9500 },
    { name: 'Tape-In 18 Inch', price: 18000 },
    { name: 'Tape-In 20 Inch', price: 20000 },
    { name: 'Tape-In 22 Inch', price: 22000 },
    { name: 'Tape-In 24 Inch', price: 24000 },
    { name: 'Tape-In 26 Inch', price: 26000 },
    { name: 'Tape-In 28 Inch', price: 28000 },
    { name: 'Tape-In 30 Inch', price: 30000 },
    { name: 'Tape-In 32 Inch', price: 32000 },
    { name: 'Tape-In 34 Inch', price: 34000 },
    { name: 'Tape-In 36 Inch', price: 36000 },
    { name: 'Tape-In 38 Inch', price: 38000 },
    { name: 'Tape-In 40 Inch', price: 40000 },
    { name: 'Keratin 18 Inch', price: 16000 },
    { name: 'Keratin 20 Inch', price: 18000 },
    { name: 'Keratin 22 Inch', price: 20000 },
    { name: 'Keratin 24 Inch', price: 22000 },
    { name: 'Keratin 26 Inch', price: 24000 },
    { name: 'Keratin 28 Inch', price: 26000 },
    { name: 'Keratin 30 Inch', price: 28000 },
    { name: 'Keratin 32 Inch', price: 30000 },
    { name: 'Keratin 34 Inch', price: 32000 },
    { name: 'Keratin 36 Inch', price: 34000 },
    { name: 'Keratin 38 Inch', price: 36000 },
    { name: 'Keratin 40 Inch', price: 38000 },
    { name: 'Micro-Ring 18 Inch', price: 17000 },
    { name: 'Micro-Ring 20 Inch', price: 19000 },
    { name: 'Micro-Ring 22 Inch', price: 21000 },
    { name: 'Micro-Ring 24 Inch', price: 23000 },
    { name: 'Micro-Ring 26 Inch', price: 25000 },
    { name: 'Micro-Ring 28 Inch', price: 27000 },
    { name: 'Micro-Ring 30 Inch', price: 29000 },
    { name: 'Micro-Ring 32 Inch', price: 31000 },
    { name: 'Micro-Ring 34 Inch', price: 33000 },
    { name: 'Micro-Ring 36 Inch', price: 35000 },
    { name: 'Micro-Ring 38 Inch', price: 37000 },
    { name: 'Micro-Ring 40 Inch', price: 39000 },
    { name: 'Hot-Fusion 18 Inch', price: 22000 },
    { name: 'Hot-Fusion 20 Inch', price: 24000 },
    { name: 'Hot-Fusion 22 Inch', price: 26000 },
    { name: 'Hot-Fusion 24 Inch', price: 28000 },
    { name: 'Hot-Fusion 26 Inch', price: 30000 },
    { name: 'Hot-Fusion 28 Inch', price: 32000 },
    { name: 'Hot-Fusion 30 Inch', price: 34000 },
    { name: 'Hot-Fusion 32 Inch', price: 36000 },
    { name: 'Hot-Fusion 34 Inch', price: 38000 },
    { name: 'Hot-Fusion 36 Inch', price: 40000 },
    { name: 'Hot-Fusion 38 Inch', price: 42000 },
    { name: 'Hot-Fusion 40 Inch', price: 44000 },
    { name: 'Hair Extensions Refill', price: 5000 },
    { name: 'Luxury Ice 50g - 16 Inch', price: 17000 },
    { name: 'Luxury Ice 50g - 18 Inch', price: 18000 },
    { name: 'Luxury Ice 50g - 20 Inch', price: 19000 },
    { name: 'Luxury Ice 100g - 16 Inch', price: 34000 },
    { name: 'Luxury Ice 100g - 18 Inch', price: 36000 },
    { name: 'Luxury Ice 100g - 20 Inch', price: 38000 },
    { name: 'Luxury Ice 100g - 22 Inch', price: 40000 },
    { name: 'Luxury Ice 100g - 24 Inch', price: 42000 },
    { name: 'Luxury Ice 100g - 26 Inch', price: 44000 },
    { name: 'Luxury Ice 100g - 28 Inch', price: 46000 },
    { name: 'Luxury Ice 100g - 30 Inch', price: 48000 },
    { name: 'Luxury Ice 100g - 32 Inch', price: 50000 },
    { name: 'Luxury Ice 100g - 34 Inch', price: 52000 },
    { name: 'Luxury Ice 100g - 36 Inch', price: 54000 },
    { name: 'Luxury Ice 100g - 38 Inch', price: 56000 },
    { name: 'Luxury Ice 100g - 40 Inch', price: 58000 },
    { name: 'Refix Charges (50g)', price: 5000 },
    { name: 'Refix Charges (100g)', price: 10000 },
];

async function seed() {
    console.log('Seeding normal services...');
    for (const s of SERVICE_DATA) {
        const { error } = await supabase.from('services').insert({
            name: s.name,
            price: s.price,
            category: s.category,
            duration: '30 min'
        });
        if (error) {
            console.error(`Error inserting ${s.name}:`, error.message);
        } else {
            console.log(`Inserted ${s.name}`);
        }
    }
    console.log('Done with normal services.');

    console.log('Seeding hair extensions into hair_extensions table...');
    
    // Just use 'branch1' as the default branch_id since branches table might not exist yet
    const branchId = 'branch1';

    for (const ext of HAIR_EXTENSIONS_DATA) {
        // We'll insert it into hair_extensions first to be safe
        const { error: err1 } = await supabase.from('hair_extensions').insert({
            id: crypto.randomUUID(),
            name: ext.name,
            price: ext.price,
            category: 'Hair Extensions',
            stock: 10,
            branch_id: branchId
        });
        if (err1) {
            console.error(`Error inserting ${ext.name} into hair_extensions:`, err1.message);
        } else {
            console.log(`Inserted ${ext.name} into hair_extensions`);
        }
    }
    console.log('Done with hair extensions.');
}

seed();
