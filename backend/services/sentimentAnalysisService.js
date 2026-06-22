// Sentiment Analysis Service using VADER for travel reviews and social insights
import natural from 'natural';

class SentimentAnalysisService {
  constructor() {
    this.sentiment = natural.SentimentAnalyzer;
    this.stemmer = natural.PorterStemmer;
    this.tokenizer = new natural.WordTokenizer();
    
    // VADER-like sentiment lexicon for travel-related terms
    this.lexicon = {
      // Positive words
      'amazing': 3, 'awesome': 3, 'beautiful': 3, 'excellent': 3, 'fantastic': 3,
      'wonderful': 3, 'perfect': 3, 'outstanding': 3, 'breathtaking': 3, 'stunning': 3,
      'great': 2, 'good': 2, 'nice': 2, 'lovely': 2, 'pleasant': 2, 'enjoyable': 2,
      'comfortable': 2, 'clean': 2, 'friendly': 2, 'helpful': 2, 'efficient': 2,
      'recommend': 2, 'love': 2, 'enjoy': 2, 'incredible': 3,
      'memorable': 2, 'unforgettable': 3, 'spectacular': 3, 'magnificent': 3,
      
      // Negative words
      'terrible': -3, 'awful': -3, 'horrible': -3, 'disgusting': -3, 'disappointing': -3,
      'bad': -2, 'poor': -2, 'worst': -3, 'hate': -3, 'disgusted': -3,
      'dirty': -2, 'unclean': -2, 'unfriendly': -2, 'rude': -2, 'slow': -2,
      'expensive': -1, 'overpriced': -2, 'crowded': -1, 'noisy': -1,
      'delayed': -2, 'cancelled': -3, 'broken': -2, 'damaged': -2,
      'unsafe': -2, 'dangerous': -2, 'scary': -2, 'frightening': -2,
      
      // Neutral/contextual words
      'average': 0, 'okay': 0, 'fine': 1, 'acceptable': 1, 'standard': 0,
      'normal': 0, 'typical': 0, 'regular': 0, 'ordinary': 0, 'basic': 0
    };

    // Travel-specific sentiment patterns
    this.travelPatterns = {
      positive: [
        /great view/i, /amazing food/i, /excellent service/i, /beautiful location/i,
        /highly recommend/i, /worth visiting/i, /must see/i, /perfect weather/i,
        /friendly staff/i, /clean rooms/i, /good value/i, /convenient location/i
      ],
      negative: [
        /poor service/i, /dirty room/i, /overpriced/i, /not worth/i,
        /terrible food/i, /rude staff/i, /noisy/i, /crowded/i,
        /delayed flight/i, /cancelled/i, /disappointing/i, /waste of time/i
      ]
    };
  }

  // Analyze sentiment of a single text
  analyzeSentiment(text) {
    try {
      const tokens = this.tokenizer.tokenize(text.toLowerCase());
      let score = 0;
      let wordCount = 0;

      // Analyze each word
      tokens.forEach(token => {
        const cleanToken = token.replace(/[^\w]/g, '');
        if (this.lexicon[cleanToken]) {
          score += this.lexicon[cleanToken];
          wordCount++;
        }
      });

      // Check for travel-specific patterns
      const patternScore = this.analyzeTravelPatterns(text);
      score += patternScore;

      // Normalize score
      const normalizedScore = wordCount > 0 ? score / wordCount : 0;
      
      return {
        score: normalizedScore,
        sentiment: this.getSentimentLabel(normalizedScore),
        confidence: Math.min(Math.abs(normalizedScore) * 100, 100),
        wordCount: wordCount
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        score: 0,
        sentiment: 'neutral',
        confidence: 0,
        wordCount: 0
      };
    }
  }

  // Analyze travel-specific sentiment patterns
  analyzeTravelPatterns(text) {
    let score = 0;

    // Check positive patterns
    this.travelPatterns.positive.forEach(pattern => {
      if (pattern.test(text)) {
        score += 1;
      }
    });

    // Check negative patterns
    this.travelPatterns.negative.forEach(pattern => {
      if (pattern.test(text)) {
        score -= 1;
      }
    });

    return score;
  }

  // Get sentiment label from score
  getSentimentLabel(score) {
    if (score >= 0.5) return 'positive';
    if (score <= -0.5) return 'negative';
    return 'neutral';
  }

