import axios from 'axios';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

// Google Translate API endpoint
const GOOGLE_TRANSLATE_BASE = 'https://translation.googleapis.com/language/translate/v2';

// Translate text using Google Translate API
export const translateText = async (req, res) => {
  try {
    const { text, target = 'hi', source = 'en' } = req.body;

    if (!text) {
      return sendError(res, 'Text to translate is required', 'VALIDATION_ERROR', null, 400);
    }

    const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY;
    
    if (!googleKey || googleKey === 'your_google_places_api_key_here') {
      // Fallback to basic translation mapping for common phrases
      const commonPhrases = {
        'hello': { hi: 'नमस्ते', ta: 'வணக்கம்', te: 'నమస్కారం', mr: 'नमस्कार', bn: 'নমস্কার' },
        'thank you': { hi: 'धन्यवाद', ta: 'நன்றி', te: 'ధన్యవాదాలు', mr: 'धन्यवाद', bn: 'ধন্যবাদ' },
        'please': { hi: 'कृपया', ta: 'தயவு செய்து', te: 'దయచేసి', mr: 'कृपया', bn: 'অনুগ্রহ করে' },
        'yes': { hi: 'हाँ', ta: 'ஆம்', te: 'అవును', mr: 'होय', bn: 'হ্যাঁ' },
        'no': { hi: 'नहीं', ta: 'இல்லை', te: 'కాదు', mr: 'नाही', bn: 'না' },
        'how much': { hi: 'कितना', ta: 'எவ்வளவு', te: 'ఎంత', mr: 'किती', bn: 'কত' }
      };
      
      const lowerText = text.toLowerCase().trim();
      if (commonPhrases[lowerText] && commonPhrases[lowerText][target]) {
        return sendSuccess(res, {
          translatedText: commonPhrases[lowerText][target],
          source: source,
          target: target
        }, { source: 'fallback' });
      }
      
      return sendError(res, 'Google Translate API key not configured', 'CONFIG_ERROR', null, 500);
    }

    // Use Google Translate API
    const response = await axios.post(
      `${GOOGLE_TRANSLATE_BASE}?key=${googleKey}`,
      {
        q: text,
        target: target,
        source: source
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    if (response.data?.data?.translations?.[0]) {
      return sendSuccess(res, {
        translatedText: response.data.data.translations[0].translatedText,
        source: source,
        target: target
      }, { source: 'google_translate' });
    }

    return sendError(res, 'Translation failed', 'TRANSLATION_ERROR', null, 500);

  } catch (error) {
    console.error('Translation error:', error.message);
    
    // Fallback to basic mapping
    const commonPhrases = {
      'hello': { hi: 'नमस्ते', ta: 'வணக்கம்', te: 'నమస్కారం', mr: 'नमस्कार', bn: 'নমস্কার' },
      'thank you': { hi: 'धन्यवाद', ta: 'நன்றி', te: 'ధన్యవాదాలు', mr: 'धन्यवाद', bn: 'ধন্যবাদ' }
    };
    
    const lowerText = req.body?.text?.toLowerCase()?.trim() || '';
    if (commonPhrases[lowerText] && commonPhrases[lowerText][req.body?.target || 'hi']) {
      return sendSuccess(res, {
        translatedText: commonPhrases[lowerText][req.body.target || 'hi'],
        source: req.body.source || 'en',
        target: req.body.target || 'hi'
      }, { source: 'fallback' });
    }
    
    sendError(res, 'Translation service unavailable', 'TRANSLATION_ERROR', error.message, 500);
  }
};

