import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
  TextInput, Modal
} from 'react-native'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { COLORS } from '../constants/colors'
import ReceiptCard from '../components/ReceiptCard'

export default function POSScreenWeb({ navigation }) {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [showMpesaModal, setShowMpesaModal] = useState(false)
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [receipt, setReceipt] = useState(null)
  const { user, logout } = useAuth()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products')
      const normalized = res.data.map(p => ({
        ...p,
        price: parseFloat(p.price),
        stock: parseInt(p.stock),
      }))
      setProducts(normalized)
    } catch (err) {
      Alert.alert('Error', 'Could not load products')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId) => {
    const existing = cart.find(item => item.id === productId)
    if (existing.quantity === 1) {
      setCart(cart.filter(item => item.id !== productId))
    } else {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ))
    }
  }

  const removeItemCompletely = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const getCartQuantity = (productId) => {
    const item = cart.find(i => i.id === productId)
    return item ? item.quantity : 0
  }

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  const placeOrder = async (paymentMethod) => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add products to cart first')
      return
    }
    if (paymentMethod === 'mpesa') {
      setShowMpesaModal(true)
      return
    }
    setPlacing(true)
    try {
      const items = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }))
      const res = await api.post('/orders', { items, payment_method: paymentMethod })
      setCart([])
      setReceipt({ order: res.data.order, items: res.data.items })
      fetchProducts()
    } catch (err) {
      Alert.alert('Error', 'Could not place order')
    } finally {
      setPlacing(false)
    }
  }

  const processMpesaPayment = async () => {
    if (!mpesaPhone) {
      Alert.alert('Error', 'Please enter phone number')
      return
    }
    setShowMpesaModal(false)
    setPlacing(true)
    try {
      const items = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }))
      const orderRes = await api.post('/orders', {
        items,
        payment_method: 'mpesa',
        customer_phone: mpesaPhone
      })
      const orderId = orderRes.data.order.id
      const total = getTotal()
      await api.post('/mpesa/stkpush', {
        phone: mpesaPhone,
        amount: total,
        order_id: orderId
      })
      setCart([])
      setMpesaPhone('')
      setReceipt({
        order: { ...orderRes.data.order, payment_status: 'pending' },
        items: orderRes.data.items
      })
      fetchProducts()
    } catch (err) {
      Alert.alert('Error', 'Could not process M-Pesa payment')
    } finally {
      setPlacing(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
  }

  const ProductCard = ({ item }) => {
    const qty = getCartQuantity(item.id)
    return (
      <TouchableOpacity
        style={[styles.productCard, qty > 0 && styles.productCardActive]}
        onPress={() => addToCart(item)}
        activeOpacity={0.7}
      >
        <View style={styles.productEmoji}>
          <Text style={styles.productEmojiText}>
            {item.category === 'drinks' ? '🥤' :
             item.category === 'food' ? '🍽️' :
             item.category === 'electronics' ? '📱' : '📦'}
          </Text>
        </View>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>KES {item.price.toLocaleString()}</Text>
        <Text style={styles.productStock}>{item.stock} left</Text>
        {qty > 0 && (
          <View style={styles.qtyBadge}>
            <Text style={styles.qtyBadgeText}>{qty}</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderProducts = () => {
    const rows = []
    for (let i = 0; i < products.length; i += 3) {
      const row = products.slice(i, i + 3)
      rows.push(
        <View key={i} style={styles.productRow}>
          {row.map(item => (
            <ProductCard key={item.id} item={item} />
          ))}
          {row.length < 3 && (
            [...Array(3 - row.length)].map((_, idx) => (
              <View key={`empty-${idx}`} style={[styles.productCard, { opacity: 0 }]} />
            ))
          )}
        </View>
      )
    }
    return rows
  }

  if (receipt) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>S</Text>
            </View>
            <Text style={styles.headerTitle}>Receipt</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => setReceipt(null)}
          >
            <Text style={styles.logoutText}>New Order</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          contentContainerStyle={styles.receiptScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ReceiptCard order={receipt.order} items={receipt.items} />
          <TouchableOpacity
            style={styles.startNewOrderBtn}
            onPress={() => setReceipt(null)}
          >
            <Text style={styles.startNewOrderText}>Start New Order</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.container}>

      <Modal
        visible={showMpesaModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMpesaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>M-Pesa Payment</Text>
            <Text style={styles.modalSubtitle}>
              Total: KES {getTotal().toLocaleString()}
            </Text>
            <Text style={styles.modalLabel}>Customer Phone Number</Text>
            <TextInput
              style={styles.modalInput}
              value={mpesaPhone}
              onChangeText={setMpesaPhone}
              placeholder="e.g. 0712345678"
              placeholderTextColor={COLORS.textGray}
              keyboardType="phone-pad"
            />
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={processMpesaPayment}
            >
              <Text style={styles.modalConfirmText}>Send M-Pesa Request</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => {
                setShowMpesaModal(false)
                setMpesaPhone('')
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Siradify POS</Text>
            <Text style={styles.headerSub}>Hi, {user?.name}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Products</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.gold} size="large" style={{ marginTop: 40 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderProducts()}
            </ScrollView>
          )}
        </View>

        <View style={styles.cartSection}>
          <Text style={styles.sectionTitle}>
            Cart {cart.length > 0 ? `(${getTotalItems()})` : ''}
          </Text>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartEmoji}>🛒</Text>
              <Text style={styles.emptyCartText}>Cart is empty</Text>
              <Text style={styles.emptyCartSub}>Click a product to add</Text>
            </View>
          ) : (
           <ScrollView
            contentContainerStyle={styles.receiptScrollContent}
            showsVerticalScrollIndicator={true}
            style={{ flex: 1 }}
          >
              {cart.map(item => (
                <View key={item.id} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.cartItemPrice}>
                      KES {(item.price * item.quantity).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.cartItemControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => removeFromCart(item.id)}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => addToCart(item)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeItemCompletely(item.id)}
                    >
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.cartFooter}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>KES {getTotal().toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={styles.cashBtn}
              onPress={() => placeOrder('cash')}
              disabled={placing}
            >
              {placing ? (
                <ActivityIndicator color={COLORS.navy} />
              ) : (
                <Text style={styles.cashBtnText}>💵  Cash Payment</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mpesaBtn}
              onPress={() => placeOrder('mpesa')}
              disabled={placing}
            >
              <Text style={styles.mpesaBtnText}>📱  M-Pesa Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  receiptScrollContent: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  startNewOrderBtn: {
    backgroundColor: COLORS.navy,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
    maxWidth: 360,
  },
  startNewOrderText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 28,
    width: 380,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.gold,
    fontWeight: '700',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.textDark,
    marginBottom: 16,
  },
  modalConfirmBtn: {
    width: '100%',
    backgroundColor: COLORS.navy,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalConfirmText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  modalCancelBtn: {
    width: '100%',
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelText: {
    color: COLORS.textGray,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    backgroundColor: COLORS.navy,
    paddingBottom: 16,
    paddingHorizontal: 24,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 74,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 42,
    height: 42,
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: COLORS.navy,
    fontWeight: '800',
    fontSize: 20,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  body: {
    flexDirection: 'row',
    position: 'absolute',
    top: 74,
    left: 0,
    right: 0,
    bottom: 0,
  },
  productsSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 340,
    bottom: 0,
    padding: 20,
  },
  cartSection: {
    width: 340,
    backgroundColor: COLORS.white,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 0,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    flexDirection: 'column',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 16,
    flexShrink: 0,
  },
  productRow: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 14,
  },
  productCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  productCardActive: {
    borderColor: COLORS.gold,
    backgroundColor: '#FFFBF0',
  },
  productEmoji: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  productEmojiText: {
    fontSize: 30,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 15,
    color: COLORS.navy,
    fontWeight: '700',
    marginBottom: 2,
  },
  productStock: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  qtyBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartEmoji: {
    fontSize: 52,
    marginBottom: 14,
  },
  emptyCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textGray,
    marginBottom: 4,
  },
  emptyCartSub: {
    fontSize: 13,
    color: COLORS.textGray,
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 10,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 3,
  },
  cartItemPrice: {
    fontSize: 13,
    color: COLORS.gold,
    fontWeight: '700',
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    minWidth: 24,
    textAlign: 'center',
  },
  removeBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  cartFooter: {
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
    flexShrink: 0,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.navy,
  },
  cashBtn: {
    backgroundColor: COLORS.gold,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  cashBtnText: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: '700',
  },
  mpesaBtn: {
    backgroundColor: COLORS.navy,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  mpesaBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
})