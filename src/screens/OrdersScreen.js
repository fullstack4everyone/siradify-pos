import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView,
  Platform
} from 'react-native'
import { useState, useEffect } from 'react'
import api from '../services/api'
import { COLORS } from '../constants/colors'

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders')
      setOrders(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderDetails = async (id) => {
    try {
      const res = await api.get(`/orders/${id}`)
      setSelected(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total), 0)
  const todayOrders = orders.filter(o => {
    const today = new Date()
    const orderDate = new Date(o.created_at)
    return orderDate.toDateString() === today.toDateString()
  })
  const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total), 0)

  if (selected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSelected(null)}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order #{selected.order.id}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.detailScroll}>
          <View style={styles.detailCard}>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(selected.order.created_at)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment</Text>
              <Text style={[styles.detailValue, { textTransform: 'capitalize' }]}>
                {selected.order.payment_method === 'mpesa' ? '📱 M-Pesa' : '💵 Cash'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={{
                backgroundColor: selected.order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 20,
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: selected.order.payment_status === 'paid' ? '#065F46' : '#92400E',
                }}>
                  {selected.order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                </Text>
              </View>
            </View>
            {selected.order.customer_phone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer</Text>
                <Text style={styles.detailValue}>{selected.order.customer_phone}</Text>
              </View>
            )}

            <View style={styles.divider} />

            <Text style={styles.itemsTitle}>Items</Text>
            {selected.items && selected.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>x{item.quantity}</Text>
                </View>
                <Text style={styles.itemTotal}>
                  KES {(parseFloat(item.price) * item.quantity).toLocaleString()}
                </Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                KES {parseFloat(selected.order.total).toLocaleString()}
              </Text>
            </View>

          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>← POS</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchOrders}>
          <Text style={styles.refreshBtnText}>↻</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Today</Text>
          <Text style={styles.statValue}>KES {todayRevenue.toLocaleString()}</Text>
          <Text style={styles.statSub}>{todayOrders.length} orders</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.navy }]}>
          <Text style={styles.statLabel}>All Time</Text>
          <Text style={styles.statValue}>KES {totalRevenue.toLocaleString()}</Text>
          <Text style={styles.statSub}>{orders.length} orders</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} size="large" style={{ marginTop: 40 }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🧾</Text>
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={styles.emptySub}>Orders will appear here after sales</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
          {orders.map(order => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => fetchOrderDetails(order.id)}
            >
              <View style={styles.orderCardLeft}>
                <Text style={styles.orderCardId}>Order #{order.id}</Text>
                <Text style={styles.orderCardDate}>{formatDate(order.created_at)}</Text>
                <Text style={styles.orderCardPayment}>
                  {order.payment_method === 'mpesa' ? '📱 M-Pesa' : '💵 Cash'}
                </Text>
              </View>
              <View style={styles.orderCardRight}>
                <Text style={styles.orderCardTotal}>
                  KES {parseFloat(order.total).toLocaleString()}
                </Text>
                <View style={{
                  backgroundColor: order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 20,
                  marginTop: 4,
                }}>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: order.payment_status === 'paid' ? '#065F46' : '#92400E',
                  }}>
                    {order.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                  </Text>
                </View>
                <Text style={styles.orderCardArrow}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
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
    fontSize: 11,
    color: COLORS.textGray,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderCardLeft: {
    flex: 1,
  },
  orderCardId: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 3,
  },
  orderCardDate: {
    fontSize: 11,
    color: COLORS.textGray,
    marginBottom: 3,
  },
  orderCardPayment: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  orderCardRight: {
    alignItems: 'flex-end',
  },
  orderCardTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  orderCardArrow: {
    fontSize: 20,
    color: COLORS.textGray,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textGray,
  },
  detailScroll: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textGray,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    color: COLORS.textDark,
    flex: 1,
  },
  itemQty: {
    fontSize: 11,
    color: COLORS.textGray,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
  },
})