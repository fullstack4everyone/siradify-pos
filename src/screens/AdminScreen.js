import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
  Platform, TextInput, Modal
} from 'react-native'
import { useState, useEffect } from 'react'
import api from '../services/api'
import { COLORS } from '../constants/colors'

export default function AdminScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('cashier')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [ordersRes, productsRes, staffRes] = await Promise.all([
        api.get('/orders'),
        api.get('/products'),
        api.get('/auth/staff'),
      ])
      setOrders(ordersRes.data)
      setProducts(productsRes.data)
      setStaff(staffRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/payment`, { payment_status: 'paid' })
      setOrders(orders.map(o =>
        o.id === orderId ? { ...o, payment_status: 'paid' } : o
      ))
    } catch (err) {
      Alert.alert('Error', 'Could not update order')
    }
  }

  const handleAddStaff = async () => {
    if (!newName || !newEmail || !newPassword) {
      Alert.alert('Error', 'All fields are required')
      return
    }
    setAdding(true)
    try {
      await api.post('/auth/register-cashier', {
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      })
      Alert.alert('Success', `${newName} account created`)
      setNewName('')
      setNewEmail('')
      setNewPassword('')
      setNewRole('cashier')
      setShowAddStaff(false)
      fetchAll()
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not create account')
    } finally {
      setAdding(false)
    }
  }

  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total), 0)
  const pendingOrders = orders.filter(o => o.payment_status === 'pending')
  const todayOrders = orders.filter(o => {
    const today = new Date()
    const orderDate = new Date(o.created_at)
    return orderDate.toDateString() === today.toDateString()
  })
  const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total), 0)

  const tabs = [
    { id: 'dashboard', label: '📊 Stats' },
    { id: 'orders', label: '🧾 Orders' },
    { id: 'products', label: '📦 Products' },
    { id: 'staff', label: '👥 Staff' },
  ]

  const DashboardTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: COLORS.gold }]}>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <Text style={styles.statValue}>KES {totalRevenue.toLocaleString()}</Text>
          <Text style={styles.statSub}>All time</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
          <Text style={styles.statLabel}>Today</Text>
          <Text style={styles.statValue}>KES {todayRevenue.toLocaleString()}</Text>
          <Text style={styles.statSub}>{todayOrders.length} orders</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#EF4444' }]}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{pendingOrders.length}</Text>
          <Text style={styles.statSub}>Need approval</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.navy }]}>
          <Text style={styles.statLabel}>Products</Text>
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statSub}>In inventory</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {orders.slice(0, 5).map(order => (
          <View key={order.id} style={styles.orderRow}>
            <View style={styles.orderRowLeft}>
              <Text style={styles.orderRowId}>#{order.id}</Text>
              <Text style={styles.orderRowDate}>
                {new Date(order.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.orderRowRight}>
              <Text style={styles.orderRowTotal}>
                KES {parseFloat(order.total).toLocaleString()}
              </Text>
              <View style={{
                backgroundColor: order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
              }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: order.payment_status === 'paid' ? '#065F46' : '#92400E',
                }}>
                  {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )

  const OrdersTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {pendingOrders.length > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>
            ⚠️ {pendingOrders.length} payment{pendingOrders.length > 1 ? 's' : ''} pending approval
          </Text>
        </View>
      )}
      {orders.map(order => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderCardHeader}>
            <Text style={styles.orderCardId}>Order #{order.id}</Text>
            <Text style={styles.orderCardTotal}>
              KES {parseFloat(order.total).toLocaleString()}
            </Text>
          </View>
          <View style={styles.orderCardDetails}>
            <Text style={styles.orderCardDetail}>
              {order.payment_method === 'mpesa' ? '📱 M-Pesa' : '💵 Cash'}
            </Text>
            <Text style={styles.orderCardDetail}>
              {new Date(order.created_at).toLocaleString('en-KE', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </Text>
          </View>
          {order.customer_phone && (
            <Text style={styles.orderCardPhone}>{order.customer_phone}</Text>
          )}
          <View style={styles.orderCardFooter}>
            <View style={{
              backgroundColor: order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: order.payment_status === 'paid' ? '#065F46' : '#92400E',
              }}>
                {order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
              </Text>
            </View>
            {order.payment_status === 'pending' && (
              <TouchableOpacity
                style={styles.markPaidBtn}
                onPress={() => markAsPaid(order.id)}
              >
                <Text style={styles.markPaidBtnText}>Mark Paid</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  )

  const ProductsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('AddProduct')}
      >
        <Text style={styles.addBtnText}>+ Add New Product</Text>
      </TouchableOpacity>
      {products.map(product => (
        <View key={product.id} style={styles.productRow}>
          <View style={styles.productRowEmoji}>
            <Text style={{ fontSize: 20 }}>
              {product.category === 'drinks' ? '🥤' :
               product.category === 'food' ? '🍽️' :
               product.category === 'electronics' ? '📱' : '📦'}
            </Text>
          </View>
          <View style={styles.productRowInfo}>
            <Text style={styles.productRowName}>{product.name}</Text>
            <Text style={styles.productRowPrice}>
              KES {parseFloat(product.price).toLocaleString()}
            </Text>
          </View>
          <View style={{
            backgroundColor: product.stock > 10 ? '#D1FAE5' : '#FEE2E2',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 20,
          }}>
            <Text style={{
              fontSize: 11,
              fontWeight: '700',
              color: product.stock > 10 ? '#065F46' : '#DC2626',
            }}>
              {product.stock} left
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  )

  const StaffTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setShowAddStaff(true)}
      >
        <Text style={styles.addBtnText}>+ Add Staff Account</Text>
      </TouchableOpacity>

      {staff.map((member, i) => (
        <View key={i} style={styles.staffCard}>
          <View style={styles.staffAvatar}>
            <Text style={styles.staffAvatarText}>
              {member.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.staffInfo}>
            <Text style={styles.staffName}>{member.name}</Text>
            <Text style={styles.staffEmail}>{member.email}</Text>
          </View>
          <View style={{
            backgroundColor: member.role === 'admin' ? '#EDE9FE' : '#DBEAFE',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 20,
          }}>
            <Text style={{
              fontSize: 11,
              fontWeight: '700',
              color: member.role === 'admin' ? '#5B21B6' : '#1D4ED8',
              textTransform: 'capitalize',
            }}>
              {member.role}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  )

  return (
    <View style={styles.container}>

      <Modal
        visible={showAddStaff}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddStaff(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Staff Account</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Full Name"
              placeholderTextColor={COLORS.textGray}
            />
            <TextInput
              style={styles.modalInput}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="Email"
              placeholderTextColor={COLORS.textGray}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Password"
              placeholderTextColor={COLORS.textGray}
              secureTextEntry
            />
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleBtn, newRole === 'cashier' && styles.roleBtnActive]}
                onPress={() => setNewRole('cashier')}
              >
                <Text style={[styles.roleBtnText, newRole === 'cashier' && styles.roleBtnTextActive]}>
                  Cashier
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, newRole === 'admin' && styles.roleBtnActive]}
                onPress={() => setNewRole('admin')}
              >
                <Text style={[styles.roleBtnText, newRole === 'admin' && styles.roleBtnTextActive]}>
                  Admin
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={handleAddStaff}
              disabled={adding}
            >
              <Text style={styles.modalConfirmText}>
                {adding ? 'Creating...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowAddStaff(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>← POS</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchAll}>
          <Text style={styles.refreshBtnText}>↻</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={COLORS.gold} size="large" style={{ marginTop: 40 }} />
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'products' && <ProductsTab />}
            {activeTab === 'staff' && <StaffTab />}
          </>
        )}
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
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  backBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  refreshBtnText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.gold,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textGray,
  },
  tabTextActive: {
    color: COLORS.navy,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textGray,
    marginBottom: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 2,
  },
  statSub: {
    fontSize: 10,
    color: COLORS.textGray,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 12,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderRowLeft: {},
  orderRowId: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  orderRowDate: {
    fontSize: 11,
    color: COLORS.textGray,
  },
  orderRowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderRowTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  alertBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderCardId: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  orderCardTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },
  orderCardDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  orderCardDetail: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  orderCardPhone: {
    fontSize: 12,
    color: COLORS.textGray,
    marginBottom: 8,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  markPaidBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markPaidBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  addBtn: {
    backgroundColor: COLORS.navy,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  productRowEmoji: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productRowInfo: {
    flex: 1,
  },
  productRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 2,
  },
  productRowPrice: {
    fontSize: 13,
    color: COLORS.gold,
    fontWeight: '700',
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  staffAvatar: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.navy,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffAvatarText: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: '800',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 2,
  },
  staffEmail: {
    fontSize: 12,
    color: COLORS.textGray,
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.textDark,
    marginBottom: 12,
    backgroundColor: COLORS.background,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  roleBtnActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  roleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  roleBtnTextActive: {
    color: COLORS.white,
  },
  modalConfirmBtn: {
    backgroundColor: COLORS.gold,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalConfirmText: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: '700',
  },
  modalCancelBtn: {
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
})