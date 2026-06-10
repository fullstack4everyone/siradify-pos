import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '../constants/colors'

export default function ReceiptCard({ order, items }) {

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const subtotal = items ? items.reduce((sum, item) =>
    sum + parseFloat(item.price) * item.quantity, 0) : 0
  const tax = 0
  const discount = 0
  const grandTotal = subtotal - discount + tax

  return (
    <View style={styles.receipt}>
      <View style={styles.topAccent} />
      <View style={styles.brandSection}>
        <View style={styles.brandLogo}>
          <Text style={styles.brandLogoText}>S</Text>
        </View>
        <Text style={styles.brandName}>SIRADIFY POS</Text>
        <Text style={styles.brandAddress}>Nairobi, Kenya</Text>
        <Text style={styles.brandPhone}>support@siradify.com</Text>
      </View>
      <View style={styles.goldLine} />
      <View style={styles.transactionSection}>
        <View style={styles.transRow}>
          <Text style={styles.transLabel}>Order No.</Text>
          <Text style={styles.transValue}>#{order.id}</Text>
        </View>
        <View style={styles.transRow}>
          <Text style={styles.transLabel}>Date</Text>
          <Text style={styles.transValue}>{formatDate(order.created_at)}</Text>
        </View>
        <View style={styles.transRow}>
          <Text style={styles.transLabel}>Cashier</Text>
          <Text style={styles.transValue}>Mohamed Sirad</Text>
        </View>
        <View style={styles.transRow}>
          <Text style={styles.transLabel}>Payment</Text>
          <Text style={[styles.transValue, { textTransform: 'capitalize', color: COLORS.gold }]}>
            {order.payment_method}
          </Text>
        </View>
        {order.customer_phone && (
          <View style={styles.transRow}>
            <Text style={styles.transLabel}>Customer</Text>
            <Text style={styles.transValue}>{order.customer_phone}</Text>
          </View>
        )}
      </View>
      <View style={styles.goldLine} />
      <View style={styles.itemsHeader}>
        <Text style={[styles.itemsHeaderText, { flex: 2 }]}>ITEM</Text>
        <Text style={[styles.itemsHeaderText, { flex: 0.5, textAlign: 'center' }]}>QTY</Text>
        <Text style={[styles.itemsHeaderText, { flex: 1, textAlign: 'right' }]}>PRICE</Text>
        <Text style={[styles.itemsHeaderText, { flex: 1, textAlign: 'right' }]}>AMOUNT</Text>
      </View>
      <View style={styles.dashedLine} />
      {items && items.map((item, index) => (
        <View key={index} style={styles.itemRow}>
          <Text style={[styles.itemName, { flex: 2 }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.itemCell, { flex: 0.5, textAlign: 'center' }]}>
            {item.quantity}
          </Text>
          <Text style={[styles.itemCell, { flex: 1, textAlign: 'right' }]}>
            {parseFloat(item.price).toLocaleString()}
          </Text>
          <Text style={[styles.itemAmount, { flex: 1, textAlign: 'right' }]}>
            {(parseFloat(item.price) * item.quantity).toLocaleString()}
          </Text>
        </View>
      ))}
      <View style={styles.dashedLine} />
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>KES {subtotal.toLocaleString()}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Discount</Text>
          <Text style={styles.totalValue}>KES {discount.toLocaleString()}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax</Text>
          <Text style={styles.totalValue}>KES {tax.toLocaleString()}</Text>
        </View>
      </View>
      <View style={styles.goldLine} />
      <View style={styles.grandTotalSection}>
        <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
        <Text style={styles.grandTotalValue}>KES {grandTotal.toLocaleString()}</Text>
      </View>
      <View style={styles.goldLine} />
      <View style={[
        styles.statusSection,
        { backgroundColor: order.payment_status === 'paid' ? '#D1FAE5' : '#FEF3C7' }
      ]}>
        <Text style={[
          styles.statusText,
          { color: order.payment_status === 'paid' ? '#065F46' : '#92400E' }
        ]}>
          {order.payment_status === 'paid' ? '✓  PAYMENT CONFIRMED' : '⏳  PAYMENT PENDING'}
        </Text>
      </View>
      <View style={styles.loyaltySection}>
        <Text style={styles.loyaltyTitle}>🎯 LOYALTY POINTS</Text>
        <Text style={styles.loyaltyPoints}>
          You earned {Math.floor(grandTotal / 10)} points this transaction
        </Text>
      </View>
      <View style={styles.qrSection}>
        <View style={styles.qrBox}>
          <View style={styles.qrInner}>
            <Text style={styles.qrText}>QR</Text>
          </View>
        </View>
        <Text style={styles.qrLabel}>Scan for digital receipt</Text>
        <Text style={styles.qrSub}>siradify.com/receipt/{order.id}</Text>
      </View>
      <View style={styles.thankyouSection}>
        <Text style={styles.thankyouText}>THANK YOU FOR CHOOSING SIRADIFY</Text>
        <View style={[styles.goldLine, { marginHorizontal: 0, marginVertical: 8 }]} />
        <Text style={styles.sloganText}>FROM VISION TO REALITY</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  receipt: {
    backgroundColor: COLORS.white,
    width: '100%',
    maxWidth: 360,
    borderRadius: 4,
    overflow: 'hidden',
  },
  topAccent: {
    height: 6,
    backgroundColor: COLORS.navy,
  },
  brandSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: COLORS.navy,
  },
  brandLogo: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandLogoText: {
    color: COLORS.navy,
    fontWeight: '800',
    fontSize: 28,
  },
  brandName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 4,
  },
  brandAddress: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginBottom: 2,
  },
  brandPhone: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  goldLine: {
    height: 2,
    backgroundColor: COLORS.gold,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  transactionSection: {
    paddingHorizontal: 16,
    gap: 6,
  },
  transRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transLabel: {
    fontSize: 11,
    color: '#888',
    letterSpacing: 0.5,
  },
  transValue: {
    fontSize: 11,
    color: COLORS.navy,
    fontWeight: '600',
  },
  itemsHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#F8F8F8',
  },
  itemsHeaderText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
  },
  dashedLine: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  itemRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 5,
    alignItems: 'center',
  },
  itemName: {
    fontSize: 12,
    color: COLORS.navy,
    fontWeight: '500',
  },
  itemCell: {
    fontSize: 12,
    color: '#555',
  },
  itemAmount: {
    fontSize: 12,
    color: COLORS.navy,
    fontWeight: '600',
  },
  totalsSection: {
    paddingHorizontal: 16,
    gap: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 11,
    color: '#888',
  },
  totalValue: {
    fontSize: 11,
    color: COLORS.navy,
    fontWeight: '500',
  },
  grandTotalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: 1,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.gold,
  },
  statusSection: {
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loyaltySection: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#FFF8EC',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5A62340',
  },
  loyaltyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  loyaltyPoints: {
    fontSize: 11,
    color: '#666',
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  qrBox: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: COLORS.navy,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    padding: 4,
  },
  qrInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  qrText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: 2,
  },
  qrLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 2,
  },
  qrSub: {
    fontSize: 9,
    color: COLORS.gold,
    fontWeight: '600',
  },
  thankyouSection: {
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  thankyouText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  sloganText: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
  },
})