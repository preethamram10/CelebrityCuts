import React, { useState, useEffect } from 'react'
import '../../theme.css'
import { Service } from './services-data'
import { transactionService } from '../../services/transactionService'
import { staffService, Staff } from '../../services/staffService'
import { Search, ShoppingCart, Trash2, CreditCard, Banknote, Smartphone } from 'lucide-react' // Added Icons
import { db } from '../../lib/firebase'
import { doc, getDoc, getDocs, setDoc, updateDoc, collection } from 'firebase/firestore'
import { customerService, Customer } from '../../services/customerService'
import { authService } from '../../services/authService'

// --- Interfaces ---

interface BillingPageProps { }

interface SelectedServiceItem {
    id: string
    serviceId: string
    name: string
    price: number
    quantity: number
    staffIds: string[]
    staffSplits?: { id: string; name: string; amount: number }[]
    discountAmount: number
    discountPercent: number
    total: number
}

interface SelectedProductItem {
    id: string
    name: string
    amount: number
    discountAmount: number
    discountPercent: number
    total: number
}

// --- Data ---
const HAIR_EXTENSIONS_DATA: Service[] = [
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
    { id: 'ice50_16', name: 'Luxury Ice 50g - 16 Inch', price: 17000, category: 'Hair Extensions' },
    { id: 'ice50_18', name: 'Luxury Ice 50g - 18 Inch', price: 18000, category: 'Hair Extensions' },
    { id: 'ice50_20', name: 'Luxury Ice 50g - 20 Inch', price: 19000, category: 'Hair Extensions' },
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
    { id: 'refix50', name: 'Refix Charges (50g)', price: 5000, category: 'Hair Extensions' },
    { id: 'refix100', name: 'Refix Charges (100g)', price: 10000, category: 'Hair Extensions' },
]

