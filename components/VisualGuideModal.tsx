
// components/VisualGuideModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  getVisualGuide, 
  enrichVisualGuideWithAI,
  getTypeIcon,
  getTypeLabel,
  VisualGuide,
  VisualSuggestion
} from '../services/visualGuideService';

interface VisualGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  dayNumber: number;
}

export const VisualGuideModal: React.FC<VisualGuideModalProps> = ({
  isOpen,
  onClose,
  topic,
  dayNumber
}) => {
  const [guide, setGuide] = useState<VisualGuide | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [copiedTerm, setCopiedTerm] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && topic) {
      // Statik rehberi yükle
      const baseGuide = getVisualGuide(topic);
      setGuide(baseGuide);
      setAiSuggestions([]);
      
      // AI ile zenginleştir
      loadAISuggestions(topic, baseGuide);
    }
  }, [isOpen, topic]);

  const loadAISuggestions = async (topicText: string, baseGuide: VisualGuide) => {
    setIsLoadingAI(true);
    try {
      const suggestions = await enrichVisualGuideWithAI(topicText, baseGuide);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('AI suggestions failed:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTerm(text);
    setTimeout(() => setCopiedTerm(null), 2000);
  };

  if (!isOpen || !guide) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                📸 Görsel Rehberi
              </h2>
              <p style={{ margin: '8px 0 0', fontSize: '14px', opacity: 0.9 }}>
                Gün {dayNumber}: {topic}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          
          {/* Önerilen Görseller */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              margin: '0 0 12px', 
              fontSize: '15px', 
              fontWeight: '600',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ✅ Önerilen Görseller
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {guide.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  style={{
                    padding: '14px 16px',
                    background: '#f9fafb',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ 
                      fontSize: '24px',
                      width: '40px',
                      height: '40px',
                      background: 'white',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e5e7eb'
                    }}>
                      {getTypeIcon(suggestion.type)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                          {suggestion.title}
                        </h4>
                        <span style={{
                          padding: '2px 8px',
                          background: '#e0e7ff',
                          color: '#4338ca',
                          borderRadius: '10px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>
                          {getTypeLabel(suggestion.type)}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#6b7280' }}>
                        {suggestion.description}
                      </p>
                      
                      {/* Arama Terimleri */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                        {suggestion.searchTerms.map((term, i) => (
                          <button
                            key={i}
                            onClick={() => copyToClipboard(term)}
                            style={{
                              padding: '4px 10px',
                              background: copiedTerm === term ? '#22c55e' : '#dbeafe',
                              color: copiedTerm === term ? 'white' : '#1e40af',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.2s'
                            }}
                            title="Kopyalamak için tıkla"
                          >
                            🔍 {term}
                            {copiedTerm === term && ' ✓'}
                          </button>
                        ))}
                      </div>
                      
                      {/* Kaynaklar */}
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                        📍 Kaynak: {suggestion.sources.join(' • ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Ek Önerileri */}
          {(isLoadingAI || aiSuggestions.length > 0) && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                margin: '0 0 12px', 
                fontSize: '15px', 
                fontWeight: '600',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🤖 AI Ek Önerileri
                {isLoadingAI && (
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '400' }}>
                    yükleniyor...
                  </span>
                )}
              </h3>
              
              {aiSuggestions.length > 0 && (
                <div style={{
                  padding: '14px 16px',
                  background: '#f0fdf4',
                  borderRadius: '10px',
                  border: '1px solid #bbf7d0'
                }}>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {aiSuggestions.map((suggestion, index) => (
                      <li key={index} style={{ 
                        fontSize: '13px', 
                        color: '#166534',
                        marginBottom: index < aiSuggestions.length - 1 ? '8px' : 0
                      }}>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* İpuçları */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              margin: '0 0 12px', 
              fontSize: '15px', 
              fontWeight: '600',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              💡 İpuçları
            </h3>
            <div style={{
              padding: '14px 16px',
              background: '#fffbeb',
              borderRadius: '10px',
              border: '1px solid #fde68a'
            }}>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {guide.tips.map((tip, index) => (
                  <li key={index} style={{ 
                    fontSize: '13px', 
                    color: '#92400e',
                    marginBottom: index < guide.tips.length - 1 ? '6px' : 0
                  }}>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Kaçınılacaklar */}
          <div>
            <h3 style={{ 
              margin: '0 0 12px', 
              fontSize: '15px', 
              fontWeight: '600',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚠️ Kaçınılacaklar
            </h3>
            <div style={{
              padding: '14px 16px',
              background: '#fef2f2',
              borderRadius: '10px',
              border: '1px solid #fecaca'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {guide.avoid.map((item, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 12px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      borderRadius: '8px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    ✗ {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Video İpucu */}
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
            borderRadius: '10px',
            border: '1px solid #e9d5ff'
          }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#7c3aed' }}>
              📺 Video İpucu
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b21a8' }}>
              YouTube'da "<strong>{topic}</strong>" veya "<strong>{guide.suggestions[0]?.searchTerms[0] || 'elektrik'}</strong>" 
              aratarak eğitim videolarından ekran görüntüsü alabilirsin. 
              Özgün ve kaliteli görseller için en iyi yöntem!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
            Arama terimlerine tıklayarak kopyalayabilirsin
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisualGuideModal;
