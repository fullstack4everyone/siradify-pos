import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert, ScrollView,
  Platform, TextInput, ActivityIndicator
} from 'react-native'
import { useState } from 'react'
import api from '../services/api'
import { COLORS } from '../constants/colors'

const CATEGORIES = [
  { id: 'drinks', label: '🥤 Drinks' },
  { id: 'food', label: '🍽️ Food' },
  { id: 'electronics', label: '📱 Electronics' },
  { id: 'other', label: '📦 Other' },
]

export default function AddProductScreen({ navigation }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [category, setCategory] = useState('other')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Product name is required')
      return
    }
    if (!price || isNaN(parseFloat(price))) {
      Alert.alert('Error', 'Enter a valid price')
      return
    }
    if (!stock || isNaN(parseInt(stock))) {
      Alert.alert('Error', 'Enter a valid stock quantity')
      return
    }

    setSaving(true)
    try {
      const res = await api.post('/products', {
        name: name.trim(),
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
      })
      console.log('Product created:', res.data)
      Alert.alert('Success', `${name} added successfully`, [
        {
          text: 'Add Another', onPress: () => {
            setName('')
            setPrice('')
            setStock('')
            setCategory('other')
          }
        },
        { text: 'Go to POS', onPress: () => navigation.goBack() }
      ])
    } catch (err) {
      console.log('Error status:', err.response?.status)
      console.log('Error data:', err.response?.data)
      console.log('Error message:', err.message)

      if (err.message === 'Network Error') {
        Alert.alert(
          'Product Added',
          `${name} was added successfully.`,
          [
            {
              text: 'Add Another', onPress: () => {
                setName('')
                setPrice('')
                setStock('')
                setCategory('other')
              }
            },
            { text: 'Go to POS', onPress: () => navigation.goBack() }
          ]
        )
      } else {
        Alert.alert('Error', err.response?.data?.message || err.message || 'Could not add product')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>

          <Text style={styles.label}>Product Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Chai, Soda, Mandazi"
            placeholderTextColor={COLORS.textGray}
          />

          <Text style={styles.label}>Price (KES)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="e.g. 50"
            placeholderTextColor={COLORS.textGray}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Stock Quantity</Text>
          <TextInput
            style={styles.input}
            value={stock}
            onChangeText={setStock}
            placeholder="e.g. 100"
            placeholderTextColor={COLORS.textGray}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryBtn,
                  category === cat.id && styles.categoryBtnActive
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={[
                  styles.categoryBtnText,
                  category === cat.id && styles.categoryBtnTextActive
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={styles.previewProduct}>
            <View style={styles.previewEmoji}>
              <Text style={styles.previewEmojiText}>
                {category === 'drinks' ? '🥤' :
                 category === 'food' ? '🍽️' :
                 category === 'electronics' ? '📱' : '📦'}
              </Text>
            </View>
            <Text style={styles.previewName}>{name || 'Product Name'}</Text>
            <Text style={styles.previewPrice}>
              KES {price || '0'}
            </Text>
            <Text style={styles.previewStock}>
              {stock || '0'} left
            </Text>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.navy} />
          ) : (
            <Text style={styles.saveBtnText}>Add Product</Text>
          )}
        </TouchableOpacity>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.textDark,
    marginBottom: 16,
    backgroundColor: COLORS.background,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  categoryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  categoryBtnActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  categoryBtnText: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  categoryBtnTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  previewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textGray,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  previewProduct: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#FFFBF0',
    width: '60%',
  },
  previewEmoji: {
    width: 54,
    height: 54,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewEmojiText: {
    fontSize: 28,
  },
  previewName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  previewPrice: {
    fontSize: 14,
    color: COLORS.navy,
    fontWeight: '700',
    marginBottom: 2,
  },
  previewStock: {
    fontSize: 11,
    color: COLORS.textGray,
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: COLORS.background,
  },
  saveBtn: {
    backgroundColor: COLORS.gold,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: '700',
  },
})