const HairExtensionsPage: React.FC<BillingPageProps> = () => {
    // --- State ---
    const [customerDetails, setCustomerDetails] = useState({ name: '', mobile: '' })
    const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([])
    const [existingCustomers, setExistingCustomers] = useState<Customer[]>([])
    const [isMobileFocused, setIsMobileFocused] = useState(false)
    const [selectedProducts, setSelectedProducts] = useState<SelectedProductItem[]>([]) // New Product State
    const [newProductName, setNewProductName] = useState('')
    const [newProductAmount, setNewProductAmount] = useState('')
    // --- Branch Context ---
    const currentUser = authService.getCurrentUser()
    const initialBranch = (currentUser && currentUser.branchId && currentUser.branchId !== 'all') ? currentUser.branchId : 'branch1'
    const [selectedBranch, setSelectedBranch] = useState<string>(initialBranch)

    const handleBranchChange = async (newBranch: string) => {
        setSelectedBranch(newBranch);
        try {
            const staff = await staffService.getStaffByBranch(newBranch);
            setStaffList(staff.filter(s => s.status !== 'Inactive'));
        } catch (e) {
            console.warn("Error reloading staff for branch", e);
        }
    };

    const [staffList, setStaffList] = useState<Staff[]>([]) // Staff List
    // Refactored Staff Assignment
    const [staffSplits, setStaffSplits] = useState<{ id: string, name: string, amount: number }[]>([])
    const [editingStaffItem, setEditingStaffItem] = useState<string | null>(null)

    // const [showStaffDropdown, setShowStaffDropdown] = useState(false) // Removed
    const [paymentMode, setPaymentMode] = useState<string>('Cash')
    const [isSplitPayment, setIsSplitPayment] = useState(false)
    const [paymentSplits, setPaymentSplits] = useState({ Cash: 0, Card: 0, UPI: 0 })
    const [gstEnabled, setGstEnabled] = useState(false)
    const [gstPercentage, setGstPercentage] = useState(18)
    const [additionalAmount, setAdditionalAmount] = useState<number>(0)
    const [cardTaxPercentage, setCardTaxPercentage] = useState<number>(0)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [serviceSearchFocused, setServiceSearchFocused] = useState(false) // For dropdown
    const [staffSearchTerm, setStaffSearchTerm] = useState('')
    const [availableExtensions, setAvailableExtensions] = useState<any[]>(HAIR_EXTENSIONS_DATA)

    // Load Data
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // 1. Staff
                const staff = await staffService.getStaffByBranch();
                setStaffList(staff.filter(s => s.status !== 'Inactive'));

                // Customers
                const customers = await customerService.getAllCustomers();
                setExistingCustomers(customers);

                // 2. Extensions
                const extSnap = await getDocs(collection(db, 'hair_extensions'));
                const dbExtensions = extSnap.docs.map(d => ({ id: d.id, ...d.data() }));

                if (!dbExtensions || dbExtensions.length === 0) {
                    console.warn("No extensions found in DB, using default hardcoded list.");
                } else {
                    setAvailableExtensions(dbExtensions);
                }
            } catch (e) {
                console.error("Failed to load data", e)
            } finally {
                setLoading(false)
            }


        }
        load()
    }, [])

    // --- Staff Split Helpers ---
    const handleStaffToggle = (staffId: string, staffName: string) => {
        const exists = staffSplits.find(s => s.id === staffId);
        let newSplits = [];
        const totalAmount = selectedServices.find(s => s.id === editingStaffItem)?.total || 0;

        if (exists) {
            newSplits = staffSplits.filter(s => s.id !== staffId);
        } else {
            if (staffSplits.length >= 5) return;
            newSplits = [...staffSplits, { id: staffId, name: staffName, amount: 0 }];
        }

        // Auto Equalize based on Amount
        const count = newSplits.length;
        if (count > 0) {
            const splitAmt = Math.floor(totalAmount / count);
            const remainder = totalAmount % count;
            newSplits = newSplits.map((s, idx) => ({
                ...s,
                amount: idx === 0 ? splitAmt + remainder : splitAmt
            }));
        }
        setStaffSplits(newSplits);
    }

    const handleSplitChange = (id: string, newAmt: number) => {
        const totalAmount = selectedServices.find(s => s.id === editingStaffItem)?.total || 0;

        if (isNaN(newAmt)) newAmt = 0;
        if (newAmt < 0) newAmt = 0;
        if (newAmt > totalAmount) newAmt = totalAmount;

        setStaffSplits(prev => {
            const target = prev.find(s => s.id === id);
            if (!target) return prev;

            // If only one staff, force 100% of amount
            if (prev.length === 1) {
                return [{ ...target, amount: totalAmount }];
            }

            const remaining = totalAmount - newAmt;
            const others = prev.filter(s => s.id !== id);
            const currentOtherSum = others.reduce((sum, s) => sum + s.amount, 0);

            let newSplits = prev.map(s => {
                if (s.id === id) return { ...s, amount: newAmt };

                let newOtherAmt = 0;
                if (currentOtherSum === 0) {
                    newOtherAmt = remaining / others.length;
                } else {
                    newOtherAmt = (s.amount / currentOtherSum) * remaining;
                }
                return { ...s, amount: newOtherAmt };
            });

            newSplits = newSplits.map(s => ({ ...s, amount: Math.floor(s.amount) }));

            const currentTotal = newSplits.reduce((sum, s) => sum + s.amount, 0);
            let diff = totalAmount - currentTotal;

            if (diff !== 0) {
                const firstOtherIndex = newSplits.findIndex(s => s.id !== id);
                if (firstOtherIndex !== -1) {
                    newSplits[firstOtherIndex].amount += diff;
                }
            }

            return newSplits;
        });
    }

    const openStaffModal = (item: SelectedServiceItem) => {
        setEditingStaffItem(item.id);
        if (item.staffSplits && item.staffSplits.length > 0) {
            const splitsWithAmounts = item.staffSplits.map(s => {
                if ('percentage' in s) {
                    // @ts-ignore
                    return { id: s.id, name: s.name, amount: Math.floor(item.total * (s.percentage / 100)) }
                }
                // @ts-ignore
                return s;
            });
            setStaffSplits(splitsWithAmounts as any);
        } else if (item.staffIds.length > 0) {
            const totalAmount = item.total;
            const count = item.staffIds.length;
            const splitAmt = Math.floor(totalAmount / count);
            const remainder = totalAmount % count;
            const reconstructed = item.staffIds.map((id, idx) => {
                const st = staffList.find(s => s.id === id);
                return {
                    id,
                    name: st ? st.name : 'Unknown',
                    amount: idx === 0 ? splitAmt + remainder : splitAmt
                };
            });
            setStaffSplits(reconstructed);
        } else {
            setStaffSplits([]);
        }
    }

    const handleSaveStaff = () => {
        if (!editingStaffItem) return;
        const updatedServices = selectedServices.map(s => {
            if (s.id === editingStaffItem) {
                return {
                    ...s,
                    staffIds: staffSplits.map(sp => sp.id),
                    staffSplits: staffSplits
                };
            }
            return s;
        });
        setSelectedServices(updatedServices);
        setEditingStaffItem(null);
    }

    const handleAddService = (serviceIn: Service) => {
        const newItem: SelectedServiceItem = {
            id: Date.now().toString(),
            serviceId: serviceIn.id,
            name: serviceIn.name,
            price: serviceIn.price,
            quantity: 1,
            staffIds: [], // Empty default
            staffSplits: [],
            discountAmount: 0,
            discountPercent: 0,
            total: serviceIn.price
        }
        setSelectedServices(prev => [...prev, newItem])
        setSearchTerm('')
    }

    const handleRemoveService = (id: string) => {
        setSelectedServices(selectedServices.filter(item => item.id !== id))
    }

    const handleAddProduct = () => {
        if (!newProductName || !newProductAmount) return
        const amount = parseFloat(newProductAmount)
        if (isNaN(amount) || amount <= 0) return

        setSelectedProducts([...selectedProducts, {
            id: Date.now().toString(),
            name: newProductName,
            amount: amount,
            discountAmount: 0,
            discountPercent: 0,
            total: amount
        }])
        setNewProductName('')
        setNewProductAmount('')
    }

    const handleRemoveProduct = (id: string) => {
        setSelectedProducts(selectedProducts.filter(item => item.id !== id))
    }

    // ... (Discount logic same as before)
    const handleItemDiscountChange = (id: string, type: 'amt' | 'pct', valueStr: string) => {
        if (valueStr === '') {
            setSelectedServices(prev => prev.map(item => {
                if (item.id !== id) return item
                return { ...item, discountAmount: 0, discountPercent: 0, total: item.price * item.quantity } as SelectedServiceItem
            }))
            return
        }

        const value = parseFloat(valueStr)
        if (isNaN(value) || value < 0) return

        setSelectedServices(prev => prev.map(item => {
            if (item.id !== id) return item

            const baseTotal = item.price * item.quantity
            let newAmt = item.discountAmount
            let newPct = item.discountPercent

            if (type === 'amt') {
                newAmt = value
                if (newAmt > baseTotal) newAmt = baseTotal
                newPct = baseTotal > 0 ? (newAmt / baseTotal) * 100 : 0
            } else {
                newPct = value
                if (newPct > 100) newPct = 100
                newAmt = baseTotal * (newPct / 100)
            }

            return {
                ...item,
                discountAmount: parseFloat(newAmt.toFixed(2)),
                discountPercent: parseFloat(newPct.toFixed(2)),
                total: baseTotal - newAmt
            } as SelectedServiceItem
        }))
    }

    const handleProductDiscountChange = (id: string, type: 'amt' | 'pct', valueStr: string) => {
        if (valueStr === '') {
            setSelectedProducts(prev => prev.map(item => {
                if (item.id !== id) return item
                return { ...item, discountAmount: 0, discountPercent: 0, total: item.amount }
            }))
            return
        }

        const value = parseFloat(valueStr)
        if (isNaN(value) || value < 0) return

        setSelectedProducts(prev => prev.map(item => {
            if (item.id !== id) return item

            const baseTotal = item.amount
            let newAmt = item.discountAmount
            let newPct = item.discountPercent

            if (type === 'amt') {
                newAmt = value
                if (newAmt > baseTotal) newAmt = baseTotal
                newPct = baseTotal > 0 ? (newAmt / baseTotal) * 100 : 0
            } else {
                newPct = value
                if (newPct > 100) newPct = 100
                newAmt = baseTotal * (newPct / 100)
            }

            return {
                ...item,
                discountAmount: parseFloat(newAmt.toFixed(2)),
                discountPercent: parseFloat(newPct.toFixed(2)),
                total: baseTotal - newAmt
            }
        }))
    }

    const calculateTotals = () => {
        const serviceTotal = selectedServices.reduce((sum, item) => sum + item.total, 0)
        const productTotal = selectedProducts.reduce((sum, item) => sum + item.total, 0)
        const subTotal = serviceTotal + productTotal + additionalAmount
        const gstAmount = gstEnabled ? subTotal * (gstPercentage / 100) : 0
        const preCardTotal = subTotal + gstAmount
        
        const cardTaxAmount = !isSplitPayment 
            ? (paymentMode === 'Card' ? preCardTotal * (cardTaxPercentage / 100) : 0)
            : (paymentSplits.Card > 0 && cardTaxPercentage > 0 
                ? paymentSplits.Card * (cardTaxPercentage / (100 + cardTaxPercentage)) 
                : 0);
        
        const grandTotal = preCardTotal + cardTaxAmount
        return { serviceTotal, productTotal, subTotal, gstAmount, cardTaxAmount, grandTotal }
    }

    const handleCheckout = async () => {
        if (!customerDetails.mobile || !customerDetails.name) {
            alert("Please enter customer name and mobile number.")
            return
        }
        if (selectedServices.length === 0) {
            alert("Please select at least one item.")
            return
        }
        try {
            setLoading(true)
            const { grandTotal, cardTaxAmount } = calculateTotals()
            const now = new Date();
            const targetBranch = (currentUser && currentUser.branchId && currentUser.branchId !== 'all')
                ? currentUser.branchId
                : selectedBranch;

            const checkoutTimestamp = Date.now();
            const invoiceNo = `INV${checkoutTimestamp}_${targetBranch}`

            // Check Payment Splits
            let finalPaymentString = paymentMode;
            if (isSplitPayment) {
                const totalSplit = (paymentSplits.Cash || 0) + (paymentSplits.Card || 0) + (paymentSplits.UPI || 0);
                if (Math.abs(totalSplit - grandTotal) > 0.1) {
                    alert(`Split payment total (₹${totalSplit}) does not match final amount (₹${grandTotal}).`);
                    setLoading(false);
                    return;
                }
                const splitsStr = [];
                if (paymentSplits.Cash > 0) splitsStr.push(`Cash: ₹${paymentSplits.Cash}`);
                if (paymentSplits.Card > 0) splitsStr.push(`Card: ₹${paymentSplits.Card}`);
                if (paymentSplits.UPI > 0) splitsStr.push(`UPI: ₹${paymentSplits.UPI}`);
                finalPaymentString = splitsStr.join(', ');
            }

            const extraItems = [];
            if (additionalAmount > 0) {
                extraItems.push({ name: 'Additional Charge', price: additionalAmount, quantity: 1, total: additionalAmount, category: 'Extra' });
            }
            if (gstAmount > 0) {
                extraItems.push({ name: `GST (${gstPercentage}%)`, price: gstAmount, quantity: 1, total: gstAmount, category: 'Tax' });
            }
            if (cardTaxAmount > 0) {
                extraItems.push({ name: `Card Surcharge (${cardTaxPercentage}%)`, price: cardTaxAmount, quantity: 1, total: cardTaxAmount, category: 'Tax' });
            }

            const itemsForDb = [
                ...selectedServices.map(s => ({
                    name: s.name,
                    price: s.price,
                    quantity: s.quantity,
                    total: s.total,
                    discount: s.discountAmount,
                    staffIds: s.staffIds || [],
                    staffSplits: s.staffSplits || [],
                    category: 'Hair Extensions'
                })),
                ...selectedProducts.map(p => ({
                    name: p.name,
                    price: p.amount,
                    quantity: 1,
                    total: p.total,
                    discount: p.discountAmount,
                    category: 'Product'
                })),
                ...extraItems.map(e => ({
                    name: e.name,
                    price: e.price,
                    quantity: e.quantity,
                    total: e.total,
                    discount: 0,
                    staffIds: [],
                    category: e.category
                }))
            ]

            const newInvoice: any = {
                id: invoiceNo,
                invoice_no: invoiceNo,
                customer_name: customerDetails.name,
                customer_phone: customerDetails.mobile,
                items: itemsForDb,
                total_amount: grandTotal,
                payment_mode: finalPaymentString,
                created_at: now.toISOString()
            };

            try {
                await setDoc(doc(db, 'invoices', invoiceNo), { ...newInvoice, branch_id: targetBranch });
            } catch (invError: any) {
                console.error("Firestore Invoice insert error:", invError);
                throw new Error("DB Insert Failed: " + invError.message)
            }

            await customerService.processCheckout(
                customerDetails.mobile,
                customerDetails.name,
                grandTotal
            )

            const transactionItems = [
                ...selectedServices.map(s => ({
                    type: 'hair_extension' as const,
                    name: s.name,
                    amount: s.total,
                    staffIds: s.staffIds,
                    staffSplits: s.staffSplits
                })),
                ...selectedProducts.map(p => ({
                    type: 'product',
                    name: p.name,
                    amount: p.total
                })),
                ...extraItems.filter(e => !e.name.includes('Surcharge')).map(e => ({
                    type: 'extra',
                    name: e.name,
                    amount: e.price
                }))
            ]

            const yExt = now.getFullYear();
            const mExt = String(now.getMonth() + 1).padStart(2, '0');
            const dExt = String(now.getDate()).padStart(2, '0');
            const localExtDateStr = `${yExt}-${mExt}-${dExt}`;

            await transactionService.addTransaction({
                id: `tx_${checkoutTimestamp}_${targetBranch}`,
                date: localExtDateStr,
                time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                amount: grandTotal - cardTaxAmount, // Exclude surcharge from revenue stats
                customerId: customerDetails.mobile,
                customerName: customerDetails.name,
                paymentMethod: finalPaymentString as any,
                branchId: targetBranch,
                items: transactionItems as any
            })

            // --- REDUCE INVENTORY STOCK ---
            try {
                for (const item of selectedServices) {
                    if (item.id) {
                        const extDocRef = doc(db, 'hair_extensions', item.id);
                        const extDocSnap = await getDoc(extDocRef);

                        if (extDocSnap.exists()) {
                            const currentStock = extDocSnap.data().stock;
                            if (typeof currentStock === 'number') {
                                const newStock = Math.max(0, currentStock - item.quantity);
                                await updateDoc(extDocRef, { stock: newStock });
                            }
                        }
                    }
                }
            } catch (stockErr) {
                console.error("Failed to update inventory stock", stockErr);
            }

            const downloadLink = `${window.location.origin}/#/invoice/${invoiceNo}`;

            const message = `Hello ${customerDetails.name},
 
Thank you for choosing Celebrity Cuts Hair Extensions!
 
Invoice Number: ${invoiceNo}
Total Amount: Rs. ${grandTotal.toFixed(2)}
 
You can download your invoice from the link below:
 
${downloadLink}
 
We'd love to hear your feedback!
 
Follow us on Instagram:
https://www.instagram.com/celebritycutsinsta
 
Thank you,
Celebrity Cuts`

            const cleanPhone = (customerDetails.mobile || '').replace(/\D/g, '');
            const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
            const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`

            alert(`Checkout Successful! Total: ₹${grandTotal.toFixed(2)}\nRedirecting to WhatsApp...`)

            setSelectedServices([])
            setSelectedProducts([]) // Clear products
            setCustomerDetails({ name: '', mobile: '' })
            setPaymentMode('Cash')
            setIsSplitPayment(false)
            setPaymentSplits({ Cash: 0, Card: 0, UPI: 0 })
            setGstEnabled(false)
            setGstPercentage(18)
            setAdditionalAmount(0)
            setCardTaxPercentage(0)


            window.open(waLink, '_blank')

        } catch (error: any) {
            console.error(error)
            alert("Checkout failed: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredItems = availableExtensions.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const searchDropdownServices = searchTerm ? filteredItems : []

    // --- Theme Styles ---
    const theme = {
        bg: '#000000',
        cardBg: '#0a0a0a',
        border: 'rgba(255, 255, 255, 0.08)',
        gold: '#D4AF37',
        goldGradient: 'linear-gradient(135deg, #D4AF37 0%, #FUD762 50%, #AA8C2C 100%)',
        goldGlow: '0 0 20px rgba(212, 175, 55, 0.15)',
        text: '#ffffff',
        textMuted: '#666666',
        inputBg: '#121212',
    }

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#D4AF37', fontSize: '20px', letterSpacing: '2px' }}>
            LOADING EXTENSIONS BOUTIQUE...
        </div>
    )

    const now = new Date()
    const dateStr = now.toLocaleDateString('en-GB')
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const { serviceTotal, gstAmount, cardTaxAmount, grandTotal } = calculateTotals()

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#000', color: '#fff', fontFamily: "'Inter', sans-serif" }}>

            {/* --- LEFT PANEL --- */}
            <div className="hide-scrollbar"
                style={{
                    flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'relative',
                    background: 'radial-gradient(circle at 50% 10%, #1a1a1a 0%, #000000 100%)'
                }}>

                {/* TOP BAR (Sticky) */}
                <div style={{
                    height: '70px', minHeight: '70px', borderBottom: `1px solid ${theme.border}`,
                    display: 'flex', alignItems: 'center', padding: '0 30px',
                    background: 'rgba(5, 5, 5, 0.95)', backdropFilter: 'blur(20px)',
                    position: 'sticky', top: 0, zIndex: 100, width: '100%', boxSizing: 'border-box'
                }}>
                    <div style={{
                        flex: 1, maxWidth: '650px', height: '42px', background: theme.inputBg,
                        border: `1px solid ${theme.border}`, borderRadius: '12px', display: 'flex', alignItems: 'center',
                        padding: '0 16px', transition: 'all 0.3s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ color: '#555', display: 'flex' }}><Search size={18} /></div>
                        <input
                            placeholder="Search Customer by Name"
                            value={customerDetails.name}
                            onChange={e => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                            style={{ background: 'transparent', border: 'none', color: '#fff', flex: 1, outline: 'none', marginLeft: '12px', fontSize: '15px' }}
                        />
                        <div style={{ position: 'relative', textAlign: 'right', borderLeft: '1px solid #333', paddingLeft: '12px', marginLeft: '12px', height: '24px', display: 'flex', alignItems: 'center' }}>
                            <input
                                placeholder="Mobile No."
                                value={customerDetails.mobile}
                                onChange={e => setCustomerDetails({ ...customerDetails, mobile: e.target.value })}
                                onFocus={() => setIsMobileFocused(true)}
                                onBlur={() => setTimeout(() => setIsMobileFocused(false), 200)}
                                style={{ background: 'transparent', border: 'none', color: theme.gold, width: '100px', outline: 'none', textAlign: 'right', fontSize: '15px', fontWeight: 500 }}
                            />
                            {isMobileFocused && customerDetails.mobile.length >= 3 && (
                                (() => {
                                    const filtered = existingCustomers.filter(c => 
                                        c.phoneNumber && c.phoneNumber.includes(customerDetails.mobile)
                                    ).slice(0, 5);
                                    
                                    if (filtered.length === 0) return null;

                                    return (
                                        <div style={{
                                            position: 'absolute',
                                            top: '32px',
                                            right: 0,
                                            width: '280px',
                                            background: '#0a0a0a',
                                            border: '1px solid #333',
                                            borderRadius: '8px',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                            zIndex: 200,
                                            maxHeight: '200px',
                                            overflowY: 'auto',
                                            textAlign: 'left'
                                        }}>
                                            {filtered.map(cust => (
                                                <div
                                                    key={cust.id}
                                                    onClick={() => {
                                                        setCustomerDetails({
                                                            name: `${cust.firstName} ${cust.lastName}`.trim(),
                                                            mobile: cust.phoneNumber
                                                        });
                                                        setIsMobileFocused(false);
                                                    }}
                                                    style={{
                                                        padding: '10px 15px',
                                                        borderBottom: '1px solid #1a1a1a',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '2px'
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#1a1a1a')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                                                        {cust.firstName} {cust.lastName}
                                                    </div>
                                                    <div style={{ color: theme.gold, fontSize: '11px', fontFamily: 'monospace' }}>
                                                        {cust.phoneNumber}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    </div>
                    <div style={{ flex: 1 }}></div>

                    {/* Active Branch Display / Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {currentUser?.role === 'admin' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Branch:</span>
                                <select
                                    value={selectedBranch}
                                    onChange={(e) => handleBranchChange(e.target.value)}
                                    style={{
                                        background: '#141414',
                                        color: '#D4AF37',
                                        border: '1px solid rgba(212, 175, 55, 0.4)',
                                        borderRadius: '8px',
                                        padding: '6px 12px',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="branch1">Branch 1 (Main - Madhuravada)</option>
                                    <option value="branch2">Branch 2 (Vizag Branch)</option>
                                    <option value="branch3">Branch 3 (Vijayawada Branch)</option>
                                    <option value="branch4">Branch 4 (Hyderabad Branch)</option>
                                </select>
                            </div>
                        ) : (
                            <span style={{
                                background: 'rgba(212, 175, 55, 0.12)',
                                color: '#D4AF37',
                                border: '1px solid rgba(212, 175, 55, 0.35)',
                                borderRadius: '8px',
                                padding: '6px 14px',
                                fontWeight: 600,
                                fontSize: '13px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                📍 {currentUser?.branchName || (selectedBranch === 'branch4' ? 'Hyderabad Branch' : (selectedBranch === 'branch2' ? 'Vizag Branch' : (selectedBranch === 'branch3' ? 'Vijayawada Branch' : 'Main Branch')))}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: theme.textMuted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '2px' }}>Current Session</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
                                <span>{dateStr}</span>
                                <span style={{ color: theme.gold, fontSize: '8px', opacity: 0.6 }}>●</span>
                                <span>{timeStr}</span>
                            </div>
                        </div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: theme.goldGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: '800', fontSize: '18px', boxShadow: theme.goldGlow }}>A</div>
                    </div>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '100px' }}>

                    {/* MENU CARD */}
                    <div style={{
                        background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '24px',
                        overflow: 'visible', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column'
                    }}>
                        {/* Header & Search with STAFF ASSIGNMENT */}
                        <div style={{
                            padding: '24px 30px', borderBottom: `1px solid ${theme.border}`,
                            background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), rgba(255,255,255,0))',
                            borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '4px', height: '24px', background: theme.gold, borderRadius: '4px', boxShadow: theme.goldGlow }}></div>
                                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '1px' }}>HAIR EXTENSIONS MENU</h2>
                            </div>

                            {/* Unified Search */}
                            <div style={{ position: 'relative', flex: 1, maxWidth: '400px', height: '44px' }}>
                                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}><Search size={18} /></div>
                                <input
                                    placeholder="Search extensions (Type to see list)..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    onFocus={() => setServiceSearchFocused(true)}
                                    // Delay blur to allow click
                                    onBlur={() => setTimeout(() => setServiceSearchFocused(false), 200)}
                                    style={{
                                        width: '100%', height: '100%', padding: '0 16px 0 44px',
                                        background: '#121212', border: `1px solid ${theme.border}`, borderRadius: '12px',
                                        color: '#fff', fontSize: '14px', outline: 'none'
                                    }}
                                />
                                {/* Dropdown for search recommendations */}
                                {serviceSearchFocused && searchTerm && searchDropdownServices.length > 0 && (
                                    <div className="hide-scrollbar" style={{
                                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                                        background: '#1a1a1a', border: `1px solid ${theme.border}`, borderRadius: '12px',
                                        zIndex: 100, maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
                                    }}>
                                        {searchDropdownServices.map(s => (
                                            <div key={s.id} onClick={() => handleAddService(s)} style={{
                                                padding: '12px 16px', borderBottom: '1px solid #222', cursor: 'pointer', display: 'flex', justifyContent: 'space-between'
                                            }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <span>{s.name}</span>
                                                <span style={{ color: theme.gold }}>₹{s.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>


                        </div>

                        {/* ACTIVE ITEMS LIST (Moved from Right Panel) */}
                        <div style={{ padding: '30px', borderTop: '1px solid #222' }}>
                            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Current Bill</h3>
                                <div style={{ background: '#222', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', color: '#888' }}>{selectedServices.length} Items</div>
                            </div>

                            {selectedServices.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#333', background: '#121212', borderRadius: '12px' }}>
                                    <ShoppingCart size={32} style={{ marginBottom: '12px', opacity: 0.2 }} />
                                    <div style={{ fontSize: '13px' }}>Cart is empty</div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                    {selectedServices.map(item => (
                                        <div key={item.id} style={{
                                            background: '#121212', padding: '16px', borderRadius: '12px', border: '1px solid #222',
                                            display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#eee' }}>{item.name}</div>
                                                <button onClick={() => handleRemoveService(item.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: 0 }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Staff Assignment Trigger */}
                                            <div onClick={() => openStaffModal(item)} style={{ marginTop: '4px', cursor: 'pointer', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {item.staffIds.length > 0 ? item.staffIds.map(sid => (
                                                    <span key={sid} style={{ fontSize: '10px', color: '#ccc', background: '#222', padding: '2px 6px', borderRadius: '4px', border: '1px solid #333' }}>
                                                        {staffList.find(s => s.id === sid)?.name}
                                                    </span>
                                                )) : (
                                                    <span style={{ fontSize: '10px', color: theme.gold, border: `1px dashed ${theme.gold}`, padding: '2px 6px', borderRadius: '4px' }}>
                                                        + Assign Staff
                                                    </span>
                                                )}
                                            </div>

                                            {/* Detailed Grid */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px', alignItems: 'end' }}>
                                                {/* Qty */}
                                                <div>
                                                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 700 }}>QTY</div>
                                                    <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #333', color: '#fff', fontSize: '12px' }}>{item.quantity}</div>
                                                </div>
                                                {/* Price */}
                                                <div>
                                                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 700 }}>PRICE</div>
                                                    <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', borderRadius: '6px', border: '1px solid #333', color: '#ccc', fontSize: '12px' }}>₹{item.price}</div>
                                                </div>
                                                {/* Disc Amt */}
                                                <div>
                                                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 700 }}>- AMT</div>
                                                    <input
                                                        type="number"
                                                        value={item.discountAmount || ''}
                                                        onChange={e => handleItemDiscountChange(item.id, 'amt', e.target.value)}
                                                        placeholder="0"
                                                        style={{ width: '100%', height: '32px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '12px', textAlign: 'center', outline: 'none' }}
                                                    />
                                                </div>
                                                {/* Disc % */}
                                                <div>
                                                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 700 }}>- %</div>
                                                    <input
                                                        type="number"
                                                        value={item.discountPercent || ''}
                                                        onChange={e => handleItemDiscountChange(item.id, 'pct', e.target.value)}
                                                        placeholder="0"
                                                        style={{ width: '100%', height: '32px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '12px', textAlign: 'center', outline: 'none' }}
                                                    />
                                                </div>
                                                {/* Total */}
                                                <div>
                                                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 700 }}>TOTAL</div>
                                                    <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '6px', background: '#1a1a1a', borderRadius: '6px', border: `1px solid ${theme.border}`, color: theme.gold, fontSize: '12px', fontWeight: 700 }}>
                                                        ₹{item.total.toFixed(0)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- CARD 2: EXTRA PRODUCTS --- */}
                    <div style={{
                        marginTop: '20px',
                        background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '24px',
                        padding: '24px 30px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                            <div style={{ width: '4px', height: '24px', background: theme.gold, borderRadius: '4px', boxShadow: theme.goldGlow }}></div>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '1px' }}>EXTRA PRODUCTS / MISC</h2>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                            <input
                                placeholder="Product Name"
                                value={newProductName}
                                onChange={e => setNewProductName(e.target.value)}
                                style={{
                                    flex: 2, height: '44px', padding: '0 16px',
                                    background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '12px',
                                    color: '#fff', fontSize: '14px', outline: 'none'
                                }}
                            />
                            <input
                                type="number"
                                placeholder="Amount (₹)"
                                value={newProductAmount}
                                onChange={e => setNewProductAmount(e.target.value)}
                                style={{
                                    flex: 1, height: '44px', padding: '0 16px',
                                    background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '12px',
                                    color: '#fff', fontSize: '14px', outline: 'none'
                                }}
                            />
                            <button
                                onClick={handleAddProduct}
                                style={{
                                    height: '44px', padding: '0 24px',
                                    background: theme.gold, color: '#000', border: 'none', borderRadius: '12px',
                                    fontWeight: 700, cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px'
                                }}
                            >
                                Add
                            </button>
                        </div>

                        {selectedProducts.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                {selectedProducts.map(p => (
                                    <div key={p.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                                        background: '#121212', borderRadius: '10px', border: '1px solid #333',
                                        flexWrap: 'wrap'
                                    }}>
                                        <div style={{ flex: 1, minWidth: '120px' }}>
                                            <div style={{ fontSize: '13px', color: '#ccc' }}>{p.name}</div>
                                            <div style={{ fontSize: '12px', fontWeight: 600, color: theme.gold }}>₹{p.amount}</div>
                                        </div>

                                        {/* Discount Inputs */}
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', width: '60px' }}>
                                                <span style={{ fontSize: '9px', color: '#555', marginBottom: '2px' }}>Disc ₹</span>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={p.discountAmount || ''}
                                                    onChange={e => handleProductDiscountChange(p.id, 'amt', e.target.value)}
                                                    style={{
                                                        width: '100%', background: '#222', border: '1px solid #444',
                                                        color: '#fff', fontSize: '11px', padding: '4px', borderRadius: '4px', outline: 'none'
                                                    }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', width: '45px' }}>
                                                <span style={{ fontSize: '9px', color: '#555', marginBottom: '2px' }}>Disc %</span>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={p.discountPercent || ''}
                                                    onChange={e => handleProductDiscountChange(p.id, 'pct', e.target.value)}
                                                    style={{
                                                        width: '100%', background: '#222', border: '1px solid #444',
                                                        color: '#fff', fontSize: '11px', padding: '4px', borderRadius: '4px', outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', minWidth: '60px', textAlign: 'right' }}>
                                            ₹{p.total.toFixed(0)}
                                        </div>

                                        <button onClick={() => handleRemoveProduct(p.id)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0 }}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- RIGHT PANEL: CART --- */}
            <div style={{ width: '400px', background: '#080808', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid #222', boxShadow: '-10px 0 40px rgba(0,0,0,0.5)' }}>
                {/* Content moved to Left Panel */}
                {/* Checkout Footer */}
                <div style={{ padding: '20px', background: '#111', borderTop: '1px solid #222' }}>

                    {/* Additional Charges & GST */}
                    <div style={{ marginBottom: '15px', padding: '12px', background: '#080808', borderRadius: '12px', border: '1px solid #222' }}>
                        {/* Additional Charges Input */}
                        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: '#888' }}>Additional Charges</span>
                            <input
                                type="number"
                                placeholder="₹ 0"
                                value={additionalAmount || ''}
                                onChange={e => setAdditionalAmount(parseFloat(e.target.value) || 0)}
                                style={{ width: '80px', padding: '4px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '12px', textAlign: 'right', outline: 'none' }}
                            />
                        </div>

                        {/* GST Section */}
                        <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#888' }}>Enable GST</div>
                                {/* Toggle Switch */}
                                <div
                                    onClick={() => setGstEnabled(!gstEnabled)}
                                    style={{
                                        width: '36px', height: '20px',
                                        background: gstEnabled ? theme.gold : '#333',
                                        borderRadius: '20px', position: 'relative', cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <div style={{
                                        width: '16px', height: '16px', background: '#fff', borderRadius: '50%',
                                        position: 'absolute', top: '2px',
                                        left: gstEnabled ? '18px' : '2px',
                                        transition: 'all 0.3s',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                    }} />
                                </div>
                            </div>
                            {gstEnabled && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#666' }}>Rate %</span>
                                    <input
                                        type="number" placeholder="18"
                                        value={gstPercentage || ''}
                                        onChange={e => setGstPercentage(parseFloat(e.target.value) || 0)}
                                        style={{ width: '50px', padding: '4px', background: '#1a1a1a', border: `1px solid ${theme.border}`, borderRadius: '6px', color: '#fff', fontSize: '12px', textAlign: 'center', outline: 'none' }}
                                    />
                                </div>
                            )}
                        </div>



                        <div style={{ height: '1px', background: '#222', margin: '8px 0' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#888' }}>
                            <span>Service Total</span>
                            <span>₹{serviceTotal.toLocaleString()}</span>
                        </div>
                        {additionalAmount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#aaa' }}>
                                <span>Extras</span>
                                <span>+ ₹{additionalAmount.toLocaleString()}</span>
                            </div>
                        )}
                        {gstEnabled && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#ec4899' }}>
                                <span>GST ({gstPercentage}%)</span>
                                <span>₹{gstAmount.toLocaleString()}</span>
                            </div>
                        )}
                        {cardTaxAmount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#aaa' }}>
                                <span>Card Surcharge ({cardTaxPercentage}%)</span>
                                <span>+ ₹{cardTaxAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#D4AF37', marginTop: '10px' }}>
                            <span>Grand Total</span>
                            <span>₹{grandTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#888', fontWeight: 600 }}>Payment Mode</span>
                        <button
                            onClick={() => {
                                setIsSplitPayment(!isSplitPayment);
                                if (!isSplitPayment) {
                                    setPaymentSplits({ Cash: grandTotal, Card: 0, UPI: 0 });
                                }
                            }}
                            style={{ background: 'none', border: 'none', color: '#D4AF37', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            {isSplitPayment ? 'Single Payment' : 'Split Payment'}
                        </button>
                    </div>

                    {!isSplitPayment ? (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                            {['Cash', 'Card', 'UPI'].map(mode => (
                                <button key={mode} onClick={() => setPaymentMode(mode)}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                                        background: paymentMode === mode ? '#D4AF37' : '#222', color: paymentMode === mode ? '#000' : '#888',
                                        border: 'none', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                    }}
                                >
                                    {mode === 'Cash' && <Banknote size={12} />}
                                    {mode === 'Card' && <CreditCard size={12} />}
                                    {mode === 'UPI' && <Smartphone size={12} />}
                                    {mode}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                            {(['Cash', 'Card', 'UPI'] as const).map(mode => (
                                <div key={mode} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#222', padding: '10px 14px', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13px', fontWeight: 600 }}>
                                        {mode === 'Cash' && <Banknote size={14} color="#D4AF37" />}
                                        {mode === 'Card' && <CreditCard size={14} color="#D4AF37" />}
                                        {mode === 'UPI' && <Smartphone size={14} color="#D4AF37" />}
                                        {mode}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#aaa', fontSize: '13px' }}>₹</span>
                                        <input
                                            type="number"
                                            value={paymentSplits[mode] === 0 ? '' : paymentSplits[mode]}
                                            placeholder="0"
                                            onChange={(e) => {
                                                let val = parseFloat(e.target.value) || 0;
                                                const others = (['Cash', 'Card', 'UPI'] as const).filter(m => m !== mode).reduce((acc, m) => acc + paymentSplits[m], 0);
                                                const maxAllowed = grandTotal - others;
                                                if (val > maxAllowed) val = maxAllowed;
                                                if (val < 0) val = 0;
                                                setPaymentSplits({ ...paymentSplits, [mode]: val });
                                            }}
                                            style={{ width: '80px', background: '#111', color: '#D4AF37', border: `1px solid ${theme.border}`, borderRadius: '6px', padding: '6px', textAlign: 'right', outline: 'none', fontWeight: 'bold' }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {(() => {
                                const currentTotal = paymentSplits.Cash + paymentSplits.Card + paymentSplits.UPI;
                                const isMatch = Math.abs(currentTotal - grandTotal) < 0.1;
                                return (
                                    <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px', color: isMatch ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                        {isMatch ? `Split Total Matches Grand Total (₹${grandTotal})` : `Split Total: ₹${currentTotal} / ₹${grandTotal} (Mismatch)`}
                                    </div>
                                )
                            })()}
                        </div>
                    )}

                    {(isSplitPayment || paymentMode === 'Card') && (
                        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', background: '#222', padding: '10px 12px', borderRadius: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#aaa', fontWeight: 600 }}>Card Extra %:</span>
                            <input
                                type="number" placeholder="e.g. 2"
                                value={cardTaxPercentage || ''}
                                onChange={e => setCardTaxPercentage(parseFloat(e.target.value) || 0)}
                                style={{
                                    flex: 1, height: '32px', padding: '0 10px',
                                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.border}`,
                                    borderRadius: '6px', color: '#fff', outline: 'none', fontSize: '13px'
                                }}
                            />
                            <span style={{ fontSize: '12px', color: '#aaa' }}>%</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{ flex: 1, padding: '14px', background: '#222', border: '1px solid #333', borderRadius: '12px', fontSize: '13px', fontWeight: 600, color: '#ccc', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>Save Draft</button>
                        <button onClick={handleCheckout} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #D4AF37 0%, #F6D762 100%)', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, color: '#000', cursor: 'pointer', boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>CHECKOUT</button>
                    </div>
                </div>
            </div>
            {/* --- STAFF ASSIGNMENT MODAL (Fixed Overlay) --- */}
            {editingStaffItem && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }} onClick={() => setEditingStaffItem(null)}>
                    <div style={{
                        width: '400px', background: '#1a1a1a', border: `1px solid ${theme.border}`, borderRadius: '16px',
                        padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
                        display: 'flex', flexDirection: 'column', gap: '20px'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>Assign Staff & Split</h3>
                                <span style={{ fontSize: '12px', color: '#666' }}>
                                    {selectedServices.find(s => s.id === editingStaffItem)?.name}
                                </span>
                            </div>
                            <button onClick={() => setEditingStaffItem(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                        </div>

                        {/* Active Staff Breakdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {staffSplits.map(split => (
                                <div key={split.id} style={{ background: '#222', padding: '12px', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                                        <span style={{ color: '#fff', fontWeight: 600 }}>{split.name}</span>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ color: '#aaa', fontWeight: 500, fontSize: '13px' }}>₹</span>
                                            <input
                                                type="number"
                                                value={split.amount === 0 ? '' : split.amount}
                                                placeholder="0"
                                                onChange={(e) => handleSplitChange(split.id, parseInt(e.target.value) || 0)}
                                                style={{
                                                    width: '90px', background: '#111', color: theme.gold,
                                                    border: `1px solid ${theme.border}`, borderRadius: '6px',
                                                    padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', outline: 'none'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max={selectedServices.find(s => s.id === editingStaffItem)?.total || 100}
                                        value={split.amount}
                                        onChange={(e) => handleSplitChange(split.id, parseInt(e.target.value))}
                                        style={{ width: '100%', accentColor: theme.gold, cursor: 'pointer', marginTop: '10px' }}
                                    />
                                </div>
                            ))}
                            {staffSplits.length === 0 && <div style={{ color: '#666', fontStyle: 'italic', fontSize: '13px', textAlign: 'center', padding: '20px', border: '1px dashed #333', borderRadius: '8px' }}>No staff assigned. Select from list below.</div>}
                        </div>

                        <div style={{ height: '1px', background: '#333' }}></div>

                        {/* Staff Selection List */}
                        <div style={{ marginBottom: '4px' }}>
                            <input
                                placeholder="Search staff..."
                                value={staffSearchTerm}
                                onChange={e => setStaffSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', padding: '8px 12px', borderRadius: '8px', boxSizing: 'border-box',
                                    background: '#111', border: '1px solid #333', color: '#fff', outline: 'none', fontSize: '13px'
                                }}
                            />
                        </div>
                        <div className="hide-scrollbar" style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {staffList.filter(s => s.name.toLowerCase().includes(staffSearchTerm.toLowerCase())).map(s => {
                                const isSelected = staffSplits.some(split => split.id === s.id);
                                return (
                                    <div key={s.id}
                                        onClick={() => handleStaffToggle(s.id, s.name)}
                                        style={{
                                            padding: '10px 14px', borderRadius: '8px',
                                            background: isSelected ? 'rgba(212, 175, 55, 0.1)' : '#111',
                                            border: isSelected ? `1px solid ${theme.gold}` : '1px solid transparent',
                                            color: isSelected ? theme.gold : '#ccc',
                                            cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px',
                                            transition: 'all 0.2s'
                                        }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.status === 'Active' ? '#10b981' : '#666' }}></div>
                                        <div style={{ flex: 1 }}>{s.name}</div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>{s.role}</div>
                                    </div>
                                )
                            })}
                        </div>

                        <button onClick={handleSaveStaff} style={{
                            padding: '14px', background: theme.gold, color: '#000', border: 'none', borderRadius: '12px',
                            fontWeight: 700, cursor: 'pointer', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px'
                        }}>
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div >
    )
}

export default HairExtensionsPage
