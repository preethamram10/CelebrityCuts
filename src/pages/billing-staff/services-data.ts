
export interface Service {
    id: string
    name: string
    price: number
    category: string
    description?: string
}

export const SERVICE_DATA: Service[] = [
    // HAIRCUT
    { id: 'hc1m', name: 'Basic Hair Cut (Male)', price: 500, category: 'Haircut' },
    { id: 'hc1f', name: 'Basic Hair Cut (Female)', price: 1000, category: 'Haircut' },
    { id: 'hc2m', name: 'Advance Hair Cut (Male)', price: 700, category: 'Haircut' },
    { id: 'hc2f', name: 'Advance Hair Cut (Female)', price: 1500, category: 'Haircut' },
    { id: 'hc3m', name: 'Creative Hair Cut (Male)', price: 1000, category: 'Haircut' },
    { id: 'hc3f', name: 'Creative Hair Cut (Female)', price: 2000, category: 'Haircut' },
    { id: 'hcsdm', name: 'Style Director (Male)', price: 2000, category: 'Haircut' },
    { id: 'hcsdf', name: 'Style Director (Female)', price: 4000, category: 'Haircut' },
    { id: 'hc5', name: 'Beard Trim', price: 200, category: 'Haircut' },
    { id: 'hc4', name: 'Shave', price: 200, category: 'Haircut' },

    // HAIR TREATMENT
    { id: 'ht2m', name: 'Hair Spa (Male)', price: 2000, category: 'Hair Treatment' },
    { id: 'ht2f', name: 'Hair Spa (Female)', price: 3000, category: 'Hair Treatment' },
    { id: 'ht3m', name: 'Dandruff Treatment (Male)', price: 3000, category: 'Hair Treatment' },
    { id: 'ht3f', name: 'Dandruff Treatment (Female)', price: 4000, category: 'Hair Treatment' },
    { id: 'ht4m', name: 'Anti Hairloss Treatment (Male)', price: 3000, category: 'Hair Treatment' },
    { id: 'ht4f', name: 'Anti Hairloss Treatment (Female)', price: 4000, category: 'Hair Treatment' },
    { id: 'ht5m', name: 'Hair Spa (Moroccan) (Male)', price: 3000, category: 'Hair Treatment' },
    { id: 'ht5f', name: 'Hair Spa (Moroccan) (Female)', price: 5000, category: 'Hair Treatment' },
    { id: 'ht6m', name: 'Fiber Clinix (Male)', price: 3000, category: 'Hair Treatment' },
    { id: 'ht6f', name: 'Fiber Clinix (Female)', price: 5000, category: 'Hair Treatment' },
    { id: 'ht7m', name: 'Fibre Plex (Male)', price: 3000, category: 'Hair Treatment' },
    { id: 'ht7f', name: 'Fibre Plex (Female)', price: 5000, category: 'Hair Treatment' },

    // HAIR TEXTURE
    { id: 'ht8m', name: 'Straightening (Male)', price: 5000, category: 'Hair Texture' },
    { id: 'ht8f', name: 'Straightening (Female)', price: 10000, category: 'Hair Texture' },
    { id: 'ht9m', name: 'Smoothening (Male)', price: 5000, category: 'Hair Texture' },
    { id: 'ht9f', name: 'Smoothening (Female)', price: 10000, category: 'Hair Texture' },
    { id: 'ht10m', name: 'Keratin (Male)', price: 5000, category: 'Hair Texture' },
    { id: 'ht10f', name: 'Keratin (Female)', price: 10000, category: 'Hair Texture' },
    { id: 'ht11m', name: 'Botox Treatment (Male)', price: 6000, category: 'Hair Texture' },
    { id: 'ht11f', name: 'Botox Treatment (Female)', price: 10000, category: 'Hair Texture' },
    { id: 'ht12m', name: 'Nanoplastia (Male)', price: 8000, category: 'Hair Texture' },
    { id: 'ht12f', name: 'Nanoplastia (Female)', price: 12000, category: 'Hair Texture' },
    { id: 'ht13m', name: 'Hair Perming (Male)', price: 8000, category: 'Hair Texture' },
    { id: 'ht13f', name: 'Hair Perming (Female)', price: 12000, category: 'Hair Texture' },
    { id: 'ht14m', name: 'Permanent Blow dry (Male)', price: 7000, category: 'Hair Texture' },
    { id: 'ht14f', name: 'Permanent Blow dry (Female)', price: 12000, category: 'Hair Texture' },
    { id: 'ht15', name: 'Rebonding', price: 6000, category: 'Hair Texture' },

    // HAIR COLOR
    { id: 'clr1', name: 'Highlights Per Streak', price: 500, category: 'Hair Color' },
    { id: 'clr2', name: 'Beard Moustache (With Ammonia)', price: 600, category: 'Hair Color' },
    { id: 'clr3', name: 'Beard Moustache (Ammonia Free)', price: 800, category: 'Hair Color' },
    { id: 'clr4m', name: 'Hair Colour With Ammonia (Male)', price: 1200, category: 'Hair Color' },
    { id: 'clr4f', name: 'Hair Colour With Ammonia (Female)', price: 2600, category: 'Hair Color' },
    { id: 'clr5m', name: 'Hair Colour Ammonia Free (Male)', price: 1500, category: 'Hair Color' },
    { id: 'clr5f', name: 'Hair Colour Ammonia Free (Female)', price: 3000, category: 'Hair Color' },
    { id: 'clr6m', name: 'Global Colour (Male)', price: 2000, category: 'Hair Color' },
    { id: 'clr6f', name: 'Global Colour (Female)', price: 5000, category: 'Hair Color' },
    { id: 'clr7m', name: 'Corrective Colour (Male)', price: 3000, category: 'Hair Color' },
    { id: 'clr7f', name: 'Corrective Colour (Female)', price: 8000, category: 'Hair Color' },

    // STYLING
    { id: 'sty1m', name: 'Hair Wash & Conditioning (Male)', price: 250, category: 'Styling' },
    { id: 'sty1f', name: 'Hair Wash & Conditioning (Female)', price: 500, category: 'Styling' },
    { id: 'sty2m', name: 'Wash & Blow Dry (Male)', price: 350, category: 'Styling' },
    { id: 'sty2f', name: 'Wash & Blow Dry (Female)', price: 800, category: 'Styling' },
    { id: 'sty3m', name: 'Ironing (Male)', price: 500, category: 'Styling' },
    { id: 'sty3f', name: 'Ironing (Female)', price: 2000, category: 'Styling' },
    { id: 'sty4m', name: 'Tongs (Male)', price: 500, category: 'Styling' },
    { id: 'sty4f', name: 'Tongs (Female)', price: 2000, category: 'Styling' },

    // MASSAGE
    { id: 'msg1m', name: 'Head Massage (Male)', price: 1000, category: 'Massage' },
    { id: 'msg1f', name: 'Head Massage (Female)', price: 1200, category: 'Massage' },
    { id: 'msg2m', name: 'Foot Massage (Male)', price: 1000, category: 'Massage' },
    { id: 'msg2f', name: 'Foot Massage (Female)', price: 1000, category: 'Massage' },
    { id: 'msg3', name: 'Body Polish', price: 6000, category: 'Massage' },

    // PIERCING
    { id: 'prc1', name: 'Gun Shot', price: 500, category: 'Piercing' },
    { id: 'prc2', name: 'Mole Removal', price: 500, category: 'Piercing' },

    // D-TAN
    { id: 'dt1', name: 'D-Tan Pack (Face)', price: 600, category: 'D-Tan' },
    { id: 'dt2', name: 'D-Tan Pack (Face, Neck)', price: 1000, category: 'D-Tan' },
    { id: 'dt3', name: 'D-Tan Pack (Face, Neck, Back)', price: 1400, category: 'D-Tan' },
    { id: 'dt4', name: 'D-Tan Back', price: 1800, category: 'D-Tan' },
    { id: 'dt5', name: 'D-Tan Stomach', price: 1000, category: 'D-Tan' },
    { id: 'dt6', name: 'Full Arms', price: 2000, category: 'D-Tan' },
    { id: 'dt7', name: 'Half Arms', price: 1400, category: 'D-Tan' },
    { id: 'dt8', name: 'Full Legs', price: 3000, category: 'D-Tan' },
    { id: 'dt9', name: 'Half Legs', price: 2000, category: 'D-Tan' },
    { id: 'dt10', name: 'O3 Tan Pack (Face)', price: 1200, category: 'D-Tan' },
    { id: 'dt11', name: 'O3 Tan Pack (Face, Neck)', price: 1600, category: 'D-Tan' },
    { id: 'dt12', name: 'O3 Tan Pack (Face, Neck, Back)', price: 2000, category: 'D-Tan' },
    { id: 'dt13', name: 'Gold Pack (Face)', price: 1000, category: 'D-Tan' },
    { id: 'dt14', name: 'Glow Pack (Face)', price: 1000, category: 'D-Tan' },

    // CLEAN-UP
    { id: 'cln1', name: 'Fruit Clean-up', price: 1200, category: 'Clean Up' },
    { id: 'cln2', name: 'Pearl Clean-up', price: 1400, category: 'Clean Up' },
    { id: 'cln3', name: 'Gold Clean-up', price: 1400, category: 'Clean Up' },
    { id: 'cln4', name: 'Diamond Clean-up', price: 1500, category: 'Clean Up' },
    { id: 'cln5', name: 'Wine Clean-up', price: 1600, category: 'Clean Up' },
    { id: 'cln6', name: 'O3 Clean-up', price: 2000, category: 'Clean Up' },

    // FACIALS (Standard)
    { id: 'fac1', name: 'Fruit Facial', price: 2000, category: 'Facial' },
    { id: 'fac2', name: 'Hydra Facial', price: 2500, category: 'Facial' },
    { id: 'fac3', name: 'Silver Facial', price: 2500, category: 'Facial' },
    { id: 'fac4', name: 'Tan Clear Facial', price: 2500, category: 'Facial' },
    { id: 'fac5', name: 'Wine Facial', price: 3000, category: 'Facial' },
    { id: 'fac6', name: 'Whitening Facial', price: 3000, category: 'Facial' },
    { id: 'fac7', name: 'Anti Aging Facial', price: 3500, category: 'Facial' },

    // LUXURY FACIALS
    { id: 'lxf1', name: 'Gold Facial', price: 3500, category: 'Luxury Facial' },
    { id: 'lxf2', name: 'Diamond Facial', price: 3500, category: 'Luxury Facial' },
    { id: 'lxf3', name: 'Seasoul Facial', price: 5000, category: 'Luxury Facial' },
    { id: 'lxf4', name: 'Pro Hydra Facial', price: 5000, category: 'Luxury Facial' },
    { id: 'lxf5', name: 'Aroma Magic Pro', price: 5000, category: 'Luxury Facial' },
    { id: 'lxf6', name: 'Pro Anti Aging Facial', price: 5000, category: 'Luxury Facial' },
    { id: 'lxf7', name: 'O3 Bridal Facial', price: 5000, category: 'Luxury Facial' },
    { id: 'lxf8', name: 'Oxygeneo Facial', price: 5000, category: 'Luxury Facial' },
    { id: 'lxf9', name: 'BB Glow', price: 8000, category: 'Luxury Facial' },
    { id: 'lxf10', name: 'Korean Glass Facial', price: 5000, category: 'Luxury Facial' },
    { id: 'lxf11', name: 'Acne Treatment', price: 4000, category: 'Luxury Facial' },
    { id: 'lxf12', name: 'Skin Lightening Treatment', price: 5000, category: 'Luxury Facial' },

    // PEDICURE
    { id: 'ped1', name: 'Pedicure (Basic)', price: 1000, category: 'Pedicure' },
    { id: 'ped2', name: 'Spa Pedicure', price: 1500, category: 'Pedicure' },
    { id: 'ped3', name: 'D-Tan Pedicure', price: 2000, category: 'Pedicure' },
    { id: 'ped5', name: 'Ice Cream Pedicure', price: 4000, category: 'Pedicure' },
    { id: 'ped4', name: 'Crystal Pedicure', price: 3800, category: 'Pedicure' },
    { id: 'ped_seasoul', name: 'Seasoul Pedicure', price: 4000, category: 'Pedicure' },
    { id: 'ped6', name: 'Heel Peel Treatment', price: 4000, category: 'Pedicure' },

    // MANICURE
    { id: 'man1', name: 'Manicure (Basic)', price: 1000, category: 'Manicure' },
    { id: 'man2', name: 'Spa Manicure', price: 1400, category: 'Manicure' },
    { id: 'man3', name: 'D-Tan Manicure', price: 1600, category: 'Manicure' },
    { id: 'man4', name: 'Crystal Manicure', price: 3400, category: 'Manicure' },
    { id: 'man5', name: 'Ice Cream Manicure', price: 3600, category: 'Manicure' },

    // NAILS
    { id: 'nail1', name: 'Cut & File', price: 300, category: 'Nails' },
    { id: 'nail2', name: 'Nail Polish', price: 200, category: 'Nails' },
    { id: 'nail3', name: 'French Polish', price: 400, category: 'Nails' },
    { id: 'nail4', name: 'Basic Extensions', price: 1000, category: 'Nails' },
    { id: 'nail5', name: 'Gel Polish', price: 2000, category: 'Nails' },

    // THREADING
    { id: 'th1', name: 'Eyebrows', price: 100, category: 'Threading' },
    { id: 'th2', name: 'Upper Lip', price: 100, category: 'Threading' },
    { id: 'th3', name: 'Forehead', price: 100, category: 'Threading' },
    { id: 'th4', name: 'Chin', price: 100, category: 'Threading' },
    { id: 'th5', name: 'Full Face', price: 400, category: 'Threading' },

    // WAXING
    { id: 'wx1r', name: 'Chin (Regular)', price: 150, category: 'Waxing' },
    { id: 'wx1p', name: 'Chin (Premium)', price: 200, category: 'Waxing' },
    { id: 'wx2r', name: 'Upper Lip (Regular)', price: 150, category: 'Waxing' },
    { id: 'wx2p', name: 'Upper Lip (Premium)', price: 200, category: 'Waxing' },
    { id: 'wx3r', name: 'Neck (Regular)', price: 200, category: 'Waxing' },
    { id: 'wx3p', name: 'Neck (Premium)', price: 300, category: 'Waxing' },
    { id: 'wx4r', name: 'Side Face (Regular)', price: 400, category: 'Waxing' },
    { id: 'wx4p', name: 'Side Face (Premium)', price: 600, category: 'Waxing' },
    { id: 'wx5r', name: 'Full Face (Regular)', price: 500, category: 'Waxing' },
    { id: 'wx5p', name: 'Full Face (Premium)', price: 700, category: 'Waxing' },
    { id: 'wx6r', name: 'Under Arms (Regular)', price: 300, category: 'Waxing' },
    { id: 'wx6p', name: 'Under Arms (Premium)', price: 400, category: 'Waxing' },
    { id: 'wx7r', name: 'Half Arms (Regular)', price: 400, category: 'Waxing' },
    { id: 'wx7p', name: 'Half Arms (Premium)', price: 700, category: 'Waxing' },
    { id: 'wx8r', name: 'Full Arms (Regular)', price: 600, category: 'Waxing' },
    { id: 'wx8p', name: 'Full Arms (Premium)', price: 1000, category: 'Waxing' },
    { id: 'wx9r', name: 'Half Legs (Regular)', price: 600, category: 'Waxing' },
    { id: 'wx9p', name: 'Half Legs (Premium)', price: 1000, category: 'Waxing' },
    { id: 'wx10r', name: 'Full Legs (Regular)', price: 800, category: 'Waxing' },
    { id: 'wx10p', name: 'Full Legs (Premium)', price: 1500, category: 'Waxing' },
    { id: 'wx11r', name: 'Half Back (Regular)', price: 600, category: 'Waxing' },
    { id: 'wx11p', name: 'Half Back (Premium)', price: 800, category: 'Waxing' },
    { id: 'wx12r', name: 'Full Back (Regular)', price: 800, category: 'Waxing' },
    { id: 'wx12p', name: 'Full Back (Premium)', price: 1000, category: 'Waxing' },
    { id: 'wx13r', name: 'Stomach (Regular)', price: 600, category: 'Waxing' },
    { id: 'wx13p', name: 'Stomach (Premium)', price: 800, category: 'Waxing' },
    { id: 'wx14r', name: 'Full Front (Regular)', price: 800, category: 'Waxing' },
    { id: 'wx14p', name: 'Full Front (Premium)', price: 1200, category: 'Waxing' },
    { id: 'wx15', name: 'Bikini', price: 3000, category: 'Waxing' },
    { id: 'wx16', name: 'Full Body', price: 6000, category: 'Waxing' },

    // MAKEUP
    { id: 'mk1', name: 'Party Makeup', price: 8000, category: 'Makeup' },
    { id: 'mk2', name: 'Natural Makeup', price: 10000, category: 'Makeup' },
    { id: 'mk3', name: 'Water Proof Makeup', price: 12000, category: 'Makeup' },
    { id: 'mk4', name: 'HD Makeup', price: 15000, category: 'Makeup' },
    { id: 'mk5', name: 'Air Brush Makeup', price: 25000, category: 'Makeup' },
    { id: 'mk6', name: 'Hair Styling', price: 2000, category: 'Makeup' },
    { id: 'mk7', name: 'Saree Draping', price: 2000, category: 'Makeup' },
    { id: 'mk8', name: 'Saree Box Folding', price: 1000, category: 'Makeup' },
    { id: 'mk9', name: 'Groom Makeup (Starts From)', price: 10000, category: 'Makeup' },
    { id: 'mk10', name: 'Bridal Makeup (Starts From)', price: 25000, category: 'Makeup' },

    // COMBOS (Package)
    { id: 'pkg1', name: 'Men Combo', price: 799, category: 'Package' },
    { id: 'pkg2', name: 'Women Combo', price: 999, category: 'Package' },
    { id: 'pkg3', name: 'Full Men Combo', price: 1499, category: 'Package' },
    { id: 'pkg4', name: 'Full Women Combo', price: 1899, category: 'Package' },
    { id: 'pkg5', name: 'Groom Combo', price: 5999, category: 'Package' },
    { id: 'pkg6', name: 'Bridal Combo', price: 6999, category: 'Package' },

    // HAIR EXTENSIONS - HOT FUSION
    { id: 'hf16', name: 'Hot-Fusion 16 Inch', price: 20000, category: 'Hair Extensions' },
    { id: 'hf18', name: 'Hot-Fusion 18 Inch', price: 22000, category: 'Hair Extensions' },
    { id: 'hf20', name: 'Hot-Fusion 20 Inch', price: 24000, category: 'Hair Extensions' },
    { id: 'hf22', name: 'Hot-Fusion 22 Inch', price: 26000, category: 'Hair Extensions' },
    { id: 'hf24', name: 'Hot-Fusion 24 Inch', price: 28000, category: 'Hair Extensions' },
    { id: 'hf26', name: 'Hot-Fusion 26 Inch', price: 30000, category: 'Hair Extensions' },
    { id: 'hf28', name: 'Hot-Fusion 28 Inch', price: 32000, category: 'Hair Extensions' },
    { id: 'hf30', name: 'Hot-Fusion 30 Inch', price: 34000, category: 'Hair Extensions' },
    { id: 'hf32', name: 'Hot-Fusion 32 Inch', price: 36000, category: 'Hair Extensions' },
    { id: 'hf34', name: 'Hot-Fusion 34 Inch', price: 38000, category: 'Hair Extensions' },
    { id: 'hf36', name: 'Hot-Fusion 36 Inch', price: 40000, category: 'Hair Extensions' },
    { id: 'hf38', name: 'Hot-Fusion 38 Inch', price: 42000, category: 'Hair Extensions' },
    { id: 'hf40', name: 'Hot-Fusion 40 Inch', price: 44000, category: 'Hair Extensions' },
    { id: 'hf_refill', name: 'Hair Extensions Refill', price: 5000, category: 'Hair Extensions' },

    // HAIR EXTENSIONS - LUXURY ICE (50g)
    { id: 'ice50_16', name: 'Luxury Ice 50g - 16 Inch', price: 17000, category: 'Hair Extensions' },
    { id: 'ice50_18', name: 'Luxury Ice 50g - 18 Inch', price: 18000, category: 'Hair Extensions' },
    { id: 'ice50_20', name: 'Luxury Ice 50g - 20 Inch', price: 19000, category: 'Hair Extensions' },

    // HAIR EXTENSIONS - LUXURY ICE (100g)
    { id: 'ice100_16', name: 'Luxury Ice 100g - 16 Inch', price: 34000, category: 'Hair Extensions' },
    { id: 'ice100_18', name: 'Luxury Ice 100g - 18 Inch', price: 36000, category: 'Hair Extensions' },
    { id: 'ice100_20', name: 'Luxury Ice 100g - 20 Inch', price: 38000, category: 'Hair Extensions' },
    { id: 'ice100_22', name: 'Luxury Ice 100g - 22 Inch', price: 40000, category: 'Hair Extensions' },
    { id: 'ice100_24', name: 'Luxury Ice 100g - 24 Inch', price: 42000, category: 'Hair Extensions' },
    { id: 'ice100_26', name: 'Luxury Ice 100g - 26 Inch', price: 44000, category: 'Hair Extensions' },
    { id: 'ice100_28', name: 'Luxury Ice 100g - 28 Inch', price: 46000, category: 'Hair Extensions' },
    { id: 'ice100_30', name: 'Luxury Ice 100g - 30 Inch', price: 48000, category: 'Hair Extensions' },
    { id: 'ice100_32', name: 'Luxury Ice 100g - 32 Inch', price: 50000, category: 'Hair Extensions' },
    { id: 'ice100_34', name: 'Luxury Ice 100g - 34 Inch', price: 52000, category: 'Hair Extensions' },
    { id: 'ice100_36', name: 'Luxury Ice 100g - 36 Inch', price: 54000, category: 'Hair Extensions' },
    { id: 'ice100_38', name: 'Luxury Ice 100g - 38 Inch', price: 56000, category: 'Hair Extensions' },
    { id: 'ice100_40', name: 'Luxury Ice 100g - 40 Inch', price: 58000, category: 'Hair Extensions' },

    // HAIR EXTENSIONS - REFIX
    { id: 'refix50', name: 'Refix Charges (50g)', price: 5000, category: 'Hair Extensions' },
    { id: 'refix100', name: 'Refix Charges (100g)', price: 10000, category: 'Hair Extensions' },

    // HAIR PATCH
    { id: 'hp1', name: 'Golden Patch', price: 20000, category: 'Hair Patch' },
    { id: 'hp2', name: 'Silk Patch', price: 30000, category: 'Hair Patch' },
    { id: 'hp3', name: 'Mirage Patch', price: 35000, category: 'Hair Patch' },
    { id: 'hp4', name: 'Australian Patch', price: 40000, category: 'Hair Patch' },

    // WIGS
    { id: 'wig1', name: 'New Wig', price: 30000, category: 'Wigs' },
    { id: 'wig2', name: 'Wig Service', price: 1500, category: 'Wigs' },
    { id: 'wig3', name: 'Wig with Colour', price: 2000, category: 'Wigs' }
]
export const CATEGORIES = [
    'Haircut',
    'Hair Treatment',
    'Hair Texture',
    'Hair Color',
    'Styling',
    'Massage',
    'Piercing',
    'D-Tan',
    'Clean Up',
    'Facial',
    'Luxury Facial',
    'Pedicure',
    'Manicure',
    'Nails',
    'Threading',
    'Waxing',
    'Makeup',
    'Package',
    'Hair Patch',
    'Wigs'
]