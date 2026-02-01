import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ShipmentWithItems } from '../../types/database';
import { formatPrice } from '../../lib/utils';
import { Badge } from '../ui';

interface ShipmentHistoryItemProps {
  shipment: ShipmentWithItems;
  onDownloadInvoice?: () => void;
}

export default function ShipmentHistoryItem({
  shipment,
  onDownloadInvoice,
}: ShipmentHistoryItemProps) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateTotal = () => {
    const itemsTotal = shipment.items?.reduce(
      (sum, item) => sum + item.line_total,
      0
    ) || 0;
    return itemsTotal + shipment.freight_charge;
  };

  return (
    <View style={styles.container}>
      {/* Shipment Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.shipmentNumber}>{shipment.shipment_number}</Text>
          <Text style={styles.shipmentDate}>{formatDate(shipment.created_at)}</Text>
        </View>
        <View style={styles.headerRight}>
          <Badge label="SHIPPED" variant="success" size="sm" />
          <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Details */}
      {expanded && (
        <View style={styles.details}>
          {/* Items List */}
          <Text style={styles.sectionTitle}>Shipped Items</Text>
          {shipment.items?.map((item, index) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemQuantity}>×{item.quantity}</Text>
                <Text style={styles.itemPrice}>{formatPrice(item.unit_price)}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatPrice(item.line_total)}</Text>
            </View>
          ))}

          {/* Totals */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Freight Charges:</Text>
              <Text style={styles.totalValue}>
                {formatPrice(shipment.freight_charge)}
              </Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Shipment Total:</Text>
              <Text style={styles.grandTotalValue}>
                {formatPrice(calculateTotal())}
              </Text>
            </View>
          </View>

          {/* Invoice */}
          {shipment.invoice_number && (
            <View style={styles.invoiceContainer}>
              <View style={styles.invoiceInfo}>
                <Text style={styles.invoiceLabel}>Invoice Number:</Text>
                <Text style={styles.invoiceNumber}>{shipment.invoice_number}</Text>
              </View>
              {onDownloadInvoice && (
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={onDownloadInvoice}
                  activeOpacity={0.7}
                >
                  <Text style={styles.downloadButtonText}>📥 Download</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Notes */}
          {shipment.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{shipment.notes}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flex: 1,
  },
  shipmentNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  shipmentDate: {
    fontSize: 13,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expandIcon: {
    fontSize: 12,
    color: '#666',
  },
  details: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  totalsContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  invoiceContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  downloadButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffe066',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
