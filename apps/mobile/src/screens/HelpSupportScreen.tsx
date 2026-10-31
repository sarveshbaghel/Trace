import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { theme } from '../theme';

interface HelpSupportScreenProps {
  navigation: any;
}

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'How do I report a civic issue?',
    answer:
      'Tap the "+" or Report button on the home screen. Take a photo of the incident, select the issue category (e.g., Pothole, Garbage, Streetlight), describe the problem, and verify your GPS location before tapping "Submit Report".',
  },
  {
    question: 'How does AI integrity verification work?',
    answer:
      'Trace uses deep learning computer vision algorithms to evaluate each uploaded image. The AI checks for digital manipulation, synthetic generation artifacts, and duplicate reports in the same geographic radius to prevent spam and fraudulent claims.',
  },
  {
    question: 'Why is my location needed?',
    answer:
      'Exact GPS coordinates allow municipal road and sanitation crews to locate the defect accurately on city mapping systems without ambiguity. Location is only accessed during report creation.',
  },
  {
    question: 'How long does resolution take?',
    answer:
      'Resolution times depend on severity and your municipality\'s SLA (Service Level Agreement). Potholes and streetlights are typically attended to within 48 to 72 hours. You can monitor the status live on the app.',
  },
  {
    question: 'What is public escalation to X (Twitter)?',
    answer:
      'When an issue remains unaddressed or is marked for urgent intervention, Trace can broadcast the geo-tagged report to verified city corporation handles on X, ensuring public accountability.',
  },
];

export const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ navigation }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@trace.app?subject=Trace App Assistance').catch(() => {
      Alert.alert('Contact Support', 'Please send an email to support@trace.app');
    });
  };

  const handleCallHelpline = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert('Helpline', `Unable to place call to ${number}`);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Support Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconBadge}>
            <Text style={styles.heroIcon}>🎧</Text>
          </View>
          <Text style={styles.heroTitle}>How can we assist you?</Text>
          <Text style={styles.heroSubtitle}>
            Our civic support team is dedicated to helping you resolve community issues.
          </Text>
        </View>

        {/* Contact Options */}
        <Text style={styles.sectionHeader}>Quick Assistance</Text>

        <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport}>
          <View style={[styles.contactIconBg, { backgroundColor: '#EFF6FF' }]}>
            <Text style={styles.contactIcon}>✉️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Email Civic Support</Text>
            <Text style={styles.contactDesc}>support@trace.app • 24hr response</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => handleCallHelpline('1913')}
        >
          <View style={[styles.contactIconBg, { backgroundColor: '#ECFDF5' }]}>
            <Text style={styles.contactIcon}>📞</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Municipal Grievance Helpline</Text>
            <Text style={styles.contactDesc}>Toll-free 1913 • Corporation Operations</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => handleCallHelpline('112')}
        >
          <View style={[styles.contactIconBg, { backgroundColor: '#FEF2F2' }]}>
            <Text style={styles.contactIcon}>🚨</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Emergency Services</Text>
            <Text style={styles.contactDesc}>Dial 112 for urgent public hazards</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* FAQ Section */}
        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Frequently Asked Questions</Text>

        {FAQS.map((faq, index) => {
          const isOpen = expandedIndex === index;
          return (
            <View key={index} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => toggleFaq(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Text style={styles.faqToggleIcon}>{isOpen ? '−' : '+'}</Text>
              </TouchableOpacity>
              {isOpen && (
                <View style={styles.faqBody}>
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  backButtonText: {
    fontSize: 24,
    color: theme.colors.text,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
  heroCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  heroIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroIcon: {
    fontSize: 26,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  contactIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactIcon: {
    fontSize: 20,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  contactDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  faqCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginRight: 12,
  },
  faqToggleIcon: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  faqBody: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  faqAnswer: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    paddingTop: 8,
  },
});
