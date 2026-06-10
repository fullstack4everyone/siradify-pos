import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, Platform
} from 'react-native'
import { COLORS } from '../constants/colors'
import ReceiptCard from '../components/ReceiptCard'

export default function ReceiptScreen({ route, navigation }) {
  const { order, items } = route.params

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
          style={styles.newOrderBtn}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'POS' }] })}
        >
          <Text style={styles.newOrderBtnText}>New Order</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ReceiptCard order={order} items={items} />
      </ScrollView>
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={styles.bottomBtn}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'POS' }] })}
        >
          <Text style={styles.bottomBtnText}>Start New Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
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
  newOrderBtn: {
    borderWidth: 1,
    borderColor: COLORS.gold,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  newOrderBtnText: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  bottomAction: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#F0F0F0',
  },
  bottomBtn: {
    backgroundColor: COLORS.navy,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  bottomBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
})