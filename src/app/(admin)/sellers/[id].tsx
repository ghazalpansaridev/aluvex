import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { HeaderLogo } from '../../../components/ui/HeaderLogo';
import { useRetailer } from '../../../hooks/useRetailers';
import { useAuth } from '../../../lib/auth-context';
import {
  updateRetailer,
  approveRetailer,
  rejectRetailer,
  getDocumentSignedUrl,
} from '../../../lib/retailers.api';
import { RetailerWithEmail, RetailerStatus, BusinessType } from '../../../types/database';

const BUSINESS_TYPES: { label: string; value: string }[] = [
  { label: 'Trader', value: 'Trader' },
  { label: 'Fabricator', value: 'Fabricator' },
  { label: 'Builder', value: 'Builder' },
  { label: 'Architect', value: 'Architect' },
  { label: 'Other', value: 'Other' },
];

const STATUS_BANNER: Record<RetailerStatus, { bg: string; text: string; icon: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E', icon: 'time-outline' },
  approved: { bg: '#D1FAE5', text: '#065F46', icon: 'checkmark-circle-outline' },
  rejected: { bg: '#FEE2E2', text: '#991B1B', icon: 'close-circle-outline' },
};

export default function SellerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { retailer, loading, error, refetch } = useRetailer(id || null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<RetailerWithEmail>>({});

  // Approval flow state
  const [showApprovalSection, setShowApprovalSection] = useState(false);
  const [assignCredit, setAssignCredit] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [approving, setApproving] = useState(false);

  // Rejection flow state
  const [showRejectSection, setShowRejectSection] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);

  // Document signed URLs
  const [docUrls, setDocUrls] = useState<Record<string, string>>({});
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Load document signed URLs
  useEffect(() => {
    if (retailer?.documents && retailer.documents.length > 0) {
      loadDocumentUrls();
    }
  }, [retailer?.documents]);

  const loadDocumentUrls = async () => {
    if (!retailer?.documents) return;
    setLoadingDocs(true);
    const urls: Record<string, string> = {};
    for (const doc of retailer.documents) {
      const { url } = await getDocumentSignedUrl(doc.file_url);
      if (url) {
        urls[doc.id] = url;
      }
    }
    setDocUrls(urls);
    setLoadingDocs(false);
  };

  // Enter edit mode
  const handleStartEdit = () => {
    if (!retailer) return;
    setEditData({
      business_name: retailer.business_name,
      business_type: retailer.business_type,
      gst_number: retailer.gst_number || '',
      pan_number: retailer.pan_number,
      business_address: retailer.business_address,
      pincode: retailer.pincode,
      city: retailer.city,
      state: retailer.state,
      owner_name: retailer.owner_name,
      owner_dob: retailer.owner_dob || '',
      owner_phone: retailer.owner_phone,
      alternate_phone: retailer.alternate_phone || '',
      credit_limit: retailer.credit_limit,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handleSaveEdit = async () => {
    if (!retailer) return;
    setSaving(true);
    try {
      const { error: updateError } = await updateRetailer(retailer.id, editData);
      if (updateError) {
        Alert.alert('Error', updateError);
        return;
      }
      Alert.alert('Success', 'Seller details updated successfully');
      setIsEditing(false);
      setEditData({});
      refetch();
    } catch (err) {
      Alert.alert('Error', 'Failed to update seller details');
    } finally {
      setSaving(false);
    }
  };

  // Approval flow
  const handleApprovePress = () => {
    setShowApprovalSection(true);
    setShowRejectSection(false);
  };

  const handleConfirmApproval = async () => {
    if (!retailer || !user) return;
    setApproving(true);
    try {
      const credit = assignCredit && creditAmount ? parseFloat(creditAmount) : undefined;
      if (assignCredit && creditAmount && isNaN(credit!)) {
        Alert.alert('Error', 'Please enter a valid credit amount');
        setApproving(false);
        return;
      }

      Alert.alert(
        'Confirm Approval',
        `Are you sure you want to approve ${retailer.business_name}?${
          credit ? `\n\nCredit limit: ₹${credit.toLocaleString('en-IN')}` : ''
        }`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setApproving(false) },
          {
            text: 'Approve',
            onPress: async () => {
              const { error: approveError } = await approveRetailer(
                retailer.id,
                user.id,
                credit
              );
              if (approveError) {
                Alert.alert('Error', approveError);
                setApproving(false);
                return;
              }
              Alert.alert('Success', 'Seller has been approved', [
                { text: 'OK', onPress: () => { refetch(); setShowApprovalSection(false); } },
              ]);
              setApproving(false);
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to approve seller');
      setApproving(false);
    }
  };

  // Rejection flow
  const handleRejectPress = () => {
    setShowRejectSection(true);
    setShowApprovalSection(false);
  };

  const handleConfirmRejection = async () => {
    if (!retailer || !user) return;
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }
    setRejecting(true);
    try {
      Alert.alert(
        'Confirm Rejection',
        `Are you sure you want to reject ${retailer.business_name}?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setRejecting(false) },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: async () => {
              const { error: rejectError } = await rejectRetailer(
                retailer.id,
                user.id,
                rejectionReason.trim()
              );
              if (rejectError) {
                Alert.alert('Error', rejectError);
                setRejecting(false);
                return;
              }
              Alert.alert('Success', 'Seller has been rejected', [
                { text: 'OK', onPress: () => { refetch(); setShowRejectSection(false); } },
              ]);
              setRejecting(false);
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to reject seller');
      setRejecting(false);
    }
  };

  const handleDocPress = async (url: string, mimeType?: string) => {
    try {
      if (mimeType?.startsWith('image/')) {
        // For images, we could open in a full-screen viewer
        // For now, open in browser
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open document');
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === null || amount === undefined) return 'Not assigned';
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !retailer) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerShown: true, title: 'Seller Details', headerTitle: () => <HeaderLogo /> }} />
        <Text style={styles.errorText}>{error || 'Seller not found'}</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  const bannerConfig = STATUS_BANNER[retailer.status];
  const availableCredit =
    retailer.credit_limit != null
      ? retailer.credit_limit - (retailer.outstanding_dues || 0)
      : null;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: isEditing ? 'Edit Seller' : 'Seller Details',
          headerTitle: () => <HeaderLogo />,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                if (isEditing) {
                  handleCancelEdit();
                } else {
                  router.back();
                }
              }}
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: bannerConfig.bg }]}>
          <Ionicons name={bannerConfig.icon as any} size={20} color={bannerConfig.text} />
          <Text style={[styles.statusBannerText, { color: bannerConfig.text }]}>
            {retailer.status === 'pending'
              ? 'Pending Verification'
              : retailer.status === 'approved'
              ? 'Approved Seller'
              : 'Rejected Application'}
          </Text>
          {retailer.retailer_code && (
            <Text style={[styles.retailerCode, { color: bannerConfig.text }]}>
              {retailer.retailer_code}
            </Text>
          )}
        </View>

        {/* Section 1: Business Details */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Business Details</Text>

          {isEditing ? (
            <>
              <Input
                label="Business Name"
                value={editData.business_name || ''}
                onChangeText={(v) => setEditData({ ...editData, business_name: v })}
                required
              />
              <Select
                label="Business Type"
                value={editData.business_type || ''}
                options={BUSINESS_TYPES}
                onChange={(v) => setEditData({ ...editData, business_type: v as BusinessType })}
                required
              />
              <Input
                label="GST Number"
                value={editData.gst_number || ''}
                onChangeText={(v) => setEditData({ ...editData, gst_number: v.toUpperCase() })}
                maxLength={15}
                autoCapitalize="characters"
              />
              <Input
                label="PAN Number"
                value={editData.pan_number || ''}
                onChangeText={(v) => setEditData({ ...editData, pan_number: v.toUpperCase() })}
                maxLength={10}
                autoCapitalize="characters"
                required
              />
              <Input
                label="Business Address"
                value={editData.business_address || ''}
                onChangeText={(v) => setEditData({ ...editData, business_address: v })}
                multiline
                numberOfLines={3}
                required
              />
              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Input
                    label="Pincode"
                    value={editData.pincode || ''}
                    onChangeText={(v) => setEditData({ ...editData, pincode: v })}
                    keyboardType="numeric"
                    maxLength={6}
                    required
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label="City"
                    value={editData.city || ''}
                    onChangeText={(v) => setEditData({ ...editData, city: v })}
                    required
                  />
                </View>
              </View>
              <Input
                label="State"
                value={editData.state || ''}
                onChangeText={(v) => setEditData({ ...editData, state: v })}
                required
              />
            </>
          ) : (
            <>
              <DetailRow label="Retailer Code" value={retailer.retailer_code || 'N/A'} />
              <DetailRow label="Business Name" value={retailer.business_name} />
              <DetailRow label="Business Type" value={retailer.business_type} />
              <DetailRow label="GST Number" value={retailer.gst_number || 'Not provided'} />
              <DetailRow label="PAN Number" value={retailer.pan_number} />
              <DetailRow label="Business Address" value={retailer.business_address} />
              <DetailRow label="Pincode" value={retailer.pincode} />
              <DetailRow label="City" value={retailer.city} />
              <DetailRow label="State" value={retailer.state} />
            </>
          )}
        </Card>

        {/* Section 2: Owner Details */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Owner Details</Text>

          {isEditing ? (
            <>
              <Input
                label="Owner Name"
                value={editData.owner_name || ''}
                onChangeText={(v) => setEditData({ ...editData, owner_name: v })}
                required
              />
              <Input
                label="Date of Birth"
                value={editData.owner_dob || ''}
                onChangeText={(v) => setEditData({ ...editData, owner_dob: v })}
                placeholder="YYYY-MM-DD"
              />
              <Input
                label="Phone"
                value={editData.owner_phone || ''}
                onChangeText={(v) => setEditData({ ...editData, owner_phone: v })}
                keyboardType="numeric"
                maxLength={10}
                required
              />
              <Input
                label="Alternate Phone"
                value={editData.alternate_phone || ''}
                onChangeText={(v) => setEditData({ ...editData, alternate_phone: v })}
                keyboardType="numeric"
                maxLength={10}
              />
            </>
          ) : (
            <>
              <DetailRow label="Owner Name" value={retailer.owner_name} />
              <DetailRow label="Date of Birth" value={retailer.owner_dob || 'Not provided'} />
              <DetailRow label="Phone" value={retailer.owner_phone} />
              <DetailRow
                label="Alternate Phone"
                value={retailer.alternate_phone || 'Not provided'}
              />
              <DetailRow label="Email" value={retailer.email || 'N/A'} />
            </>
          )}
        </Card>

        {/* Section 3: Documents */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>

          {loadingDocs ? (
            <ActivityIndicator size="small" color="#007AFF" style={styles.docsLoader} />
          ) : retailer.documents && retailer.documents.length > 0 ? (
            <View style={styles.docsGrid}>
              {retailer.documents.map((doc) => {
                const url = docUrls[doc.id];
                const isImage = doc.mime_type?.startsWith('image/');
                return (
                  <TouchableOpacity
                    key={doc.id}
                    style={styles.docCard}
                    onPress={() => url && handleDocPress(url, doc.mime_type || undefined)}
                    activeOpacity={0.7}
                  >
                    {isImage && url ? (
                      <Image source={{ uri: url }} style={styles.docImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.docIconContainer}>
                        <Ionicons name="document-outline" size={32} color="#007AFF" />
                      </View>
                    )}
                    <Text style={styles.docType}>
                      {doc.document_type.toUpperCase()} Document
                    </Text>
                    <Text style={styles.docName} numberOfLines={1}>
                      {doc.file_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noDocsText}>No documents uploaded</Text>
          )}
        </Card>

        {/* Section 4: Credit & Payment (for approved sellers or edit mode) */}
        {(retailer.status === 'approved' || isEditing) && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Credit & Payment</Text>

            {isEditing ? (
              <Input
                label="Credit Limit (₹)"
                value={editData.credit_limit?.toString() || ''}
                onChangeText={(v) =>
                  setEditData({
                    ...editData,
                    credit_limit: v ? parseFloat(v) : undefined,
                  })
                }
                keyboardType="numeric"
                placeholder="Enter credit limit"
              />
            ) : (
              <>
                <DetailRow
                  label="Credit Limit"
                  value={formatCurrency(retailer.credit_limit)}
                  highlight={retailer.credit_limit != null}
                />
                <DetailRow
                  label="Outstanding Dues"
                  value={formatCurrency(retailer.outstanding_dues)}
                  highlight={(retailer.outstanding_dues || 0) > 0}
                  highlightColor="#EF4444"
                />
                {availableCredit !== null && (
                  <DetailRow
                    label="Available Credit"
                    value={formatCurrency(availableCredit)}
                    highlight={availableCredit > 0}
                    highlightColor="#10B981"
                  />
                )}
              </>
            )}
          </Card>
        )}

        {/* Section 5: Application Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Application Info</Text>
          <DetailRow label="Applied On" value={formatDate(retailer.created_at)} />
          <DetailRow
            label="Applied By"
            value={retailer.created_by ? 'Sales Person' : 'Self Registration'}
          />
          {retailer.approved_at && (
            <DetailRow
              label={retailer.status === 'rejected' ? 'Rejected On' : 'Approved On'}
              value={formatDate(retailer.approved_at)}
            />
          )}
          {retailer.rejection_reason && (
            <DetailRow
              label="Rejection Reason"
              value={retailer.rejection_reason}
              highlightColor="#EF4444"
              highlight
            />
          )}
        </Card>

        {/* Approval Section (inline, shown on Approve click) */}
        {showApprovalSection && retailer.status === 'pending' && (
          <Card style={[styles.section, styles.approvalCard]}>
            <Text style={styles.sectionTitle}>Approve Seller</Text>

            {/* Credit line checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                setAssignCredit(!assignCredit);
                if (assignCredit) setCreditAmount('');
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, assignCredit && styles.checkboxChecked]}>
                {assignCredit && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Assign credit line to this seller</Text>
            </TouchableOpacity>

            {assignCredit && (
              <Input
                label="Credit Amount (₹)"
                value={creditAmount}
                onChangeText={setCreditAmount}
                keyboardType="numeric"
                placeholder="Enter credit limit amount"
                containerStyle={styles.creditInput}
              />
            )}

            <View style={styles.approvalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowApprovalSection(false);
                  setAssignCredit(false);
                  setCreditAmount('');
                }}
                variant="outline"
                style={styles.actionButtonHalf}
              />
              <Button
                title="Confirm Approval"
                onPress={handleConfirmApproval}
                loading={approving}
                style={[styles.actionButtonHalf, { backgroundColor: '#10B981' }]}
              />
            </View>
          </Card>
        )}

        {/* Rejection Section (inline, shown on Reject click) */}
        {showRejectSection && retailer.status === 'pending' && (
          <Card style={[styles.section, styles.rejectCard]}>
            <Text style={styles.sectionTitle}>Reject Application</Text>

            <Input
              label="Rejection Reason"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter reason for rejection..."
              multiline
              numberOfLines={4}
              required
            />

            <View style={styles.approvalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowRejectSection(false);
                  setRejectionReason('');
                }}
                variant="outline"
                style={styles.actionButtonHalf}
              />
              <Button
                title="Confirm Rejection"
                onPress={handleConfirmRejection}
                loading={rejecting}
                variant="destructive"
                style={styles.actionButtonHalf}
              />
            </View>
          </Card>
        )}

        {/* Bottom spacer for footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Footer Actions */}
      <View style={styles.footer}>
        {isEditing ? (
          <View style={styles.footerButtons}>
            <Button
              title="Cancel"
              onPress={handleCancelEdit}
              variant="outline"
              style={styles.actionButtonHalf}
              disabled={saving}
            />
            <Button
              title="Save Changes"
              onPress={handleSaveEdit}
              loading={saving}
              style={styles.actionButtonHalf}
            />
          </View>
        ) : retailer.status === 'pending' && !showApprovalSection && !showRejectSection ? (
          <View style={styles.footerButtons}>
            <Button
              title="Reject"
              onPress={handleRejectPress}
              variant="destructive"
              style={styles.actionButtonHalf}
            />
            <Button
              title="Approve"
              onPress={handleApprovePress}
              style={[styles.actionButtonHalf, { backgroundColor: '#10B981' }]}
            />
          </View>
        ) : retailer.status === 'approved' ? (
          <Button
            title="Edit Details"
            onPress={handleStartEdit}
            fullWidth
          />
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Detail Row Component ─────────────────────────────────────────
function DetailRow({
  label,
  value,
  highlight,
  highlightColor,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  highlightColor?: string;
}) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text
        style={[
          detailStyles.value,
          highlight && { fontWeight: '700', color: highlightColor || '#007AFF' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    flex: 1.5,
    fontSize: 14,
    color: '#1a1a1a',
  },
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#991B1B',
    textAlign: 'center',
  },
  headerButton: {
    paddingRight: 16,
  },
  // Status Banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  statusBannerText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  retailerCode: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Section Cards
  section: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  // Edit mode
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  // Documents
  docsLoader: {
    paddingVertical: 20,
  },
  docsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  docCard: {
    width: '47%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  docImage: {
    width: '100%',
    height: 100,
  },
  docIconContainer: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f9ff',
  },
  docType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  docName: {
    fontSize: 11,
    color: '#999',
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  noDocsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  // Approval section
  approvalCard: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  rejectCard: {
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  creditInput: {
    marginTop: 4,
  },
  approvalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonHalf: {
    flex: 1,
  },
});