  // Analyze multiple reviews and get aggregate sentiment
  analyzeReviewSentiment(reviews) {
    if (!reviews || reviews.length === 0) {
      return {
        overallSentiment: 'neutral',
        overallScore: 0,
        confidence: 0,
        totalReviews: 0,
        sentimentDistribution: { positive: 0, negative: 0, neutral: 0 }
      };
    }

    const sentiments = reviews.map(review => this.analyzeSentiment(review.text || review.description || ''));
    const totalScore = sentiments.reduce((sum, s) => sum + s.score, 0);
    const averageScore = totalScore / sentiments.length;

    const distribution = sentiments.reduce((dist, s) => {
      dist[s.sentiment]++;
      return dist;
    }, { positive: 0, negative: 0, neutral: 0 });

    return {
      overallSentiment: this.getSentimentLabel(averageScore),
      overallScore: averageScore,
      confidence: Math.min(Math.abs(averageScore) * 100, 100),
      totalReviews: reviews.length,
      sentimentDistribution: distribution,
      detailedSentiments: sentiments
    };
  }

  // Analyze accommodation sentiment
  analyzeAccommodationSentiment(accommodations) {
    return accommodations.map(acc => {
      const reviews = acc.reviews || [];
      const sentimentAnalysis = this.analyzeReviewSentiment(reviews);
      
      return {
        ...acc,
        sentimentAnalysis,
        ecoFriendly: this.detectEcoFriendly(acc.description || acc.name || ''),
        valueForMoney: this.analyzeValueForMoney(acc.price, acc.rating, sentimentAnalysis.overallScore)
      };
    });
  }

  // Detect eco-friendly accommodations
  detectEcoFriendly(text) {
    const ecoKeywords = [
      'eco', 'green', 'sustainable', 'environmental', 'organic', 'renewable',
      'energy efficient', 'carbon neutral', 'eco-friendly', 'green certified',
      'solar', 'wind', 'recycling', 'conservation', 'biodiversity'
    ];

    const lowerText = text.toLowerCase();
    const ecoScore = ecoKeywords.reduce((score, keyword) => {
      return score + (lowerText.includes(keyword) ? 1 : 0);
    }, 0);

    return {
      isEcoFriendly: ecoScore > 0,
      ecoScore: ecoScore,
      ecoFeatures: ecoKeywords.filter(keyword => lowerText.includes(keyword))
    };
  }

  // Analyze value for money
  analyzeValueForMoney(price, rating, sentimentScore) {
    if (!price || !rating) return 'unknown';

    // Normalize price and rating to 0-1 scale
    const normalizedPrice = Math.min(price / 10000, 1); // Assuming max price of 10k
    const normalizedRating = rating / 5;
    
    // Value score = (rating + sentiment) / price
    const valueScore = (normalizedRating + (sentimentScore + 1) / 2) / (normalizedPrice + 0.1);
    
    if (valueScore > 2) return 'excellent';
    if (valueScore > 1.5) return 'good';
    if (valueScore > 1) return 'fair';
    return 'poor';
  }

  // Generate social insights from reviews
  generateSocialInsights(attractions, accommodations, restaurants) {
    const insights = {
      topPositiveAspects: [],
      commonComplaints: [],
      recommendations: [],
      trends: {}
    };

    // Analyze attractions
    const attractionInsights = this.analyzeAttractionInsights(attractions);
    insights.topPositiveAspects.push(...attractionInsights.positive);
    insights.commonComplaints.push(...attractionInsights.negative);

    // Analyze accommodations
    const accommodationInsights = this.analyzeAccommodationInsights(accommodations);
    insights.topPositiveAspects.push(...accommodationInsights.positive);
    insights.commonComplaints.push(...accommodationInsights.negative);

    // Analyze restaurants
    const restaurantInsights = this.analyzeRestaurantInsights(restaurants);
    insights.topPositiveAspects.push(...restaurantInsights.positive);
    insights.commonComplaints.push(...restaurantInsights.negative);

    // Generate recommendations
    insights.recommendations = this.generateRecommendations(insights);

    return insights;
  }

