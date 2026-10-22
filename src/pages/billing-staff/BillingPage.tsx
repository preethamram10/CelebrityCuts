import React, { useState, useEffect } from 'react'
import '../../theme.css'
import { Service } from './services-data'
import { customerService, Customer } from '../../services/customerService'
import { transactionService } from '../../services/transactionService'
import { staffService, Staff } from '../../services/staffService'
import { db } from '../../lib/firebase'
import { authService } from '../../services/authService'
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore'
// --- Interfaces ---
interface BillingPageProps { }
interface SelectedServiceItem {
  id: string
  serviceId: string
  name: string
  price: number
  quantity: number
  category?: string
  additionalCharge?: number
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

// --- Icons (Enhanced) ---
const Icons = {
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Trash: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  Calendar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Plus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Scissors: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

const BillingPage: React.FC<BillingPageProps> = () => {
  const currentUser = authService.getCurrentUser()
  const initialBranch = (currentUser && currentUser.branchId && currentUser.branchId !== 'all') ? currentUser.branchId : 'branch1'
  const [selectedBranch, setSelectedBranch] = useState<string>(initialBranch)

  // --- Data State ---
  const [availableServices, setAvailableServices] = useState<Service[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([])
  const [isMobileFocused, setIsMobileFocused] = useState(false)

  const handleBranchChange = async (newBranch: string) => {
    setSelectedBranch(newBranch);
    try {
      const staff = await staffService.getStaffByBranch(newBranch);
      setStaffList(staff.filter(s => s.status !== 'Inactive'));
    } catch (e) {
      console.warn("Error reloading staff for branch", e);
    }
  };

  // --- Bill State ---
  const [customerDetails, setCustomerDetails] = useState({ name: '', mobile: '' })
  const [selectedServices, setSelectedServices] = useState<SelectedServiceItem[]>([])
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductItem[]>([])
  const [paymentMode, setPaymentMode] = useState<string>('Cash')
  const [isSplitPayment, setIsSplitPayment] = useState(false)
  const [paymentSplits, setPaymentSplits] = useState({ Cash: 0, Card: 0, UPI: 0 })

  // --- UI/Input State ---
  const [serviceSearch, setServiceSearch] = useState('')
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('')
  // Service Input State
  const [serviceSearchFocused, setServiceSearchFocused] = useState(false)
  // Replaced simple ID list with Split Objects
  const [staffSplits, setStaffSplits] = useState<{ id: string, name: string, amount: number }[]>([])
  const [editingStaffItem, setEditingStaffItem] = useState<string | null>(null) // New state for modal
  const [currentQty, setCurrentQty] = useState(1)

  // --- Helpers for Staff Splits (Now used for Modal) ---
  const handleStaffToggle = (staffId: string, staffName: string) => {
    const exists = staffSplits.find(s => s.id === staffId);
    let newSplits = [];
    const totalAmount = selectedServices.find(s => s.id === editingStaffItem)?.total || 0;
    if (exists) {
      newSplits = staffSplits.filter(s => s.id !== staffId);
    } else {
      if (staffSplits.length >= 5) return; // Limit 5
      newSplits = [...staffSplits, { id: staffId, name: staffName, amount: 0 }];
    }
    // Auto Equalize based on Amount
    const count = newSplits.length;
    if (count > 0) {
      const splitAmt = Math.floor(totalAmount / count);
      const remainder = totalAmount % count;
      newSplits = newSplits.map((s, idx) => ({
        ...s,
        amount: idx === 0 ? splitAmt + remainder : splitAmt // Give remainder to first
      }));
    }
    setStaffSplits(newSplits);
  }
  // Open Modal for specific item
  const openStaffModal = (item: SelectedServiceItem) => {
    setEditingStaffItem(item.id);
    if (item.staffSplits && item.staffSplits.length > 0) {
      // Map percentages back to amounts if legacy data found during this session
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
      // Reconstruct splits from IDs (exact equal amounts)
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

  // Save changes from Modal
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

  const handleSplitChange = (id: string, newAmt: number) => {
    const totalAmount = selectedServices.find(s => s.id === editingStaffItem)?.total || 0;

    // Ensure value is a number
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
          // If others were 0, distribute equally
          newOtherAmt = remaining / others.length;
        } else {
          // Proportional distribution
          newOtherAmt = (s.amount / currentOtherSum) * remaining;
        }
        return { ...s, amount: newOtherAmt };
      });

      // Rounding and fixing total to exactly match
      newSplits = newSplits.map(s => ({ ...s, amount: Math.floor(s.amount) }));

      const currentTotal = newSplits.reduce((sum, s) => sum + s.amount, 0);
      let diff = totalAmount - currentTotal;

      // Distribute diff to others (add to first other found to close gap)
      if (diff !== 0) {
        const firstOtherIndex = newSplits.findIndex(s => s.id !== id);
        if (firstOtherIndex !== -1) {
          newSplits[firstOtherIndex].amount += diff;
        }
      }

      return newSplits;
    });
  }


  // Product Input State
  const [newProductName, setNewProductName] = useState('')
  const [newProductAmount, setNewProductAmount] = useState('')
  const [newProductDiscountAmount, setNewProductDiscountAmount] = useState(0)
  const [newProductDiscountPercent, setNewProductDiscountPercent] = useState(0)
  const [staffSearchTerm, setStaffSearchTerm] = useState('')
  // Billing Options State
  const [billingOptions, setBillingOptions] = useState({
    gstPercentage: 18, // Default to 18 if enabled, or 0? Let's keep 0 or 18 as default? User said "we can enter", so maybe 0 default.
    gstEnabled: false,
    discountType: 'amt' as 'amt' | 'pct',
    discountValue: 0,
    additionalAmount: 0,
    cardTaxPercentage: 0
  })

