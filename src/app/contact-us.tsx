import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, HeaderLogo } from '../components/ui';

interface ContactPerson {
  name: string;
  role: string;
  region?: string;
  phone: string;
  email: string;
  initials: string;
}

const CONTACTS: ContactPerson[] = [
  {
    name: 'Abhishek Khaitan',
    role: 'Sales',
    region: 'Kolkata',
    phone: '8884555410',
    email: 'sales@mailinator.com',
    initials: 'AK',
  },
  {
    name: 'Jagdish Khaitan',
    role: 'Operations',
    phone: '8884555410',
    email: 'fittmart-ops2@mailinator.com',
    initials: 'JK',
  },
];

function openLink(url: string, errorMessage: string) {
  Linking.openURL(url).catch(() => {
    if (Platform.OS === 'web') {
      alert(errorMessage);
    } else {
      Alert.alert('Error', errorMessage);
    }
  });
}

function ContactCard({ person }: { person: ContactPerson }) {
  const handleCall = () => {
    openLink(`tel:+91${person.phone}`, 'Unable to open phone dialer.');
  };

  const handleWhatsApp = () => {
    openLink(
      `https://wa.me/91${person.phone}`,
      'Unable to open WhatsApp. Make sure it is installed.'
    );
  };

  const handleEmail = () => {
    openLink(
      `mailto:${person.email}?subject=Fittmart%20Support`,
      'Unable to open email client.'
    );
  };

  const subtitle = person.region
    ? `${person.role} \u2022 ${person.region}`
    : person.role;

  return (
    <Card style={styles.contactCard}>
      <View style={styles.cardContent}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{person.initials}</Text>
        </View>

        {/* Info */}
        <View style={styles.personInfo}>
          <Text style={styles.personName}>{person.name}</Text>
          <Text style={styles.personRole}>{subtitle}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton]}
          onPress={handleCall}
          activeOpacity={0.7}
        >
          <Ionicons name="call-outline" size={20} color="#fff" />
          <Text style={styles.actionTextLight}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.whatsappButton]}
          onPress={handleWhatsApp}
          activeOpacity={0.7}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          <Text style={styles.actionTextLight}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.emailButton]}
          onPress={handleEmail}
          activeOpacity={0.7}
        >
          <Ionicons name="mail-outline" size={20} color="#007AFF" />
          <Text style={styles.actionTextEmail}>Email</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

export default function ContactUsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Contact Us',
          headerShown: true,
          headerBackTitle: 'Back',
          headerTitle: () => <HeaderLogo />,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="headset-outline" size={36} color="#007AFF" />
          </View>
          <Text style={styles.headerTitle}>We're here to help!</Text>
          <Text style={styles.headerSubtitle}>
            Reach out to our team for any queries, orders, or support.
          </Text>
        </View>

        {/* Contact Cards */}
        {CONTACTS.map((person) => (
          <ContactCard key={person.name} person={person} />
        ))}

        {/* Footer Note */}
        <View style={styles.footerSection}>
          <Ionicons
            name="time-outline"
            size={16}
            color="#999"
            style={styles.footerIcon}
          />
          <Text style={styles.footerText}>
            Available Mon - Sat, 9:00 AM - 7:00 PM IST
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  headerIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  // Contact Card
  contactCard: {
    marginBottom: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  personRole: {
    fontSize: 14,
    color: '#666',
  },
  // Action Buttons
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  callButton: {
    backgroundColor: '#007AFF',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  emailButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionTextLight: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  actionTextEmail: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  // Footer
  footerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 16,
  },
  footerIcon: {
    marginRight: 6,
  },
  footerText: {
    fontSize: 13,
    color: '#999',
  },
});