  // Analyze attraction insights
  analyzeAttractionInsights(attractions) {
    const positive = [];
    const negative = [];

    attractions.forEach(attraction => {
      if (attraction.sentimentAnalysis) {
        if (attraction.sentimentAnalysis.overallSentiment === 'positive') {
          positive.push(`${attraction.name}: Highly rated by visitors`);
        } else if (attraction.sentimentAnalysis.overallSentiment === 'negative') {
          negative.push(`${attraction.name}: Mixed reviews, consider alternatives`);
        }
      }
    });

    return { positive, negative };
  }

  // Analyze accommodation insights
  analyzeAccommodationInsights(accommodations) {
    const positive = [];
    const negative = [];

    accommodations.forEach(acc => {
      if (acc.sentimentAnalysis) {
        if (acc.sentimentAnalysis.overallSentiment === 'positive') {
          positive.push(`${acc.name}: Excellent guest satisfaction`);
        } else if (acc.sentimentAnalysis.overallSentiment === 'negative') {
          negative.push(`${acc.name}: Some guest complaints reported`);
        }

        if (acc.ecoFriendly && acc.ecoFriendly.isEcoFriendly) {
          positive.push(`${acc.name}: Eco-friendly accommodation`);
        }
      }
    });

    return { positive, negative };
  }

  // Analyze restaurant insights
  analyzeRestaurantInsights(restaurants) {
    const positive = [];
    const negative = [];

    restaurants.forEach(restaurant => {
      if (restaurant.sentimentAnalysis) {
        if (restaurant.sentimentAnalysis.overallSentiment === 'positive') {
          positive.push(`${restaurant.name}: Great food and service`);
        } else if (restaurant.sentimentAnalysis.overallSentiment === 'negative') {
          negative.push(`${restaurant.name}: Some food quality concerns`);
        }
      }
    });

    return { positive, negative };
  }

  // Analyze restaurant sentiment (similar to accommodation sentiment)
  analyzeRestaurantSentiment(restaurants) {
    return restaurants.map(restaurant => {
      const reviews = restaurant.reviews || [];
      const description = restaurant.description || restaurant.name || '';
      const sentimentAnalysis = reviews.length > 0 
        ? this.analyzeReviewSentiment(reviews)
        : this.analyzeSentiment(description);
      
      return {
        ...restaurant,
        sentimentAnalysis: typeof sentimentAnalysis === 'object' && 'overallSentiment' in sentimentAnalysis
          ? sentimentAnalysis
          : {
              overallSentiment: sentimentAnalysis.sentiment || 'neutral',
              overallScore: sentimentAnalysis.score || 0,
              confidence: sentimentAnalysis.confidence || 0,
              totalReviews: reviews.length || 0
            },
        valueForMoney: this.analyzeValueForMoney(
          restaurant.priceRange || restaurant.price, 
          restaurant.rating, 
          typeof sentimentAnalysis === 'object' && 'overallScore' in sentimentAnalysis
            ? sentimentAnalysis.overallScore
            : (sentimentAnalysis.score || 0)
        )
      };
    });
  }

  // Generate recommendations based on insights
  generateRecommendations(insights) {
    const recommendations = [];

    // Positive recommendations
    if (insights.topPositiveAspects.length > 0) {
      recommendations.push({
        type: 'positive',
        message: 'Highly rated experiences based on visitor reviews',
        items: insights.topPositiveAspects.slice(0, 5)
      });
    }

    // Caution recommendations
    if (insights.commonComplaints.length > 0) {
      recommendations.push({
        type: 'caution',
        message: 'Consider these factors when planning',
        items: insights.commonComplaints.slice(0, 3)
      });
    }

    return recommendations;
  }

  // Real-time sentiment monitoring for social media
  async monitorSocialSentiment(destination, keywords = []) {
    // This would integrate with social media APIs in a real implementation
    // For now, we'll simulate sentiment monitoring
    const mockSentimentData = {
      destination: destination,
      keywords: keywords,
      overallSentiment: 'positive',
      sentimentScore: 0.3,
      recentMentions: [
        {
          platform: 'twitter',
          text: `Just visited ${destination}, amazing experience!`,
          sentiment: 'positive',
          timestamp: new Date().toISOString()
        },
        {
          platform: 'instagram',
          text: `Beautiful views in ${destination} #travel`,
          sentiment: 'positive',
          timestamp: new Date().toISOString()
        }
      ],
      trends: {
        positive: 75,
        neutral: 20,
        negative: 5
      }
    };

    return mockSentimentData;
  }
}

export default new SentimentAnalysisService();
