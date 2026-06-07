import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
  Platform
} from 'react-native'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { COLORS } from '../constants/colors'

export default function POSScreen({ navigation }) {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
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

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const getCartQuantity = (productId) => {
    const item = cart.find(i => i.id === productId)
    return item ? item.quantity : 0
  }

  const placeOrder = async (paymentMethod) => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add products to cart first')
      return
    }
    setPlacing(true)
    try {
      const items = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }))
      await api.post('/orders', { items, payment_method: paymentMethod })
      Alert.alert('Success', `Order placed. Total: KES ${getTotal()}`)
      setCart([])
      fetchProducts()
    } catch (err) {
      Alert.alert('Error', 'Could not place order')
    } finally {
      setPlacing(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigation.replace('Login')
  }

  const numColumns = 3

  const ProductCard = ({ item }) => {
    const qty = getCartQuantity(item.id)
    return (
      <TouchableOpacity
        style={[styles.productCard, qty > 0 && styles.productCardActive]}
        onPress={() => addToCart(item)}
      >
        <View style={styles.productEmoji}>
          <Text style={styles.productEmojiText}>
            {item.category === 'drinks' ? '🥤' :
             item.category === 'food' ? '🍽️' :
             item.category === 'electronics' ? '📱' : '📦'}
          </Text>
        </View>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productPrice}>
          KES {item.price.toLocaleString()}
        </Text>
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
    for (let i = 0; i < products.length; i += numColumns) {
      const row = products.slice(i, i + numColumns)
      rows.push(
        <View key={i} style={styles.productRow}>
          {row.map(item => (
            <ProductCard key={item.id} item={item} />
          ))}
          {row.length < numColumns && (
            [...Array(numColumns - row.length)].map((_, idx) => (
              <View key={`empty-${idx}`} style={[styles.productCard, { opacity: 0 }]} />
            ))
          )}
        </View>
      )
    }
    return rows
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={styles.headerTitle}>Siradify POS</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerUser}>Hi, {user?.name}</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Products</Text>
          {loading ? (
            <ActivityIndicator
              color={COLORS.gold}
              size="large"
              style={{ marginTop: 40 }}
            />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderProducts()}
            </ScrollView>
          )}
        </View>

        <View style={styles.cartSection}>
          <Text style={styles.sectionTitle}>
            Cart {cart.length > 0 ? `(${cart.length})` : ''}
          </Text>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartText}>No items yet</Text>
              <Text style={styles.emptyCartSub}>Tap a product to add</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.cartList}
              showsVerticalScrollIndicator={false}
            >
              {cart.map(item => (
                <View key={item.id} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.cartItemPrice}>
                      KES {item.price.toLocaleString()}
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
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.cartFooter}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                KES {getTotal().toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.cashBtn}
              onPress={() => placeOrder('cash')}
              disabled={placing}
            >
              {placing ? (
                <ActivityIndicator color={COLORS.navy} />
              ) : (
                <Text style={styles.cashBtnText}>Cash Payment</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mpesaBtn}
              onPress={() => placeOrder('mpesa')}
              disabled={placing}
            >
              <Text style={styles.mpesaBtnText}>M-Pesa Payment</Text>
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
  header: {
    backgroundColor: COLORS.navy,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 34,
    height: 34,
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: COLORS.navy,
    fontWeight: '800',
    fontSize: 16,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  headerUser: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  productsSection: {
    flex: 2,
    padding: 16,
  },
  cartSection: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 12,
  },
  productRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productCard: {
    flex: 1,
    margin: 6,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
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
    width: 48,
    height: 48,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  productEmojiText: {
    fontSize: 24,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
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
    width: 20,
    height: 20,
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
  },
  emptyCartText: {
    fontSize: 15,
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 8,
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  cartItemPrice: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    backgroundColor: COLORS.background,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    minWidth: 20,
    textAlign: 'center',
  },
  cartFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  cashBtn: {
    backgroundColor: COLORS.gold,
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  cashBtnText: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  mpesaBtn: {
    backgroundColor: COLORS.navy,
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
  },
  mpesaBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
})