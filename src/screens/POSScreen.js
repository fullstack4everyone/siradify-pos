import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
  Platform, Dimensions, Modal, TextInput
} from 'react-native'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { COLORS } from '../constants/colors'

const { width } = Dimensions.get('window')
const isPhone = Platform.OS !== 'web' && width < 768

export default function POSScreen({ navigation }) {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [view, setView] = useState('products')
  const [showMpesaModal, setShowMpesaModal] = useState(false)
  const [mpesaPhone, setMpesaPhone] = useState('')
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
      navigation.navigate('Receipt', {
        order: res.data.order,
        items: res.data.items,
      })
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
      navigation.navigate('Receipt', {
        order: { ...orderRes.data.order, payment_status: 'pending' },
        items: orderRes.data.items,
      })
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
    for (let i = 0; i < products.length; i += 2) {
      const row = products.slice(i, i + 2)
      rows.push(
        <View key={i} style={styles.productRow}>
          {row.map(item => (
            <ProductCard key={item.id} item={item} />
          ))}
          {row.length < 2 && (
            <View style={[styles.productCard, { opacity: 0 }]} />
          )}
        </View>
      )
    }
    return rows
  }

  const ProductsView = () => (
    <View style={styles.productsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Products</Text>
        {cart.length > 0 && (
          <TouchableOpacity
            style={styles.viewCartBtn}
            onPress={() => setView('cart')}
          >
            <Text style={styles.viewCartBtnText}>
              Cart ({getTotalItems()})
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.gold} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderProducts()}
        </ScrollView>
      )}
    </View>
  )

  const CartView = () => (
    <View style={styles.cartSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Cart {cart.length > 0 ? `(${getTotalItems()})` : ''}
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setView('products')}
        >
          <Text style={styles.backBtnText}>← Products</Text>
        </TouchableOpacity>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyCartEmoji}>🛒</Text>
          <Text style={styles.emptyCartText}>Cart is empty</Text>
          <Text style={styles.emptyCartSub}>Tap a product to add</Text>
        </View>
      ) : (
        <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
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
  )

  return (
    <View style={styles.container}>

      <Modal
        visible={showMpesaModal}
        transparent
        animationType="slide"
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

      {view === 'products' ? <ProductsView /> : <CartView />}

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
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
    padding: 14,
    fontSize: 16,
    color: COLORS.textDark,
    marginBottom: 16,
  },
  modalConfirmBtn: {
    width: '100%',
    backgroundColor: COLORS.navy,
    padding: 15,
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
    padding: 15,
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
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 38,
    height: 38,
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: COLORS.navy,
    fontWeight: '800',
    fontSize: 18,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  logoutText: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  productsSection: {
    flex: 1,
    padding: 16,
  },
  cartSection: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.navy,
  },
  viewCartBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  viewCartBtnText: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: '700',
  },
  backBtn: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backBtnText: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: '600',
  },
  productRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  productCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
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
    width: 54,
    height: 54,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  productEmojiText: {
    fontSize: 28,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 14,
    color: COLORS.navy,
    fontWeight: '700',
    marginBottom: 2,
  },
  productStock: {
    fontSize: 11,
    color: COLORS.textGray,
  },
  qtyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.navy,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCartEmoji: {
    fontSize: 48,
    marginBottom: 12,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 8,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 2,
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
    fontSize: 15,
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
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
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
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
  },
  cashBtn: {
    backgroundColor: COLORS.gold,
    padding: 15,
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
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  mpesaBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
})