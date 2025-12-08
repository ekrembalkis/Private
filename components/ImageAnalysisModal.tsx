// components/ImageAnalysisModal.tsx
import React, { useState, useRef } from 'react';
import { 
  analyzeImage, 
  searchYouTubeVideos, 
  generateSourceRecommendations,
  fileToBase64,
  ImageAnalysisResult,
  VideoRecommendation,
  SourceRecommendation
} from '../services/imageAnalysisService';

interface ImageAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseImage: (result: ImageAnalysisResult, imageUrl: string) => void;
  dayNumber: number;
}

export const ImageAnalysisModal: React.FC<ImageAnalysisModalProps> = ({
  isOpen,
  onClose,
  onUseImage,
  dayNumber
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [thinkingText, setThinkingText] = useState<string>('');
  const [showThinking, setShowThinking] = useState(true);
  const [videos, setVideos] = useState<VideoRecommendation[]>([]);
  const [sources, setSources] = useState<SourceRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'videos' | 'sources'>('analysis');

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setThinkingText('');
      setVideos([]);
      setSources([]);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);
    setThinkingText('');
    setAnalysisResult(null);

    try {
      const base64 = await fileToBase64(selectedFile);
      const mimeType = selectedFile.type;

      // Analiz yap
      const result = await analyzeImage(base64, mimeType, (thought) => {
        setThinkingText(thought);
      });

      setAnalysisResult(result);

      // Kaynak önerileri oluştur
      const sourceRecs = generateSourceRecommendations(
        result.imageType,
        result.alternativeSearchTerms
      );
      setSources(sourceRecs);

      // YouTube videoları ara
      const searchTerm = result.alternativeSearchTerms[0] || result.imageType;
      const videoResults = await searchYouTubeVideos(searchTerm, 5);
      setVideos(videoResults);

    } catch (err) {
      console.error('Analysis error:', err);
      setError('Görsel analizi başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseImage = () => {
    if (analysisResult && previewUrl) {
      onUseImage(analysisResult, previewUrl);
      onClose();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'high': return { text: 'Yüksek', color: '#22c55e' };
      case 'medium': return { text: 'Orta', color: '#eab308' };
      case 'low': return { text: 'Düşük', color: '#ef4444' };
      default: return { text: 'Bilinmiyor', color: '#6b7280' };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
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
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
              🔍 Görsel Analiz
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              Gün {dayNumber} için görsel yükle ve analiz et
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '24px',
          display: 'flex',
          gap: '24px'
        }}>
          {/* Sol Panel - Görsel */}
          <div style={{ width: '300px', flexShrink: 0 }}>
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              background: previewUrl ? 'transparent' : '#f9fafb',
              cursor: 'pointer',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '250px',
                    borderRadius: '8px'
                  }} 
                />
              ) : (
                <>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
                  <p style={{ margin: 0, color: '#6b7280' }}>
                    Görsel yüklemek için tıklayın
                  </p>
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                    PNG, JPG, WEBP desteklenir
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            {selectedFile && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '12px',
                  background: isAnalyzing ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isAnalyzing ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isAnalyzing ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                    Analiz Ediliyor...
                  </>
                ) : (
                  <>🧠 Gemini ile Analiz Et</>
                )}
              </button>
            )}

            {/* Thinking Process */}
            {(isAnalyzing || thinkingText) && showThinking && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #bae6fd'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#0369a1' }}>
                    💭 Düşünme Süreci
                  </span>
                  <button
                    onClick={() => setShowThinking(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      color: '#0369a1',
                      cursor: 'pointer'
                    }}
                  >
                    Gizle
                  </button>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#0c4a6e',
                  maxHeight: '150px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace'
                }}>
                  {thinkingText || 'Düşünüyor...'}
                </div>
              </div>
            )}
          </div>

          {/* Sağ Panel - Sonuçlar */}
          <div style={{ flex: 1 }}>
            {error && (
              <div style={{
                padding: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            {analysisResult ? (
              <>
                {/* Tabs */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px',
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '8px'
                }}>
                  {[
                    { id: 'analysis', label: '📊 Analiz', count: null },
                    { id: 'videos', label: '📺 Videolar', count: videos.length },
                    { id: 'sources', label: '🔗 Kaynaklar', count: sources.length }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      style={{
                        padding: '8px 16px',
                        background: activeTab === tab.id ? '#3b82f6' : 'transparent',
                        color: activeTab === tab.id ? 'white' : '#6b7280',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {tab.label} {tab.count !== null && `(${tab.count})`}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'analysis' && (
                  <div>
                    {/* Skor Kartları */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                      <div style={{
                        flex: 1,
                        padding: '16px',
                        background: '#f9fafb',
                        borderRadius: '10px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          Uygunluk Skoru
                        </div>
                        <div style={{
                          fontSize: '28px',
                          fontWeight: '700',
                          color: getScoreColor(analysisResult.suitabilityScore)
                        }}>
                          {analysisResult.suitabilityScore}%
                        </div>
                      </div>
                      <div style={{
                        flex: 1,
                        padding: '16px',
                        background: '#f9fafb',
                        borderRadius: '10px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          Kalite
                        </div>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: '600',
                          color: getQualityLabel(analysisResult.qualityAssessment).color
                        }}>
                          {getQualityLabel(analysisResult.qualityAssessment).text}
                        </div>
                      </div>
                      <div style={{
                        flex: 1,
                        padding: '16px',
                        background: '#f9fafb',
                        borderRadius: '10px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          Tür Güveni
                        </div>
                        <div style={{
                          fontSize: '28px',
                          fontWeight: '700',
                          color: getScoreColor(analysisResult.imageTypeConfidence)
                        }}>
                          {analysisResult.imageTypeConfidence}%
                        </div>
                      </div>
                    </div>

                    {/* Görsel Türü */}
                    <div style={{
                      padding: '12px 16px',
                      background: '#eff6ff',
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <span style={{ fontSize: '13px', color: '#1e40af' }}>
                        <strong>Görsel Türü:</strong> {analysisResult.imageType}
                      </span>
                    </div>

                    {/* Değerlendirme */}
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#374151' }}>
                        📝 Değerlendirme
                      </h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>
                        {analysisResult.suitabilityReason}
                      </p>
                    </div>

                    {/* Tespit Edilen Elemanlar */}
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#374151' }}>
                        🔧 Tespit Edilen Elemanlar
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {analysisResult.detectedElements.map((element, i) => (
                          <span
                            key={i}
                            style={{
                              padding: '4px 10px',
                              background: '#e5e7eb',
                              borderRadius: '12px',
                              fontSize: '12px',
                              color: '#374151'
                            }}
                          >
                            {element}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Önerilen Konu */}
                    <div style={{
                      padding: '16px',
                      background: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: '#166534' }}>
                        💡 Önerilen Staj Günü Konusu
                      </h4>
                      <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '600', color: '#166534' }}>
                        {analysisResult.suggestedTopic}
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#15803d' }}>
                        {analysisResult.suggestedContent}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'videos' && (
                  <div>
                    {videos.length === 0 ? (
                      <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
                        Video önerisi bulunamadı
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#6b7280' }}>
                          💡 Bu videolardan ekran görüntüsü alarak staj defterinize ekleyebilirsiniz
                        </p>
                        {videos.map((video, i) => (
                          <a
                            key={i}
                            href={`https://www.youtube.com/watch?v=${video.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              gap: '12px',
                              padding: '12px',
                              background: '#f9fafb',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              color: 'inherit',
                              transition: 'background 0.2s'
                            }}
                          >
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              style={{
                                width: '120px',
                                height: '68px',
                                borderRadius: '6px',
                                objectFit: 'cover'
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <h5 style={{
                                margin: '0 0 4px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#1f2937',
                                lineHeight: '1.3'
                              }}>
                                {video.title}
                              </h5>
                              <p style={{
                                margin: '0 0 4px',
                                fontSize: '11px',
                                color: '#6b7280'
                              }}>
                                {video.channelTitle}
                              </p>
                              <div style={{
                                display: 'flex',
                                gap: '12px',
                                fontSize: '11px',
                                color: '#9ca3af'
                              }}>
                                <span>⏱ {video.duration}</span>
                                <span>👁 {video.viewCount} görüntüleme</span>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'sources' && (
                  <div>
                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>
                      🔍 Daha kaliteli alternatif görseller için önerilen kaynaklar
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {sources.map((source, i) => (
                        <a
                          key={i}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            padding: '14px',
                            background: '#f9fafb',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: 'inherit',
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          <span style={{ fontSize: '24px' }}>
                            {source.type === 'wikimedia' && '📚'}
                            {source.type === 'website' && '🌐'}
                            {source.type === 'pdf' && '📄'}
                            {source.type === 'youtube' && '📺'}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '4px'
                            }}>
                              <h5 style={{
                                margin: 0,
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#1f2937'
                              }}>
                                {source.title}
                              </h5>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: '600',
                                background: source.reliability === 'high' ? '#dcfce7' : 
                                           source.reliability === 'medium' ? '#fef9c3' : '#fee2e2',
                                color: source.reliability === 'high' ? '#166534' : 
                                       source.reliability === 'medium' ? '#854d0e' : '#dc2626'
                              }}>
                                {source.reliability === 'high' ? 'Güvenilir' : 
                                 source.reliability === 'medium' ? 'Orta' : 'Dikkatli Ol'}
                              </span>
                            </div>
                            <p style={{
                              margin: 0,
                              fontSize: '12px',
                              color: '#6b7280'
                            }}>
                              {source.description}
                            </p>
                          </div>
                          <span style={{ color: '#3b82f6' }}>→</span>
                        </a>
                      ))}
                    </div>

                    {/* Alternatif Arama Terimleri */}
                    <div style={{
                      marginTop: '20px',
                      padding: '16px',
                      background: '#fefce8',
                      borderRadius: '8px',
                      border: '1px solid #fef08a'
                    }}>
                      <h5 style={{ margin: '0 0 8px', fontSize: '13px', color: '#854d0e' }}>
                        🔎 Önerilen Arama Terimleri
                      </h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {analysisResult.alternativeSearchTerms.map((term, i) => (
                          <span
                            key={i}
                            style={{
                              padding: '4px 10px',
                              background: '#fef9c3',
                              borderRadius: '12px',
                              fontSize: '12px',
                              color: '#713f12'
                            }}
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: '300px',
                color: '#9ca3af'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🖼️</div>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Görsel yükleyin ve analiz edin
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '12px' }}>
                  Gemini 3 Pro ile detaylı analiz yapılacak
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {analysisResult && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              İptal
            </button>
            <button
              onClick={handleUseImage}
              style={{
                padding: '10px 20px',
                background: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✓ Bu Görseli Kullan ve Gün Yaz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalysisModal;