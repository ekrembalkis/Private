import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { DayEntry } from '../types';
import { STUDENT_INFO, COMPANY_INFO } from '../constants';

// Türkçe font kaydı
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 11,
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
    borderBottom: '2px solid #1e40af',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 5,
  },
  infoBox: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 120,
    color: '#374151',
  },
  infoValue: {
    flex: 1,
    color: '#1f2937',
  },
  dayEntry: {
    marginBottom: 25,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 15,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    backgroundColor: '#1e40af',
    padding: 8,
    borderRadius: 4,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dayDate: {
    fontSize: 11,
    color: '#bfdbfe',
  },
  dayType: {
    fontSize: 10,
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    padding: '3 8',
    borderRadius: 3,
  },
  workTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  content: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#374151',
    textAlign: 'justify',
  },
  imageContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  image: {
    maxWidth: 300,
    maxHeight: 200,
    borderRadius: 5,
    border: '1px solid #d1d5db',
  },
  imageCaption: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 5,
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 10,
    color: '#6b7280',
  },
});

interface StajDefteriPDFProps {
  days: DayEntry[];
}

export const StajDefteriPDF: React.FC<StajDefteriPDFProps> = ({ days }) => {
  const savedDays = days.filter(d => d.isSaved && d.isGenerated);
  
  return (
    <Document>
      {/* Kapak Sayfası */}
      <Page size="A4" style={styles.page}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1e40af', marginBottom: 20 }}>
            STAJ DEFTERİ
          </Text>
          <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 40 }}>
            2. Staj (Üretim/Tasarım/İşletme)
          </Text>
          
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Öğrenci:</Text>
              <Text style={styles.infoValue}>{STUDENT_INFO.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Öğrenci No:</Text>
              <Text style={styles.infoValue}>{STUDENT_INFO.studentId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bölüm:</Text>
              <Text style={styles.infoValue}>{STUDENT_INFO.department}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sınıf:</Text>
              <Text style={styles.infoValue}>{STUDENT_INFO.class}</Text>
            </View>
          </View>
          
          <View style={[styles.infoBox, { marginTop: 20 }]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Firma:</Text>
              <Text style={styles.infoValue}>{COMPANY_INFO.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Adres:</Text>
              <Text style={styles.infoValue}>{COMPANY_INFO.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Faaliyet:</Text>
              <Text style={styles.infoValue}>{COMPANY_INFO.field}</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.footer}>
          Bu belge otomatik olarak oluşturulmuştur.
        </Text>
      </Page>
      
      {/* Günlük Kayıtlar */}
      {savedDays.map((day, index) => (
        <Page key={day.dayNumber} size="A4" style={styles.page}>
          <View style={styles.dayEntry}>
            <View style={styles.dayHeader}>
              <View>
                <Text style={styles.dayNumber}>GÜN {day.dayNumber}</Text>
                <Text style={styles.dayDate}>{day.date}</Text>
              </View>
              <Text style={styles.dayType}>
                {day.type === 'Üretim/Tasarım' ? 'ÜRETİM' : 'İŞLETME'}
              </Text>
            </View>
            
            <Text style={styles.workTitle}>
              {day.workTitle || day.specificTopic}
            </Text>
            
            <Text style={styles.content}>
              {day.content}
            </Text>
            
            {day.imageUrl && (
              <View style={styles.imageContainer}>
                <Image style={styles.image} src={day.imageUrl} />
                {day.visualDescription && (
                  <Text style={styles.imageCaption}>{day.visualDescription}</Text>
                )}
              </View>
            )}
          </View>
          
          <Text style={styles.pageNumber}>
            Sayfa {index + 2}
          </Text>
        </Page>
      ))}
    </Document>
  );
};