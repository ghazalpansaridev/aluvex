import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../components/ui';
import { RegistrationFormData } from '../../../types';

interface DocumentFile {
  type: 'pan' | 'gst' | 'other';
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
}

interface StepDocumentsProps {
  formData: Partial<RegistrationFormData>;
  updateFormData: (data: Partial<RegistrationFormData>) => void;
  onNext: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export default function StepDocuments({
  formData,
  updateFormData,
  onNext,
  error,
  setError,
}: StepDocumentsProps) {
  const existingDocs = (formData.documents || []) as DocumentFile[];
  const [panDoc, setPanDoc] = useState<DocumentFile | null>(
    existingDocs.find((d) => d.type === 'pan') || null
  );
  const [gstDoc, setGstDoc] = useState<DocumentFile | null>(
    existingDocs.find((d) => d.type === 'gst') || null
  );

  const pickImage = async (docType: 'pan' | 'gst') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload documents.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName =
          asset.fileName || `${docType}_${Date.now()}.${asset.uri.split('.').pop()}`;
        const doc: DocumentFile = {
          type: docType,
          uri: asset.uri,
          fileName,
          mimeType: asset.mimeType || 'image/jpeg',
          fileSize: asset.fileSize,
        };

        if (docType === 'pan') {
          setPanDoc(doc);
        } else {
          setGstDoc(doc);
        }
        updateDocuments(docType === 'pan' ? doc : panDoc, docType === 'gst' ? doc : gstDoc);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const pickDocument = async (docType: 'pan' | 'gst') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const doc: DocumentFile = {
          type: docType,
          uri: asset.uri,
          fileName: asset.name,
          mimeType: asset.mimeType || 'application/pdf',
          fileSize: asset.size,
        };

        if (docType === 'pan') {
          setPanDoc(doc);
        } else {
          setGstDoc(doc);
        }
        updateDocuments(docType === 'pan' ? doc : panDoc, docType === 'gst' ? doc : gstDoc);
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const showPickerOptions = (docType: 'pan' | 'gst') => {
    if (Platform.OS === 'web') {
      pickDocument(docType);
      return;
    }

    Alert.alert('Upload Document', 'Choose an option', [
      { text: 'Camera Roll', onPress: () => pickImage(docType) },
      { text: 'Browse Files', onPress: () => pickDocument(docType) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeDocument = (docType: 'pan' | 'gst') => {
    if (docType === 'pan') {
      setPanDoc(null);
      updateDocuments(null, gstDoc);
    } else {
      setGstDoc(null);
      updateDocuments(panDoc, null);
    }
  };

  const updateDocuments = (pan: DocumentFile | null, gst: DocumentFile | null) => {
    const docs: DocumentFile[] = [];
    if (pan) docs.push(pan);
    if (gst) docs.push(gst);
    updateFormData({ documents: docs.length > 0 ? docs : undefined });
  };

  const handleNext = () => {
    setError(null);
    onNext();
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Documents</Text>
      <Text style={styles.subtitle}>
        Upload your PAN and GST documents for verification. This step is optional
        — you can skip and submit them later.
      </Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* PAN Card Upload */}
      <Text style={styles.docLabel}>PAN Card</Text>
      {panDoc ? (
        <View style={styles.previewCard}>
          {isImage(panDoc.mimeType) ? (
            <Image source={{ uri: panDoc.uri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.pdfPreview}>
              <Ionicons name="document-outline" size={40} color="#007AFF" />
              <Text style={styles.pdfLabel}>PDF Document</Text>
            </View>
          )}
          <View style={styles.previewInfo}>
            <Text style={styles.previewFileName} numberOfLines={1}>
              {panDoc.fileName}
            </Text>
            {panDoc.fileSize && (
              <Text style={styles.previewFileSize}>
                {(panDoc.fileSize / 1024).toFixed(1)} KB
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeDocument('pan')}
          >
            <Ionicons name="close-circle" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadSlot}
          onPress={() => showPickerOptions('pan')}
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-upload-outline" size={32} color="#007AFF" />
          <Text style={styles.uploadText}>Tap to upload PAN Card</Text>
          <Text style={styles.uploadHint}>Image or PDF, max 10MB</Text>
        </TouchableOpacity>
      )}

      {/* GST Certificate Upload */}
      <Text style={styles.docLabel}>GST Certificate</Text>
      {gstDoc ? (
        <View style={styles.previewCard}>
          {isImage(gstDoc.mimeType) ? (
            <Image source={{ uri: gstDoc.uri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.pdfPreview}>
              <Ionicons name="document-outline" size={40} color="#007AFF" />
              <Text style={styles.pdfLabel}>PDF Document</Text>
            </View>
          )}
          <View style={styles.previewInfo}>
            <Text style={styles.previewFileName} numberOfLines={1}>
              {gstDoc.fileName}
            </Text>
            {gstDoc.fileSize && (
              <Text style={styles.previewFileSize}>
                {(gstDoc.fileSize / 1024).toFixed(1)} KB
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeDocument('gst')}
          >
            <Ionicons name="close-circle" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadSlot}
          onPress={() => showPickerOptions('gst')}
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-upload-outline" size={32} color="#007AFF" />
          <Text style={styles.uploadText}>Tap to upload GST Certificate</Text>
          <Text style={styles.uploadHint}>Image or PDF, max 10MB</Text>
        </TouchableOpacity>
      )}

      <Button
        title={panDoc || gstDoc ? 'Next' : 'Skip'}
        onPress={handleNext}
        fullWidth
        style={styles.nextButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
  },
  docLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 8,
  },
  uploadSlot: {
    borderWidth: 2,
    borderColor: '#d0d5dd',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 8,
  },
  uploadHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  pdfPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfLabel: {
    fontSize: 8,
    color: '#007AFF',
    marginTop: 2,
  },
  previewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  previewFileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  previewFileSize: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  nextButton: {
    marginTop: 24,
  },
});
