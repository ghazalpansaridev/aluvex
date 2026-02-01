import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Card } from '../ui/Card';
import { ItemWithPrice } from '../../lib/api';

interface StockTrackCardProps {
  item: ItemWithPrice;
  stockQuantity: number;
  onStockChange: (newStock: number) => void;
}

export function StockTrackCard({ item, stockQuantity, onStockChange }: StockTrackCardProps) {
  const [localStock, setLocalStock] = useState(stockQuantity.toString());
  const primaryImage = item.images?.[0]?.image_url;
  const hasImage = !!primaryImage;

  const handleIncrement = () => {
    const newStock = stockQuantity + 1;
    onStockChange(newStock);
    setLocalStock(newStock.toString());
  };

  const handleDecrement = () => {
    if (stockQuantity > 0) {
      const newStock = stockQuantity - 1;
      onStockChange(newStock);
      setLocalStock(newStock.toString());
    }
  };

  const handleTextChange = (text: string) => {
    setLocalStock(text);
  };

  const handleBlur = () => {
    const parsed = parseInt(localStock, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onStockChange(parsed);
    } else {
      // Reset to current stock if invalid
      setLocalStock(stockQuantity.toString());
    }
  };

  return (
    <Card padding="none" style={styles.card}>
      <View style={styles.container}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {hasImage ? (
            <Image
              source={{ uri: primaryImage }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>📦</Text>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.stockLabel}>Stock: {stockQuantity}</Text>
        </View>

        {/* Stock Adjustment Section */}
        <View style={styles.adjustmentContainer}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={handleDecrement}
            activeOpacity={0.7}
          >
            <Text style={styles.adjustButtonText}>−</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.stockInput}
            value={localStock}
            onChangeText={handleTextChange}
            onBlur={handleBlur}
            keyboardType="numeric"
            maxLength={5}
          />

          <TouchableOpacity
            style={styles.adjustButton}
            onPress={handleIncrement}
            activeOpacity={0.7}
          >
            <Text style={styles.adjustButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    marginHorizontal: 16,
  },
  container: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  placeholderContainer: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  placeholderText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stockLabel: {
    fontSize: 12,
    color: '#666',
  },
  adjustmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  adjustButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  stockInput: {
    width: 60,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    paddingHorizontal: 8,
  },
});