  // --- Data Loading ---
  useEffect(() => {
    // Simulate loading delay for effect
    const loadData = async () => {
      const { serviceMenuService } = await import('../../services/serviceMenuService');
      const services = await serviceMenuService.getAllServices();
      const staff = await staffService.getStaffByBranch();
      const customers = await customerService.getAllCustomers();
      setAvailableServices(services);
      setStaffList(staff.filter(s => s.status !== 'Inactive'));
      setExistingCustomers(customers);
      setLoading(false);
    };

    setTimeout(() => {
      loadData();
    }, 500);

    // Subscribe to live staff changes
    const unsubscribe = onSnapshot(collection(db, 'staff'), () => {
      staffService.getStaffByBranch().then(staff => setStaffList(staff.filter(s => s.status !== 'Inactive')))
    }, (err) => console.warn('Staff snapshot error:', err));

    return () => {
      unsubscribe();
    }
  }, [])

  // --- Handlers ---
  const handleAddService = (serviceIn: Service) => {
    const newItem: SelectedServiceItem = {
      id: Date.now().toString(),
      serviceId: serviceIn.id,
      name: serviceIn.name,
      price: serviceIn.price,
      quantity: currentQty,
      additionalCharge: 0,
      staffIds: [], // Start with NO staff
      staffSplits: [],  // Add splits to item
      category: serviceIn.category || 'Service',
      discountAmount: 0,
      discountPercent: 0,
      total: serviceIn.price * currentQty
    }

    setSelectedServices(prev => [...prev, newItem])
    // Reset inputs for next entry
    setServiceSearch('')
    setServiceSearchFocused(false)
    // Keep staff/qty for potentially adding more items with same settings?
    // Resetting Qty for safety
    setCurrentQty(1)
    // We keep staff selection active for next item as per typical workflow
    // setStaffSplits([]) // Uncomment if we want to reset staff
  }

  const handleRemoveService = (id: string) => {
    setSelectedServices(selectedServices.filter(item => item.id !== id))
  }

  // Old handleStaffToggle removed


  const handleAddProduct = () => {
    if (!newProductName || !newProductAmount) return
    const amount = parseFloat(newProductAmount)
    if (isNaN(amount) || amount <= 0) return

    const total = amount - newProductDiscountAmount

    setSelectedProducts([...selectedProducts, {
      id: Date.now().toString(),
      name: newProductName,
      amount: amount,
      discountAmount: newProductDiscountAmount,
      discountPercent: newProductDiscountPercent,
      total: total > 0 ? total : 0
    }])
    setNewProductName('')
    setNewProductAmount('')
    setNewProductDiscountAmount(0)
    setNewProductDiscountPercent(0)
  }

