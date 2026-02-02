import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { notificationsApi } from '../../lib/notifications.api';

interface Props {
  visible: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
}

export const SendNotificationModal: React.FC<Props> = ({ visible, onClose, recipientId, recipientName }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please enter both title and message');
      return;
    }

    setSending(true);
    try {
      await notificationsApi.sendNotificationWithPush({
        userId: recipientId,
        type: 'custom',
        title: title.trim(),
        body: message.trim(),
      });

      Alert.alert('Success', 'Notification sent successfully');
      setTitle('');
      setMessage('');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Send Notification to {recipientName}</Text>

          <TextInput
            style={styles.input}
            placeholder="Title (max 200 chars)"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Message (max 500 chars)"
            value={message}
            onChangeText={setMessage}
            maxLength={500}
            multiline
            numberOfLines={4}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={sending}
            >
              <Text style={styles.sendText}>{sending ? 'Sending...' : 'Send'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  sendButton: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
});
