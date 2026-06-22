import React, { useState, useEffect } from 'react';
import { getDestinationDetails } from '../../services/indianLocationsAPI';

// Translation Tool Component
const TranslationTool = ({ destination, destinationInfo }) => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get target language from destination
      const targetLang = destinationInfo?.language === 'Tamil' ? 'ta' :
                        destinationInfo?.language === 'Hindi' ? 'hi' :
                        destinationInfo?.language === 'Bengali' ? 'bn' :
                        destinationInfo?.language === 'Telugu' ? 'te' :
                        destinationInfo?.language === 'Marathi' ? 'mr' :
                        destinationInfo?.language === 'Gujarati' ? 'gu' :
                        destinationInfo?.language === 'Kannada' ? 'kn' :
                        destinationInfo?.language === 'Malayalam' ? 'ml' :
                        'hi'; // Default to Hindi
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          target: targetLang,
          source: 'en'
        })
      });
      
      if (!response.ok) {
        throw new Error('Translation failed');
      }
      
      const data = await response.json();
      setTranslatedText(data.translatedText || 'Translation unavailable');
    } catch (err) {
      console.error('Translation error:', err);
      setError('Translation service unavailable. Please try again later.');
      // Fallback: Use basic phrase matching
      setTranslatedText(`[${destinationInfo?.language || 'Local'} Translation]`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="travel-gradient-banner text-left space-y-4">
      <h3 className="text-lg font-semibold text-earth">Real-time Translation</h3>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Type something to translate..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTranslate()}
            className="travel-input flex-1 px-4 py-3"
          />
          <button 
            onClick={handleTranslate}
            disabled={loading || !inputText.trim()}
            className="travel-button px-6 py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Translating...' : 'Translate'}
          </button>
        </div>
        {translatedText && (
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-sm text-earth font-medium mb-1">
              {destinationInfo?.language || 'Local'} Translation:
            </p>
            <p className="text-earth">{translatedText}</p>
          </div>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
      <p className="travel-subtle-text text-sm">
        Translate from English to {destinationInfo?.language || 'local language'}
      </p>
    </div>
  );
};

const LocalAssistance = ({ destination }) => {
  const [selectedPhrase, setSelectedPhrase] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [destinationInfo, setDestinationInfo] = useState(null);

  // Language-specific phrases
  const languagePhrases = {
    'Tamil': [
      { english: 'Hello', local: 'வணக்கம் (Vaṇakkam)' },
      { english: 'Thank you', local: 'நன்றி (Naṉdri)' },
      { english: 'Please', local: 'தயவு செய்து (Tayavu ceytu)' },
      { english: 'Yes', local: 'ஆம் (Ām)' },
      { english: 'No', local: 'இல்லை (Illai)' },
      { english: 'How much?', local: 'எவ்வளவு? (Evvaḷavu?)' }
    ],
    'Hindi': [
      { english: 'Hello', local: 'नमस्ते (Namaste)' },
      { english: 'Thank you', local: 'धन्यवाद (Dhanyavaad)' },
      { english: 'Please', local: 'कृपया (Kripya)' },
      { english: 'Yes', local: 'हाँ (Haan)' },
      { english: 'No', local: 'नहीं (Nahi)' },
      { english: 'How much?', local: 'कितना? (Kitna?)' }
    ],
    'Bengali': [
      { english: 'Hello', local: 'নমস্কার (Namaskar)' },
      { english: 'Thank you', local: 'ধন্যবাদ (Dhonnobad)' },
      { english: 'Please', local: 'অনুগ্রহ করে (Onugroho kore)' },
      { english: 'Yes', local: 'হ্যাঁ (Hyan)' },
      { english: 'No', local: 'না (Na)' },
      { english: 'How much?', local: 'কত? (Koto?)' }
    ],
    'Telugu': [
      { english: 'Hello', local: 'నమస్కారం (Namaskāram)' },
      { english: 'Thank you', local: 'ధన్యవాదాలు (Dhanyavādālu)' },
      { english: 'Please', local: 'దయచేసి (Dayacēsi)' },
      { english: 'Yes', local: 'అవును (Avunu)' },
      { english: 'No', local: 'కాదు (Kādu)' },
      { english: 'How much?', local: 'ఎంత? (Enta?)' }
    ],
    'Marathi': [
      { english: 'Hello', local: 'नमस्कार (Namaskār)' },
      { english: 'Thank you', local: 'धन्यवाद (Dhan\'yavād)' },
      { english: 'Please', local: 'कृपया (Krupayā)' },
      { english: 'Yes', local: 'होय (Hoy)' },
      { english: 'No', local: 'नाही (Nāhī)' },
      { english: 'How much?', local: 'किती? (Kitī?)' }
    ]
  };

  // Get destination info from API
  useEffect(() => {
    if (destination) {
      const destData = getDestinationDetails(destination);
      if (destData) {
        const primaryLanguage = destData.languages?.[0] || 'Hindi';
        setDestinationInfo({
          language: primaryLanguage,
          languages: destData.languages || [primaryLanguage],
          customs: [
            'Remove shoes before entering temples',
            'Dress modestly when visiting religious places',
            'Use right hand for eating and passing items',
            'Greet people respectfully with local greeting'
          ],
          commonPhrases: languagePhrases[primaryLanguage] || languagePhrases['Hindi'],
          etiquette: [
            'Public displays of affection are discouraged',
            'Bargaining is common in local markets',
            'Respect personal space in crowded areas',
            'Ask permission before taking photos of people'
          ]
        });
      } else {
        // Fallback
        setDestinationInfo({
          language: 'Hindi',
          languages: ['Hindi', 'English'],
          customs: [
            'Remove shoes before entering temples',
            'Dress modestly when visiting religious places',
            'Use right hand for eating and passing items',
            'Greet people with "Namaste" with folded hands'
          ],
          commonPhrases: languagePhrases['Hindi'],
          etiquette: [
            'Public displays of affection are discouraged',
            'Bargaining is common in local markets',
            'Respect personal space in crowded areas',
            'Ask permission before taking photos of people'
          ]
        });
      }
    }
  }, [destination]);

  if (!destinationInfo) {
    return <div className="travel-section">Loading cultural information...</div>;
  }

  return (
    <div className="travel-section space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-earth">Local Culture & Language Guide</h2>
        <span className="travel-pill text-sm">
          {destination ? destination : 'Destination'} • {destinationInfo.language}
        </span>
      </div>

      {/* Language Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-earth">Essential Phrases</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {destinationInfo.commonPhrases.map((phrase, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedPhrase(phrase);
                setShowTranslation(true);
              }}
              className="travel-section py-4 px-4 text-left hover:soft-shadow transition-transform"
            >
              <div className="font-medium text-earth">{phrase.english}</div>
              <div className="travel-subtle-text text-sm">{phrase.local}</div>
            </button>
          ))}
        </div>
        {showTranslation && selectedPhrase && (
          <div className="travel-note text-sm">
            Try saying <strong>{selectedPhrase.local}</strong> when you need to say "{selectedPhrase.english}".
          </div>
        )}
      </div>

      {/* Cultural Customs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-earth">Cultural Customs</h3>
        <div className="glass-card p-6">
          <ul className="space-y-3">
            {destinationInfo.customs.map((custom, index) => (
              <li key={index} className="travel-tip-card">
                <span className="travel-tip-icon">🙏</span>
                <span className="travel-body-text">{custom}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Etiquette Tips */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-earth">Local Etiquette</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {destinationInfo.etiquette.map((tip, index) => (
            <div key={index} className="travel-section">
              <div className="flex items-start gap-3">
                <span className="travel-tip-icon">🌟</span>
                <span className="travel-body-text">{tip}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Translation Tool */}
      <TranslationTool destination={destination} destinationInfo={destinationInfo} />
    </div>
  );
};

export default LocalAssistance; 