  const handleNewProductDiscountChange = (type: 'amt' | 'pct', valueStr: string) => {
    if (valueStr === '') {
      setNewProductDiscountAmount(0)
      setNewProductDiscountPercent(0)
      return
    }

    const value = parseFloat(valueStr)
    if (isNaN(value) || value < 0) return

    const baseAmount = parseFloat(newProductAmount) || 0

    let newAmt = newProductDiscountAmount
    let newPct = newProductDiscountPercent

    if (type === 'amt') {
      newAmt = value
      if (newAmt > baseAmount) newAmt = baseAmount
      newPct = baseAmount > 0 ? (newAmt / baseAmount) * 100 : 0
    } else {
      newPct = value
      if (newPct > 100) newPct = 100
      newAmt = baseAmount * (newPct / 100)
    }

    setNewProductDiscountAmount(parseFloat(newAmt.toFixed(2)))
    setNewProductDiscountPercent(parseFloat(newPct.toFixed(2)))
  }

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter(item => item.id !== id))
  }

  const handleItemDiscountChange = (id: string, type: 'amt' | 'pct', valueStr: string) => {
    // Allow empty string for clearing input
    if (valueStr === '') {
      setSelectedServices(prev => prev.map(item => {
        if (item.id !== id) return item
        const addCharge = item.additionalCharge || 0
        const baseGross = (item.price * item.quantity) + addCharge
        return { ...item, discountAmount: 0, discountPercent: 0, total: baseGross }
      }))
      return
    }

    const value = parseFloat(valueStr)
    if (isNaN(value) || value < 0) return

    setSelectedServices(prev => prev.map(item => {
      if (item.id !== id) return item

      const addCharge = item.additionalCharge || 0
      const baseGross = (item.price * item.quantity) + addCharge
      let newAmt = item.discountAmount
      let newPct = item.discountPercent

      if (type === 'amt') {
        newAmt = value
        if (newAmt > baseGross) newAmt = baseGross
        newPct = baseGross > 0 ? (newAmt / baseGross) * 100 : 0
      } else {
        newPct = value
        if (newPct > 100) newPct = 100
        newAmt = baseGross * (newPct / 100)
      }

      return {
        ...item,
        discountAmount: parseFloat(newAmt.toFixed(2)),
        discountPercent: parseFloat(newPct.toFixed(2)),
        total: parseFloat((baseGross - newAmt).toFixed(2))
      }
    }))
  }

  const handleItemQuantityChange = (id: string, newQtyVal: string | number) => {
    let qty = typeof newQtyVal === 'string' ? parseInt(newQtyVal, 10) : newQtyVal;
    if (isNaN(qty) || qty < 1) qty = 1;

    setSelectedServices(prev => prev.map(item => {
      if (item.id !== id) return item;
      const addCharge = item.additionalCharge || 0;
      const baseGross = (item.price * qty) + addCharge;
      let newAmt = item.discountAmount || 0;
      let newPct = item.discountPercent || 0;

      if (newPct > 0) {
        newAmt = baseGross * (newPct / 100);
      } else if (newAmt > baseGross) {
        newAmt = baseGross;
      }

      const finalTotal = baseGross - newAmt > 0 ? baseGross - newAmt : 0;
      return {
        ...item,
        quantity: qty,
        discountAmount: parseFloat(newAmt.toFixed(2)),
        discountPercent: parseFloat(newPct.toFixed(2)),
        total: parseFloat(finalTotal.toFixed(2))
      };
    }));
  };

  const handleItemAdditionalChargeChange = (id: string, valueStr: string) => {
    const addCharge = parseFloat(valueStr) || 0;

    setSelectedServices(prev => prev.map(item => {
      if (item.id !== id) return item;
      const baseGross = (item.price * item.quantity) + addCharge;
      let newAmt = item.discountAmount || 0;
      let newPct = item.discountPercent || 0;

      if (newPct > 0) {
        newAmt = baseGross * (newPct / 100);
      } else if (newAmt > baseGross) {
        newAmt = baseGross;
      }

      const finalTotal = baseGross - newAmt > 0 ? baseGross - newAmt : 0;
      return {
        ...item,
        additionalCharge: addCharge,
        discountAmount: parseFloat(newAmt.toFixed(2)),
        discountPercent: parseFloat(newPct.toFixed(2)),
        total: parseFloat(finalTotal.toFixed(2))
      };
    }));
  };
  const handleProductDiscountChange = (id: string, type: 'amt' | 'pct', valueStr: string) => {
    // Allow empty string for clearing input
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
        // Cap at baseTotal
        if (newAmt > baseTotal) newAmt = baseTotal
        newPct = baseTotal > 0 ? (newAmt / baseTotal) * 100 : 0
      } else {
        newPct = value
        // Cap at 100%
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

  // --- Calculations ---
  const servicesTotal = selectedServices.reduce((sum, item) => sum + item.total, 0)
  const productsTotal = selectedProducts.reduce((sum, item) => sum + item.total, 0)
  const subTotal = servicesTotal + productsTotal

  let discountAmt = 0
  if (billingOptions.discountType === 'amt') {
    discountAmt = billingOptions.discountValue
  } else {
    discountAmt = subTotal * (billingOptions.discountValue / 100)
  }

  const taxableAmount = Math.max(0, subTotal - discountAmt)

  // Calculate GST only if enabled
  const gstAmount = billingOptions.gstEnabled
    ? taxableAmount * (billingOptions.gstPercentage / 100)
    : 0

  const preCardTotal = taxableAmount + gstAmount + billingOptions.additionalAmount
  
  const cardTaxAmount = !isSplitPayment 
    ? (paymentMode === 'Card' ? preCardTotal * (billingOptions.cardTaxPercentage / 100) : 0)
    : (paymentSplits.Card > 0 && billingOptions.cardTaxPercentage > 0 
        ? paymentSplits.Card * (billingOptions.cardTaxPercentage / (100 + billingOptions.cardTaxPercentage)) 
        : 0);

  const finalTotal = preCardTotal + cardTaxAmount

  // Date Helpers
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB')
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // --- Theme Styles ---
  const theme = {
    bg: '#000000', // Pitch black main bg
    cardBg: '#0a0a0a', // Slightly lighter for cards
    border: 'rgba(255, 255, 255, 0.08)', // Very subtle border
    gold: '#D4AF37', // Metallic gold
    goldGradient: 'linear-gradient(135deg, #D4AF37 0%, #FUD762 50%, #AA8C2C 100%)',
    goldGlow: '0 0 20px rgba(212, 175, 55, 0.15)',
    text: '#ffffff',
    textMuted: '#666666',
    inputBg: '#121212',
    glass: 'rgba(20, 20, 20, 0.7)'
  }

  if (loading) return <div style={{ color: '#fff', padding: 40, background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading System...</div>

  // Filter Logic
  const uniqueCategories = Array.from(new Set(availableServices.map(s => s.category))).sort();

  const searchDropdownServices = availableServices.filter(s => {
    // Show if there is a search term OR a category filter selected, and it matches both
    const matchesSearch = !serviceSearch || s.name.toLowerCase().includes(serviceSearch.toLowerCase());
    const matchesCategory = !serviceCategoryFilter || s.category === serviceCategoryFilter;
    
    // Only return if at least one filter is active, and the active ones match
    return (serviceSearch || serviceCategoryFilter) && matchesSearch && matchesCategory;
  })

  const handleCheckout = async () => {
    if (!customerDetails.mobile) {
      alert("Please enter a customer mobile number to checkout.")
      return
    }

    try {
      setLoading(true)
      console.log("Starting Checkout...");

      const user = authService.getCurrentUser();
      const targetBranch = (user && user.role !== 'admin' && user.branchId && user.branchId !== 'all')
        ? user.branchId
        : selectedBranch;

      // 1. Generate Invoice No (Embedding Branch ID for retrieval)
      const checkoutTimestamp = Date.now();
      const invoiceNo = `INV${checkoutTimestamp}_${targetBranch}`;

      // Check Payment Splits
      let finalPaymentString = paymentMode;
      if (isSplitPayment) {
        const totalSplit = (paymentSplits.Cash || 0) + (paymentSplits.Card || 0) + (paymentSplits.UPI || 0);
        if (Math.abs(totalSplit - finalTotal) > 0.1) {
          alert(`Split payment total (₹${totalSplit}) does not match final amount (₹${finalTotal}).`);
          setLoading(false);
          return;
        }
        const splitsStr = [];
        if (paymentSplits.Cash > 0) splitsStr.push(`Cash: ₹${paymentSplits.Cash}`);
        if (paymentSplits.Card > 0) splitsStr.push(`Card: ₹${paymentSplits.Card}`);
        if (paymentSplits.UPI > 0) splitsStr.push(`UPI: ₹${paymentSplits.UPI}`);
        finalPaymentString = splitsStr.join(', ');
      }

      // 3. Save to Invoices Table
      console.log("Step 3: Saving to DB...");

      const extraItems = [];
      if (billingOptions.additionalAmount > 0) {
        extraItems.push({ type: 'extra' as const, name: 'Additional Charge', price: billingOptions.additionalAmount, quantity: 1, total: billingOptions.additionalAmount, amount: billingOptions.additionalAmount, category: 'Extra' });
      }
      if (gstAmount > 0) {
        extraItems.push({ type: 'extra' as const, name: `GST (${billingOptions.gstPercentage}%)`, price: gstAmount, quantity: 1, total: gstAmount, amount: gstAmount, category: 'Tax' });
      }
      if (cardTaxAmount > 0) {
        extraItems.push({ type: 'extra' as const, name: `Card Surcharge (${billingOptions.cardTaxPercentage}%)`, price: cardTaxAmount, quantity: 1, total: cardTaxAmount, amount: cardTaxAmount, category: 'Tax' });
      }

      const itemsForDb = [
        ...selectedServices.map(s => ({
          name: s.name,
          price: s.price,
          quantity: s.quantity,
          total: s.total,
          category: s.category || 'Service',
          staffIds: s.staffIds || [],
          staffSplits: s.staffSplits || [],
          additionalCharge: s.additionalCharge || 0,
          discountAmount: s.discountAmount || 0,
          discountPercent: s.discountPercent || 0
        })),
        ...selectedProducts.map(p => ({
          name: p.name,
          price: p.amount,
          quantity: 1,
          total: p.amount,
          category: 'Product'
        })),
        ...extraItems.map(e => ({
          name: e.name,
          price: e.price,
          quantity: e.quantity,
          total: e.total,
          category: e.category
        }))
      ]

      const newInvoice: any = {
        id: invoiceNo, // adding id satisfying localDb
        invoice_no: invoiceNo,
        customer_name: customerDetails.name,
        customer_phone: customerDetails.mobile,
        items: itemsForDb,
        total_amount: finalTotal,
        payment_mode: finalPaymentString,
        created_at: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'invoices', invoiceNo), { ...newInvoice, branch_id: targetBranch });
      } catch (invError: any) {
        console.error("Firestore Invoice insert error:", invError);
        throw new Error("DB Insert Failed: " + invError.message)
      }
      console.log("Step 3: Saved to DB");

      // 4. Call service to update/create customer record
      await customerService.processCheckout(
        customerDetails.mobile,
        customerDetails.name,
        finalTotal
      )

      // 5. Log Transaction for Revenue Reports
      const now = new Date();
      const transactionItems = [
        ...selectedServices.map(s => ({
          type: 'service' as const,
          name: s.name,
          amount: s.total,
          staffIds: s.staffIds,
          staffSplits: s.staffSplits // Now accurately passes exact {id, name, amount} objects
        })),
        ...selectedProducts.map(p => ({
          type: 'product' as const,
          name: p.name,
          amount: p.amount
        })),
        ...extraItems.filter(e => !e.name.includes('Surcharge')).map(e => ({
          type: e.type,
          name: e.name,
          amount: e.amount
        }))
      ];

      const yStr = now.getFullYear();
      const mStr = String(now.getMonth() + 1).padStart(2, '0');
      const dStr = String(now.getDate()).padStart(2, '0');
      const localDateStr = `${yStr}-${mStr}-${dStr}`;

      await transactionService.addTransaction({
        id: `tx_${checkoutTimestamp}_${targetBranch}`,
        branchId: targetBranch,
        date: localDateStr,
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        amount: finalTotal - cardTaxAmount, // Exclude surcharge from revenue stats
        customerId: customerDetails.mobile,
        customerName: customerDetails.name,
        items: transactionItems as any,
        paymentMethod: finalPaymentString as any
      });

      // 6. WhatsApp Message with PDF Link
      // Assuming app runs on localhost:3000 or similar (using window.location.origin)
      // Since CRM is running on root (or relative base), do not hardcode /billing/
      const downloadLink = `${window.location.origin}/#/invoice/${invoiceNo}`;

      const message = `Hello ${customerDetails.name},

Thank you for visiting Celebrity Cuts!

Invoice Number: ${invoiceNo}
Total Amount: Rs. ${finalTotal.toFixed(2)}

You can download your invoice from the link below:

${downloadLink}

We'd love to hear your feedback!

Follow us on Instagram:
https://www.instagram.com/celebritycutsinsta

Like us on Facebook:
https://www.facebook.com/p/celebrity-cuts-100087441225596/

Thank you,
Celebrity Cuts`
      const cleanPhone = (customerDetails.mobile || '').replace(/\D/g, '');
      const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`

      alert(`Checkout Successful! Total: ₹${finalTotal.toFixed(2)}\nRedirecting to WhatsApp...`)

      // Reset Form
      setSelectedServices([])
      setSelectedProducts([])
      setCustomerDetails({ name: '', mobile: '' })
      setBillingOptions({ gstPercentage: 0, gstEnabled: false, discountType: 'amt', discountValue: 0, additionalAmount: 0, cardTaxPercentage: 0 })
      setPaymentSplits({ Cash: 0, Card: 0, UPI: 0 })
      setNewProductName('')
      setNewProductAmount('')
      setPaymentMode('Cash')

      // Open WhatsApp
      window.open(waLink, '_blank')

    } catch (error: any) {
      console.error(error)
      alert("Checkout Error: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* --- LEFT PANEL: SCROLLABLE WORKSPACE --- */}
      <div
        className="hide-scrollbar"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          position: 'relative',
          background: 'radial-gradient(circle at 50% 10%, #1a1a1a 0%, #000000 100%)',
          scrollbarWidth: 'none', // Inline fix
          msOverflowStyle: 'none' // Inline fix
        }}>
        {/* TOP BAR (Sticky inside Left Panel) */}
        <div style={{
          height: '70px', // Increased height
          minHeight: '70px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 30px',
          background: 'rgba(5, 5, 5, 0.95)', // Slightly darker
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%',
          boxSizing: 'border-box'
        }}>


          <div style={{
            flex: 1,
            maxWidth: '650px',
            height: '42px',
            background: theme.inputBg,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            transition: 'all 0.3s',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <div style={{ color: '#555', display: 'flex' }}><Icons.Search /></div>
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
          </div >

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
                    color: 'var(--accent-gold)',
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
                color: 'var(--accent-gold)',
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

          {/* Date/Time & Server */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: theme.textMuted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '2px' }}>Current Session</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
                <span>{dateStr}</span>
                <span style={{ color: theme.gold, fontSize: '8px', opacity: 0.6 }}>●</span>
                <span>{timeStr}</span>
              </div>
            </div>

            <div style={{
              width: '40px', height: '40px', borderRadius: '50%', background: theme.goldGradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: '800', fontSize: '18px',
              boxShadow: theme.goldGlow
            }}>
              A
            </div>
          </div>
        </div >

        {/* SCROLLABLE CONTENT */}
        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '100px' }}>

          {/* --- CARD 1: VISUAL SERVICE GRID (POS STYLE) --- */}
          <div style={{
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: '24px',
            overflow: 'visible',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            height: 'auto'
          }}>
            {/* Header & Search */}
            <div style={{
              padding: '24px 30px',
              borderBottom: `1px solid ${theme.border}`,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), rgba(255,255,255,0))',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '4px', height: '24px', background: theme.gold, borderRadius: '4px', boxShadow: theme.goldGlow }}></div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '1px' }}>SERVICE MENU</h2>
              </div>

              {/* Unified Search WITH DROPDOWN */}
              <div style={{ display: 'flex', flex: 1, maxWidth: '600px', gap: '10px' }}>
                <select 
                  value={serviceCategoryFilter} 
                  onChange={e => setServiceCategoryFilter(e.target.value)}
                  style={{
                    padding: '0 16px', height: '44px', background: '#121212', 
                    border: `1px solid ${theme.border}`, borderRadius: '12px', color: '#fff', outline: 'none',
                    minWidth: '150px'
                  }}>
                  <option value="">All Categories</option>
                  {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <div style={{ position: 'relative', flex: 1, height: '44px' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}><Icons.Search /></div>
                  <input
                    placeholder="Search any service (Type to see list)..."
                    value={serviceSearch}
                  onChange={e => setServiceSearch(e.target.value)}
                  onFocus={() => setServiceSearchFocused(true)}
                  onBlur={() => setTimeout(() => setServiceSearchFocused(false), 200)}
                  style={{
                    width: '100%', height: '100%', padding: '0 16px 0 44px',
                    background: '#121212', border: `1px solid ${theme.border}`, borderRadius: '12px',
                    color: '#fff', fontSize: '14px', outline: 'none'
                  }}
                />

                {/* RECOMMENDATION DROPDOWN */}
                {serviceSearchFocused && serviceSearch && searchDropdownServices.length > 0 && (
                  <div
                    className="hide-scrollbar"
                    style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                      background: '#1a1a1a', border: `1px solid ${theme.border}`, borderRadius: '12px',
                      zIndex: 100, maxHeight: '300px', overflowY: 'auto',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                      scrollbarWidth: 'none', // Inline fix
                      msOverflowStyle: 'none' // Inline fix
                    }}>
                    {searchDropdownServices.map(s => (
                      <div key={s.id}
                        onMouseDown={() => handleAddService(s)}
                        style={{
                          padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderBottom: `1px solid rgba(255,255,255,0.05)`, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>{s.name}</div>
                          <div style={{ fontSize: '11px', color: '#666' }}>{s.category}</div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: theme.gold }}>₹{s.price}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            </div >
          </div >

          {/* Active Items List (Moves below grid) */}
          {
            selectedServices.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedServices.map((item) => (
                  <div key={item.id} style={{
                    padding: '16px', borderRadius: '16px', background: '#121212',
                    border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '12px'
                  }}>
                    {/* Top Row: Service Name & Staff */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{item.name}</div>
                        {/* Staff Chips (Clickable to Edit) */}
                        <div
                          onClick={() => openStaffModal(item)}
                          style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', cursor: 'pointer', minHeight: '24px', alignItems: 'center' }}>
                          {item.staffIds.length > 0 ? item.staffIds.map(sid => (
                            <span key={sid} style={{ fontSize: '11px', color: '#ccc', background: '#222', padding: '2px 8px', borderRadius: '4px', border: '1px solid #333' }}>
                              {staffList.find(s => s.id === sid)?.name}
                            </span>
                          )) : (
                            <span style={{ fontSize: '11px', color: theme.gold, border: `1px dashed ${theme.gold}`, padding: '2px 8px', borderRadius: '4px' }}>
                              + Assign Staff
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveService(item.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444',
                          width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <Icons.Trash />
                      </button>
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', background: '#222', width: '100%' }}></div>

                    {/* Bottom Row: Metrics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '105px 85px 110px 1fr 1fr 100px', gap: '10px', alignItems: 'end' }}>
                      {/* Qty (Editable Stepper + Input) */}
                      <div>
                        <div style={{ fontSize: '10px', color: theme.gold, marginBottom: '4px', fontWeight: 700 }}>QTY</div>
                        <div style={{
                          height: '36px', display: 'flex', alignItems: 'center',
                          background: '#1a1a1a', borderRadius: '8px', border: `1px solid ${theme.gold}`, overflow: 'hidden'
                        }}>
                          <button
                            type="button"
                            onClick={() => handleItemQuantityChange(item.id, item.quantity - 1)}
                            style={{
                              width: '26px', height: '100%', background: '#222', border: 'none',
                              color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                          >-</button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity || 1}
                            onChange={(e) => handleItemQuantityChange(item.id, e.target.value)}
                            style={{
                              width: '100%', height: '100%', background: 'transparent',
                              border: 'none', color: '#fff', textAlign: 'center',
                              fontSize: '13px', fontWeight: 700, outline: 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleItemQuantityChange(item.id, item.quantity + 1)}
                            style={{
                              width: '26px', height: '100%', background: '#222', border: 'none',
                              color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                          >+</button>
                        </div>
                      </div>

                      {/* Price */}
                      <div>
                        <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 700 }}>PRICE</div>
                        <div style={{
                          height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333', color: '#ccc', fontSize: '13px'
                        }}>
                          ₹{item.price}
                        </div>
                      </div>

                      {/* Additional Charge */}
                      <div>
                        <div style={{ fontSize: '10px', color: '#10b981', marginBottom: '4px', fontWeight: 700 }}>ADD. CHARGE</div>
                        <input
                          type="number"
                          value={item.additionalCharge || ''}
                          onChange={(e) => handleItemAdditionalChargeChange(item.id, e.target.value)}
                          placeholder="0"
                          style={{
                            width: '100%', height: '36px', padding: '0 8px', background: '#1a1a1a',
                            border: '1px solid #10b981', borderRadius: '8px', color: '#10b981', outline: 'none',
                            textAlign: 'right', fontSize: '13px', fontWeight: 600
                          }}
                        />
                      </div>
                      {/* Disc Amt */}
                      <div>
                        <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 700 }}>DISC. AMT</div>
                        <input
                          type="number"
                          value={item.discountAmount || ''}
                          onChange={(e) => handleItemDiscountChange(item.id, 'amt', e.target.value)}
                          placeholder="0"
                          style={{
                            width: '100%', height: '36px', padding: '0 8px', background: '#1a1a1a',
                            border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none',
                            textAlign: 'right', fontSize: '13px'
                          }}
                        />
                      </div>

                      {/* Disc % */}
                      <div>
                        <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 700 }}>DISC. %</div>
                        <input
                          type="number"
                          value={item.discountPercent || ''}
                          onChange={(e) => handleItemDiscountChange(item.id, 'pct', e.target.value)}
                          placeholder="0"
                          style={{
                            width: '100%', height: '36px', padding: '0 8px', background: '#1a1a1a',
                            border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none',
                            textAlign: 'right', fontSize: '13px'
                          }}
                        />
                      </div>

                      {/* Total */}
                      <div>
                        <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px', fontWeight: 700 }}>TOTAL</div>
                        <div style={{
                          height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '12px',
                          background: '#1a1a1a', borderRadius: '8px', border: `1px solid ${theme.border}`, color: theme.gold, fontSize: '14px', fontWeight: 700
                        }}>
                          ₹{item.total.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }


          {/* --- CARD 2: EXTRA PRODUCTS --- */}
          <div style={{
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: '24px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 30px', background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${theme.border}`,
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <div style={{ width: '4px', height: '16px', background: '#555', borderRadius: '4px' }}></div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>Extra Products</h3>
            </div>

            <div style={{ padding: '24px 30px' }}>
              <div style={{
                display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap'
              }}>
                <input
                  placeholder="Product Name"
                  value={newProductName}
                  onChange={e => setNewProductName(e.target.value)}
                  style={{
                    height: '46px', // Standardized Height
                    padding: '0 20px', background: theme.inputBg, border: `1px solid ${theme.border}`,
                    borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '14px'
                  }}
                />
                <input
                  type="number" placeholder="₹ Amount"
                  value={newProductAmount}
                  onChange={e => {
                    setNewProductAmount(e.target.value)
                    // Reset discount when amount changes? Or recalc?
                    // Let's reset for safety or keep percentage?
                    // Keeping simple: if amount changes, just update amount.
                    // If they want to recalc discount, they can edit discount.
                    // Actually, if amount changes, discount amount should probably stay same?
                    // Better to reset or keep percentage. Let's keep percentage.
                    // For now, simpler to just set amount. Users usually enter amount then discount.
                  }}
                  style={{
                    height: '46px', width: '100px',
                    padding: '0 12px', background: theme.inputBg, border: `1px solid ${theme.border}`,
                    borderRadius: '12px', color: '#fff', outline: 'none', textAlign: 'right', fontSize: '14px'
                  }}
                />
                {/* New Discount Inputs for creation */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', width: '70px' }}>
                    <span style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Disc ₹</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={newProductDiscountAmount || ''}
                      onChange={e => handleNewProductDiscountChange('amt', e.target.value)}
                      style={{
                        height: '46px', width: '100%',
                        padding: '0 8px', background: theme.inputBg, border: `1px solid ${theme.border}`,
                        borderRadius: '12px', color: '#fff', outline: 'none', textAlign: 'center', fontSize: '13px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', width: '60px' }}>
                    <span style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Disc %</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={newProductDiscountPercent || ''}
                      onChange={e => handleNewProductDiscountChange('pct', e.target.value)}
                      style={{
                        height: '46px', width: '100%',
                        padding: '0 8px', background: theme.inputBg, border: `1px solid ${theme.border}`,
                        borderRadius: '12px', color: '#fff', outline: 'none', textAlign: 'center', fontSize: '13px'
                      }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddProduct}
                  disabled={!newProductName || !newProductAmount}
                  style={{
                    height: '46px',
                    background: '#222', color: '#fff', border: 'none',
                    borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px',
                    width: '100%'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#333'}
                  onMouseLeave={e => e.currentTarget.style.background = '#222'}
                >
                  Add
                </button>
              </div>

              {selectedProducts.length > 0 && (
                <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
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

                      <button onClick={() => handleRemoveProduct(p.id)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0 }}><Icons.Trash /></button>
                    </div>
                  ))
                  }
                </div>
              )}
            </div>
          </div>

          {/* --- CARD 3: ADDITIONAL CHARGES --- */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) minmax(250px, 1fr)', gap: '30px', flexWrap: 'wrap' }}>
            <div style={{
              background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '24px', padding: '24px 30px',
              display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
              <label style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Discount Type</label>
              <div style={{ display: 'flex', background: '#000', borderRadius: '14px', padding: '4px', border: '1px solid #222', height: '48px' }}>
                {['amt', 'pct'].map(type => (
                  <button key={type}
                    onClick={() => setBillingOptions({ ...billingOptions, discountType: type as any })}
                    style={{
                      flex: 1, height: '100%', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                      background: billingOptions.discountType === type ? theme.gold : 'transparent',
                      color: billingOptions.discountType === type ? '#000' : '#888',
                      transition: 'all 0.3s'
                    }}
                  >
                    {type === 'amt' ? '₹ Value' : '% Percent'}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Enter Discount Value"
                value={billingOptions.discountValue || ''}
                onChange={e => setBillingOptions({ ...billingOptions, discountValue: parseFloat(e.target.value) || 0 })}
                style={{
                  height: '52px',
                  padding: '0 20px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '14px', color: '#fff', outline: 'none', fontSize: '15px'
                }}
              />
            </div>

            <div style={{
              background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '24px', padding: '24px 30px',
              display: 'flex', flexDirection: 'column', gap: '20px'
            }}>


              <div>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Additional Charge</div>
                <input
                  type="number" placeholder="₹ 0.00"
                  value={billingOptions.additionalAmount || ''}
                  onChange={e => setBillingOptions({ ...billingOptions, additionalAmount: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', height: '52px', padding: '0 20px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '14px', color: '#fff', outline: 'none', fontSize: '15px' }}
                />
              </div>
            </div>
          </div>

        </div > {/* End Scrollable Content */}
      </div >

      {/* --- RIGHT PANEL: FIXED SUMMARY --- */}
      <div style={{
        width: '400px', // Reduced width
        minWidth: '400px',
        background: '#0a0a0a',
        borderLeft: `1px solid ${theme.border}`,
        padding: '20px', // Reduced padding
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'linear-gradient(180deg, #151515 0%, #0a0a0a 100%)',
          border: `1px solid ${theme.border}`,
          borderRadius: '20px', // Reduced radius
          padding: '24px 20px', // Reduced padding
          boxShadow: '0 20px 80px rgba(0,0,0,0.6)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Ambient gold glow top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: theme.goldGradient,
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)'
          }} />

          {/* GST Toggle Section (Top of Summary) */}
          <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Enable GST</div>
              {/* Toggle Switch */}
              <div
                onClick={() => setBillingOptions({ ...billingOptions, gstEnabled: !billingOptions.gstEnabled })}
                style={{
                  width: '36px', height: '20px',
                  background: billingOptions.gstEnabled ? theme.gold : '#333',
                  borderRadius: '20px', position: 'relative', cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{
                  width: '16px', height: '16px', background: '#fff', borderRadius: '50%',
                  position: 'absolute', top: '2px',
                  left: billingOptions.gstEnabled ? '18px' : '2px',
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }} />
              </div>
            </div>

            {/* GST Input (Conditional) */}
            {billingOptions.gstEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeIn 0.3s ease-out' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>Rate:</span>
                <input
                  type="number" placeholder="18"
                  value={billingOptions.gstPercentage || ''}
                  onChange={e => setBillingOptions({ ...billingOptions, gstPercentage: parseFloat(e.target.value) || 0 })}
                  style={{
                    flex: 1, height: '36px', padding: '0 10px',
                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.border}`,
                    borderRadius: '8px', color: '#fff', outline: 'none', fontSize: '13px'
                  }}
                />
                <span style={{ fontSize: '12px', color: '#666' }}>%</span>
              </div>
            )}
          </div>

          <h3 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 700, color: theme.gold, letterSpacing: '2px', textAlign: 'center', textTransform: 'uppercase' }}>
            Bill Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888' }}>
              <span>Service Total</span>
              <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#fff' }}>₹{servicesTotal.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888' }}>
              <span>Product Total</span>
              <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#fff' }}>₹{productsTotal.toFixed(2)}</span>
            </div>

            <div style={{ height: '1px', background: '#222', margin: '4px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#fff', fontWeight: 500 }}>
              <span>Subtotal</span>
              <span style={{ fontFamily: 'monospace', fontSize: '15px' }}>₹{subTotal.toFixed(2)}</span>
            </div>

            {discountAmt > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#ef4444' }}>
                <span>Discount</span>
                <span style={{ fontFamily: 'monospace' }}>- ₹{discountAmt.toFixed(2)}</span>
              </div>
            )}

            {gstAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#aaa' }}>
                <span>GST ({billingOptions.gstPercentage}%)</span>
                <span style={{ fontFamily: 'monospace' }}>+ ₹{gstAmount.toFixed(2)}</span>
              </div>
            )}

            {billingOptions.additionalAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#aaa' }}>
                <span>Extras</span>
                <span style={{ fontFamily: 'monospace' }}>+ ₹{billingOptions.additionalAmount.toFixed(2)}</span>
              </div>
            )}

            {cardTaxAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#aaa' }}>
                <span>Card Surcharge ({billingOptions.cardTaxPercentage}%)</span>
                <span style={{ fontFamily: 'monospace' }}>+ ₹{cardTaxAmount.toFixed(2)}</span>
              </div>
            )}
            {/* Total Block */}
            <div style={{
              marginTop: '12px',
              padding: '16px',
              background: '#050505',
              borderRadius: '16px',
              border: `1px solid ${theme.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
            }}>
              <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Grand Total</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
                ₹{finalTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Payment Mode</label>
              <button
                onClick={() => {
                  setIsSplitPayment(!isSplitPayment);
                  if (!isSplitPayment) {
                    setPaymentSplits({ Cash: finalTotal, Card: 0, UPI: 0 });
                  }
                }}
                style={{ background: 'none', border: 'none', color: theme.gold, fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
              >
                {isSplitPayment ? 'Single Payment' : 'Split Payment'}
              </button>
            </div>

            {!isSplitPayment ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Cash', 'Card', 'UPI'].map(mode => (
                  <button key={mode} onClick={() => setPaymentMode(mode)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer',
                      background: paymentMode === mode ? theme.gold : '#222', color: paymentMode === mode ? '#000' : '#888',
                      border: 'none', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(['Cash', 'Card', 'UPI'] as const).map(mode => (
                  <div key={mode} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#222', padding: '8px 12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{mode}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#aaa', fontSize: '13px' }}>₹</span>
                      <input
                        type="number"
                        value={paymentSplits[mode] === 0 ? '' : paymentSplits[mode]}
                        placeholder="0"
                        onChange={(e) => {
                          let val = parseFloat(e.target.value) || 0;
                          const others = (['Cash', 'Card', 'UPI'] as const).filter(m => m !== mode).reduce((acc, m) => acc + paymentSplits[m], 0);
                          const maxAllowed = finalTotal - others;
                          if (val > maxAllowed) val = maxAllowed;
                          if (val < 0) val = 0;
                          setPaymentSplits({ ...paymentSplits, [mode]: val });
                        }}
                        style={{ width: '80px', background: '#111', color: theme.gold, border: `1px solid ${theme.border}`, borderRadius: '6px', padding: '6px', textAlign: 'right', outline: 'none', fontWeight: 'bold' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {(isSplitPayment || paymentMode === 'Card') && (
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: '#222', padding: '10px 12px', borderRadius: '8px', animation: 'fadeIn 0.3s ease-out' }}>
                <span style={{ fontSize: '12px', color: '#aaa', fontWeight: 600 }}>Card Extra %:</span>
                <input
                  type="number" placeholder="e.g. 2"
                  value={billingOptions.cardTaxPercentage || ''}
                  onChange={e => setBillingOptions({ ...billingOptions, cardTaxPercentage: parseFloat(e.target.value) || 0 })}
                  style={{
                    flex: 1, height: '32px', padding: '0 10px',
                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.border}`,
                    borderRadius: '6px', color: '#fff', outline: 'none', fontSize: '13px'
                  }}
                />
                <span style={{ fontSize: '12px', color: '#aaa' }}>%</span>
              </div>
            )}
            
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            <button style={{
              flex: 1, padding: '14px', background: 'transparent', border: `1px solid ${theme.border}`, color: '#fff',
              borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px'
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Save Draft
            </button>
            <button style={{
              flex: 2, padding: '14px', background: theme.goldGradient, border: 'none', color: '#000',
              borderRadius: '12px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 30px rgba(212, 175, 55, 0.2)',
              fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px'
            }}
              onClick={handleCheckout}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              CHECKOUT
            </button>
          </div>
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '10px', color: '#333', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Protected by 256-bit SSL encryption
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
    </div>
  )
}
export default BillingPage