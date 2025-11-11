import natural from 'natural';

export interface SentimentAnalysis {
  overallScore: number; // -100 to +100
  confidence: number; // 0 to 1
  sentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  aspects: AspectSentiment[];
  keyPhrases: KeyPhrase[];
  emotions: EmotionAnalysis;
  recommendations: string[];
}

export interface AspectSentiment {
  aspect: string;
  score: number; // -100 to +100
  confidence: number;
  mentions: number;
  keywords: string[];
  examples: string[];
}

export interface KeyPhrase {
  phrase: string;
  sentiment: number;
  frequency: number;
  importance: number;
}

export interface EmotionAnalysis {
  primary: string;
  emotions: Map<string, number>;
  intensity: number;
}

export interface CompanyAnalysis {
  companyName: string;
  overallRating: number; // 1-5 stars
  sentimentBreakdown: {
    workLifeBalance: SentimentAnalysis;
    management: SentimentAnalysis;
    compensation: SentimentAnalysis;
    culture: SentimentAnalysis;
    careerGrowth: SentimentAnalysis;
    jobSecurity: SentimentAnalysis;
  };
  employeeInsights: EmployeeInsight[];
  culturalFit: CulturalFitAnalysis;
  redFlags: RedFlag[];
  strengths: CompanyStrength[];
  trends: TrendAnalysis;
  recommendations: CompanyRecommendation[];
}

export interface EmployeeInsight {
  role: string;
  tenure: string;
  department: string;
  sentiment: SentimentAnalysis;
  keyPoints: string[];
  credibility: number;
}

export interface CulturalFitAnalysis {
  workStyle: 'collaborative' | 'independent' | 'hierarchical' | 'flat';
  pace: 'fast' | 'moderate' | 'relaxed';
  innovation: 'cutting_edge' | 'stable' | 'traditional';
  communication: 'direct' | 'diplomatic' | 'formal' | 'casual';
  diversity: number; // 0-100 score
  inclusivity: number; // 0-100 score
  values: string[];
  perks: CompanyPerk[];
}

export interface CompanyPerk {
  category: 'compensation' | 'benefits' | 'culture' | 'growth' | 'flexibility';
  description: string;
  frequency: number;
  sentiment: number;
}

export interface RedFlag {
  type: 'management' | 'culture' | 'compensation' | 'workload' | 'ethics' | 'stability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  frequency: number;
  examples: string[];
  impact: number; // 0-100
}

export interface CompanyStrength {
  category: string;
  description: string;
  score: number;
  supporting_evidence: string[];
}

export interface TrendAnalysis {
  direction: 'improving' | 'declining' | 'stable';
  timeframe: string;
  keyChanges: string[];
  confidence: number;
}

export interface CompanyRecommendation {
  type: 'apply' | 'research_more' | 'avoid' | 'negotiate';
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  action_items: string[];
}

export interface ManagerAnalysis {
  managementStyle: 'micromanager' | 'supportive' | 'hands_off' | 'inconsistent';
  communicationQuality: number; // 0-100
  careerSupport: number; // 0-100
  workLifeRespect: number; // 0-100
  technicalCompetence: number; // 0-100
  commonIssues: string[];
  positiveTraits: string[];
}

export class SentimentAnalyzer {
  private lexicon: Map<string, number>;
  private aspectKeywords: Map<string, string[]>;
  private emotionKeywords: Map<string, string[]>;
  private negationWords: Set<string>;
  private intensifiers: Map<string, number>;
  private stemmer: any;
  private tokenizer: any;

  constructor() {
    this.initializeLexicon();
    this.initializeAspectKeywords();
    this.initializeEmotionKeywords();
    this.initializeNegationWords();
    this.initializeIntensifiers();
    this.stemmer = natural.PorterStemmer;
    this.tokenizer = new natural.WordTokenizer();
  }

  /**
   * Analyze sentiment of company reviews and feedback
   */
  public analyzeCompanyReviews(reviews: string[], companyName: string): CompanyAnalysis {
    const sentimentBreakdown = this.analyzeByCategoryMixedAspects(reviews);
    const employeeInsights = this.extractEmployeeInsights(reviews);
    const culturalFit = this.analyzeCulturalFit(reviews);
    const redFlags = this.detectRedFlags(reviews);
    const strengths = this.identifyStrengths(reviews);
    const trends = this.analyzeTrends(reviews);
    const overallRating = this.calculateOverallRating(sentimentBreakdown);
    const recommendations = this.generateCompanyRecommendations(sentimentBreakdown, redFlags, strengths);

    return {
      companyName,
      overallRating,
      sentimentBreakdown,
      employeeInsights,
      culturalFit,
      redFlags,
      strengths,
      trends,
      recommendations
    };
  }

  /**
   * Analyze individual text for sentiment
   */
  public analyzeSentiment(text: string): SentimentAnalysis {
    const cleanText = this.preprocessText(text);
    const tokens = this.tokenizer.tokenize(cleanText);
    
    const overallScore = this.calculateSentimentScore(tokens, cleanText);
    const confidence = this.calculateConfidence(tokens, overallScore);
    const sentiment = this.categorizeSentiment(overallScore);
    const aspects = this.extractAspectSentiments(cleanText);
    const keyPhrases = this.extractKeyPhrases(cleanText);
    const emotions = this.analyzeEmotions(cleanText);
    const recommendations = this.generateSentimentRecommendations(overallScore, aspects);

    return {
      overallScore,
      confidence,
      sentiment,
      aspects,
      keyPhrases,
      emotions,
      recommendations
    };
  }

  /**
   * Analyze manager-employee relationship sentiment
   */
  public analyzeManagerRelationship(reviews: string[]): ManagerAnalysis {
    const managerReviews = reviews.filter(review => 
      this.containsManagerKeywords(review)
    );

    const managementStyle = this.determineManagementStyle(managerReviews);
    const communicationQuality = this.assessCommunicationQuality(managerReviews);
    const careerSupport = this.assessCareerSupport(managerReviews);
    const workLifeRespect = this.assessWorkLifeRespect(managerReviews);
    const technicalCompetence = this.assessTechnicalCompetence(managerReviews);
    const commonIssues = this.extractCommonIssues(managerReviews);
    const positiveTraits = this.extractPositiveTraits(managerReviews);

    return {
      managementStyle,
      communicationQuality,
      careerSupport,
      workLifeRespect,
      technicalCompetence,
      commonIssues,
      positiveTraits
    };
  }

  /**
   * Predict work-life balance based on reviews
   */
  public predictWorkLifeBalance(reviews: string[]): any {
    const workLifeReviews = reviews.filter(review => 
      this.containsWorkLifeKeywords(review)
    );

    const overallSentiment = this.analyzeSentiment(workLifeReviews.join(' '));
    const hoursReferences = this.extractWorkingHours(workLifeReviews);
    const stressIndicators = this.detectStressIndicators(workLifeReviews);
    const flexibilityMentions = this.extractFlexibilityMentions(workLifeReviews);
    const burnoutSignals = this.detectBurnoutSignals(workLifeReviews);

    return {
      score: this.calculateWorkLifeScore(overallSentiment, stressIndicators, flexibilityMentions),
      workingHours: hoursReferences,
      stressLevel: stressIndicators.length > 0 ? 'high' : 'moderate',
      flexibility: flexibilityMentions.length > 0 ? 'good' : 'limited',
      burnoutRisk: burnoutSignals.length > 3 ? 'high' : 'low',
      insights: this.generateWorkLifeInsights(overallSentiment, hoursReferences, stressIndicators)
    };
  }

  /**
   * Assess company culture compatibility
   */
  public assessCultureCompatibility(reviews: string[], userPreferences: any): any {
    const cultureAnalysis = this.analyzeCulturalFit(reviews);
    const compatibilityScore = this.calculateCultureCompatibility(cultureAnalysis, userPreferences);
    
    return {
      compatibilityScore,
      matches: this.findCultureMatches(cultureAnalysis, userPreferences),
      mismatches: this.findCultureMismatches(cultureAnalysis, userPreferences),
      recommendations: this.generateCultureRecommendations(compatibilityScore, cultureAnalysis)
    };
  }

  private initializeLexicon(): void {
    // Comprehensive sentiment lexicon for workplace/career context
    this.lexicon = new Map([
      // Very Positive (0.8-1.0)
      ['excellent', 0.9], ['outstanding', 0.95], ['exceptional', 0.9], ['amazing', 0.85],
      ['fantastic', 0.85], ['wonderful', 0.8], ['brilliant', 0.85], ['superb', 0.9],
      ['phenomenal', 0.95], ['incredible', 0.85], ['thrilling', 0.8], ['perfect', 0.9],
      
      // Positive (0.4-0.8)
      ['good', 0.5], ['great', 0.7], ['positive', 0.6], ['helpful', 0.6], ['supportive', 0.7],
      ['collaborative', 0.6], ['innovative', 0.7], ['creative', 0.6], ['efficient', 0.6],
      ['productive', 0.7], ['motivated', 0.6], ['satisfied', 0.6], ['happy', 0.7],
      
      // Neutral (-0.2-0.2)
      ['okay', 0.1], ['average', 0.0], ['normal', 0.0], ['standard', 0.0], ['typical', 0.0],
      
      // Negative (-0.8--0.4)
      ['bad', -0.5], ['poor', -0.6], ['difficult', -0.5], ['challenging', -0.4], ['frustrating', -0.7],
      ['disappointing', -0.6], ['concerning', -0.5], ['problematic', -0.6], ['stressful', -0.7],
      ['overwhelming', -0.8], ['exhausting', -0.7], ['demanding', -0.5],
      
      // Very Negative (-1.0--0.8)
      ['terrible', -0.9], ['awful', -0.9], ['horrible', -0.9], ['toxic', -0.95], ['nightmare', -0.95],
      ['disaster', -0.9], ['unbearable', -0.9], ['catastrophic', -0.95], ['devastating', -0.9],
      
      // Workplace specific terms
      ['micromanage', -0.8], ['micromanagement', -0.8], ['burnout', -0.9], ['overworked', -0.8],
      ['undervalued', -0.7], ['underpaid', -0.6], ['disorganized', -0.6], ['chaotic', -0.8],
      ['supportive', 0.7], ['mentoring', 0.7], ['growth', 0.6], ['promotion', 0.6],
      ['recognition', 0.6], ['appreciate', 0.6], ['reward', 0.6], ['bonus', 0.5],
      
      // Management terms
      ['leadership', 0.6], ['guidance', 0.6], ['direction', 0.5], ['feedback', 0.4],
      ['transparent', 0.6], ['communication', 0.4], ['trust', 0.7], ['respect', 0.7],
      
      // Culture terms
      ['inclusive', 0.7], ['diverse', 0.6], ['welcoming', 0.7], ['friendly', 0.6],
      ['professional', 0.5], ['casual', 0.3], ['formal', 0.2], ['relaxed', 0.4],
      
      // Work-life balance
      ['flexible', 0.6], ['balance', 0.5], ['remote', 0.4], ['overtime', -0.5],
      ['weekend', -0.3], ['vacation', 0.4], ['pto', 0.3], ['benefits', 0.5]
    ]);
  }

  private initializeAspectKeywords(): void {
    this.aspectKeywords = new Map([
      ['work_life_balance', [
        'work life balance', 'work-life balance', 'hours', 'overtime', 'weekend',
        'vacation', 'pto', 'time off', 'flexible', 'remote', 'schedule',
        'burnout', 'stress', 'exhausted', 'overworked', 'balance'
      ]],
      ['management', [
        'manager', 'management', 'supervisor', 'boss', 'leader', 'leadership',
        'director', 'ceo', 'vp', 'micromanage', 'guidance', 'support',
        'feedback', 'communication', 'trust', 'respect', 'transparent'
      ]],
      ['compensation', [
        'salary', 'pay', 'compensation', 'benefits', 'bonus', 'raise',
        'stock', 'equity', 'insurance', 'healthcare', 'retirement',
        '401k', 'underpaid', 'overpaid', 'competitive', 'fair'
      ]],
      ['culture', [
        'culture', 'environment', 'atmosphere', 'vibe', 'team', 'colleagues',
        'coworkers', 'inclusive', 'diverse', 'toxic', 'friendly',
        'professional', 'casual', 'formal', 'collaborative', 'competitive'
      ]],
      ['career_growth', [
        'growth', 'promotion', 'advancement', 'career', 'development',
        'training', 'learning', 'skills', 'mentoring', 'coaching',
        'opportunities', 'path', 'progression', 'stagnant', 'limited'
      ]],
      ['job_security', [
        'security', 'stable', 'layoffs', 'restructuring', 'firing',
        'job safety', 'permanent', 'contract', 'turnover', 'retention',
        'uncertain', 'secure', 'guaranteed', 'risky'
      ]]
    ]);
  }

  private initializeEmotionKeywords(): void {
    this.emotionKeywords = new Map([
      ['joy', ['happy', 'excited', 'thrilled', 'delighted', 'pleased', 'satisfied', 'content']],
      ['anger', ['angry', 'furious', 'mad', 'annoyed', 'irritated', 'frustrated', 'outraged']],
      ['sadness', ['sad', 'disappointed', 'depressed', 'discouraged', 'dejected', 'miserable']],
      ['fear', ['afraid', 'worried', 'anxious', 'nervous', 'scared', 'concerned', 'uncertain']],
      ['surprise', ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'unexpected']],
      ['disgust', ['disgusted', 'revolted', 'appalled', 'horrified', 'sickened']],
      ['trust', ['trust', 'confident', 'secure', 'reliable', 'dependable', 'faith']],
      ['anticipation', ['excited', 'eager', 'hopeful', 'optimistic', 'looking forward']]
    ]);
  }

  private initializeNegationWords(): void {
    this.negationWords = new Set([
      'not', 'no', 'never', 'none', 'nobody', 'nothing', 'neither', 'nowhere',
      'hardly', 'scarcely', 'barely', 'seldom', 'rarely', "don't", "doesn't",
      "didn't", "won't", "wouldn't", "can't", "couldn't", "shouldn't", "isn't",
      "aren't", "wasn't", "weren't", "haven't", "hasn't", "hadn't"
    ]);
  }

  private initializeIntensifiers(): void {
    this.intensifiers = new Map([
      ['very', 1.5], ['extremely', 2.0], ['incredibly', 1.8], ['absolutely', 1.7],
      ['completely', 1.6], ['totally', 1.5], ['really', 1.3], ['quite', 1.2],
      ['rather', 1.1], ['somewhat', 0.8], ['slightly', 0.7], ['barely', 0.5],
      ['hardly', 0.4], ['almost', 0.9], ['nearly', 0.9], ['pretty', 1.2],
      ['fairly', 1.1], ['moderately', 0.9], ['exceptionally', 2.0], ['remarkably', 1.8]
    ]);
  }

  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateSentimentScore(tokens: string[], fullText: string): number {
    let score = 0;
    let tokenCount = 0;
    let isNegated = false;
    let intensifier = 1.0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const stemmed = this.stemmer.stem(token);

      // Check for negation
      if (this.negationWords.has(token)) {
        isNegated = true;
        continue;
      }

      // Check for intensifiers
      if (this.intensifiers.has(token)) {
        intensifier = this.intensifiers.get(token)!;
        continue;
      }

      // Get sentiment score
      let tokenScore = this.lexicon.get(token) || this.lexicon.get(stemmed) || 0;

      if (tokenScore !== 0) {
        // Apply negation
        if (isNegated) {
          tokenScore = -tokenScore;
          isNegated = false;
        }

        // Apply intensifier
        tokenScore *= intensifier;
        intensifier = 1.0;

        score += tokenScore;
        tokenCount++;
      }

      // Reset negation after 3 words
      if (i > 0 && (i % 3 === 0)) {
        isNegated = false;
      }
    }

    // Normalize score
    const normalizedScore = tokenCount > 0 ? score / tokenCount : 0;
    
    // Scale to -100 to +100
    return Math.max(-100, Math.min(100, normalizedScore * 100));
  }

  private calculateConfidence(tokens: string[], score: number): number {
    const sentimentWords = tokens.filter(token => 
      this.lexicon.has(token) || this.lexicon.has(this.stemmer.stem(token))
    );
    
    const coverage = sentimentWords.length / Math.max(tokens.length, 1);
    const intensity = Math.abs(score) / 100;
    
    return Math.min(0.5 + coverage * 0.3 + intensity * 0.2, 1.0);
  }

  private categorizeSentiment(score: number): 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive' {
    if (score <= -60) return 'very_negative';
    if (score <= -20) return 'negative';
    if (score >= 60) return 'very_positive';
    if (score >= 20) return 'positive';
    return 'neutral';
  }

  private extractAspectSentiments(text: string): AspectSentiment[] {
    const aspects: AspectSentiment[] = [];

    for (const [aspect, keywords] of this.aspectKeywords) {
      const aspectSentences = this.extractAspectSentences(text, keywords);
      
      if (aspectSentences.length > 0) {
        const aspectText = aspectSentences.join(' ');
        const tokens = this.tokenizer.tokenize(aspectText);
        const score = this.calculateSentimentScore(tokens, aspectText);
        const confidence = this.calculateConfidence(tokens, score);
        
        aspects.push({
          aspect: aspect.replace('_', ' '),
          score,
          confidence,
          mentions: aspectSentences.length,
          keywords: keywords.filter(kw => text.includes(kw)),
          examples: aspectSentences.slice(0, 3)
        });
      }
    }

    return aspects.sort((a, b) => b.mentions - a.mentions);
  }

  private extractAspectSentences(text: string, keywords: string[]): string[] {
    const sentences = text.split(/[.!?]+/);
    const aspectSentences: string[] = [];

    for (const sentence of sentences) {
      for (const keyword of keywords) {
        if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
          aspectSentences.push(sentence.trim());
          break;
        }
      }
    }

    return aspectSentences;
  }

  private extractKeyPhrases(text: string): KeyPhrase[] {
    const phrases: KeyPhrase[] = [];
    const sentences = text.split(/[.!?]+/);

    // Extract noun phrases and important terms
    for (const sentence of sentences) {
      const tokens = this.tokenizer.tokenize(sentence);
      
      // Simple bigram and trigram extraction
      for (let i = 0; i < tokens.length - 1; i++) {
        const bigram = `${tokens[i]} ${tokens[i + 1]}`;
        const bigramScore = this.calculatePhraseScore(bigram);
        
        if (Math.abs(bigramScore) > 0.3) {
          phrases.push({
            phrase: bigram,
            sentiment: bigramScore,
            frequency: this.countPhraseFrequency(text, bigram),
            importance: Math.abs(bigramScore)
          });
        }

        // Trigrams
        if (i < tokens.length - 2) {
          const trigram = `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`;
          const trigramScore = this.calculatePhraseScore(trigram);
          
          if (Math.abs(trigramScore) > 0.4) {
            phrases.push({
              phrase: trigram,
              sentiment: trigramScore,
              frequency: this.countPhraseFrequency(text, trigram),
              importance: Math.abs(trigramScore)
            });
          }
        }
      }
    }

    return phrases
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);
  }

  private calculatePhraseScore(phrase: string): number {
    const tokens = this.tokenizer.tokenize(phrase);
    let score = 0;
    let count = 0;

    for (const token of tokens) {
      const tokenScore = this.lexicon.get(token) || this.lexicon.get(this.stemmer.stem(token)) || 0;
      if (tokenScore !== 0) {
        score += tokenScore;
        count++;
      }
    }

    return count > 0 ? score / count : 0;
  }

  private countPhraseFrequency(text: string, phrase: string): number {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }

  private analyzeEmotions(text: string): EmotionAnalysis {
    const emotions = new Map<string, number>();
    let maxEmotion = 'neutral';
    let maxScore = 0;

    for (const [emotion, keywords] of this.emotionKeywords) {
      let emotionScore = 0;
      let count = 0;

      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          emotionScore += matches.length;
          count += matches.length;
        }
      }

      if (count > 0) {
        emotions.set(emotion, emotionScore / text.split(' ').length);
        
        if (emotionScore > maxScore) {
          maxScore = emotionScore;
          maxEmotion = emotion;
        }
      }
    }

    const intensity = maxScore / text.split(' ').length;

    return {
      primary: maxEmotion,
      emotions,
      intensity: Math.min(intensity * 100, 100)
    };
  }

  private generateSentimentRecommendations(score: number, aspects: AspectSentiment[]): string[] {
    const recommendations: string[] = [];

    if (score < -50) {
      recommendations.push('Consider looking for alternative opportunities');
    } else if (score < -20) {
      recommendations.push('Research specific concerns before proceeding');
    } else if (score > 50) {
      recommendations.push('Strong positive sentiment - good opportunity');
    }

    // Aspect-specific recommendations
    const negativeAspects = aspects.filter(a => a.score < -30);
    if (negativeAspects.length > 0) {
      recommendations.push(`Pay attention to concerns about: ${negativeAspects.map(a => a.aspect).join(', ')}`);
    }

    return recommendations;
  }

  private analyzeByCategoryMixedAspects(reviews: string[]): any {
    const allText = reviews.join(' ');
    const aspects = this.extractAspectSentiments(allText);
    
    const breakdown: any = {
      workLifeBalance: this.getAspectAnalysis(aspects, 'work life balance') || this.createDefaultAnalysis(),
      management: this.getAspectAnalysis(aspects, 'management') || this.createDefaultAnalysis(),
      compensation: this.getAspectAnalysis(aspects, 'compensation') || this.createDefaultAnalysis(),
      culture: this.getAspectAnalysis(aspects, 'culture') || this.createDefaultAnalysis(),
      careerGrowth: this.getAspectAnalysis(aspects, 'career growth') || this.createDefaultAnalysis(),
      jobSecurity: this.getAspectAnalysis(aspects, 'job security') || this.createDefaultAnalysis()
    };

    return breakdown;
  }

  private getAspectAnalysis(aspects: AspectSentiment[], aspectName: string): SentimentAnalysis | null {
    const aspect = aspects.find(a => a.aspect === aspectName);
    if (!aspect) return null;

    return {
      overallScore: aspect.score,
      confidence: aspect.confidence,
      sentiment: this.categorizeSentiment(aspect.score),
      aspects: [aspect],
      keyPhrases: [],
      emotions: { primary: 'neutral', emotions: new Map(), intensity: 0 },
      recommendations: []
    };
  }

  private createDefaultAnalysis(): SentimentAnalysis {
    return {
      overallScore: 0,
      confidence: 0.3,
      sentiment: 'neutral',
      aspects: [],
      keyPhrases: [],
      emotions: { primary: 'neutral', emotions: new Map(), intensity: 0 },
      recommendations: ['Insufficient data for analysis']
    };
  }

  private extractEmployeeInsights(reviews: string[]): EmployeeInsight[] {
    const insights: EmployeeInsight[] = [];

    for (const review of reviews.slice(0, 10)) { // Analyze top 10 reviews
      const sentiment = this.analyzeSentiment(review);
      const role = this.extractRole(review);
      const tenure = this.extractTenure(review);
      const department = this.extractDepartment(review);
      const keyPoints = this.extractKeyPoints(review);
      const credibility = this.assessCredibility(review);

      insights.push({
        role,
        tenure,
        department,
        sentiment,
        keyPoints,
        credibility
      });
    }

    return insights.sort((a, b) => b.credibility - a.credibility);
  }

  private analyzeCulturalFit(reviews: string[]): CulturalFitAnalysis {
    const allText = reviews.join(' ');
    
    const workStyle = this.determineWorkStyle(allText);
    const pace = this.determinePace(allText);
    const innovation = this.determineInnovationType(allText);
    const communication = this.determineCommunicationStyle(allText);
    const diversity = this.assessDiversity(allText);
    const inclusivity = this.assessInclusivity(allText);
    const values = this.extractValues(allText);
    const perks = this.extractPerks(allText);

    return {
      workStyle,
      pace,
      innovation,
      communication,
      diversity,
      inclusivity,
      values,
      perks
    };
  }

  private detectRedFlags(reviews: string[]): RedFlag[] {
    const redFlags: RedFlag[] = [];
    const allText = reviews.join(' ');

    // Management red flags
    const managementIssues = this.detectManagementIssues(allText);
    if (managementIssues.frequency > 3) {
      redFlags.push({
        type: 'management',
        severity: managementIssues.frequency > 8 ? 'critical' : 'high',
        description: 'Multiple reports of management issues',
        frequency: managementIssues.frequency,
        examples: managementIssues.examples,
        impact: Math.min(managementIssues.frequency * 10, 100)
      });
    }

    // Toxic culture indicators
    const toxicCulture = this.detectToxicCulture(allText);
    if (toxicCulture.frequency > 2) {
      redFlags.push({
        type: 'culture',
        severity: toxicCulture.frequency > 5 ? 'critical' : 'high',
        description: 'Toxic workplace culture reported',
        frequency: toxicCulture.frequency,
        examples: toxicCulture.examples,
        impact: Math.min(toxicCulture.frequency * 15, 100)
      });
    }

    // Work-life balance issues
    const workLifeIssues = this.detectWorkLifeIssues(allText);
    if (workLifeIssues.frequency > 4) {
      redFlags.push({
        type: 'workload',
        severity: workLifeIssues.frequency > 10 ? 'high' : 'medium',
        description: 'Poor work-life balance reported',
        frequency: workLifeIssues.frequency,
        examples: workLifeIssues.examples,
        impact: Math.min(workLifeIssues.frequency * 8, 100)
      });
    }

    return redFlags.sort((a, b) => b.impact - a.impact);
  }

  private identifyStrengths(reviews: string[]): CompanyStrength[] {
    const strengths: CompanyStrength[] = [];
    const allText = reviews.join(' ');

    // Good management
    const goodManagement = this.detectGoodManagement(allText);
    if (goodManagement.score > 60) {
      strengths.push({
        category: 'Management',
        description: 'Positive management feedback',
        score: goodManagement.score,
        supporting_evidence: goodManagement.evidence
      });
    }

    // Great culture
    const greatCulture = this.detectGreatCulture(allText);
    if (greatCulture.score > 70) {
      strengths.push({
        category: 'Culture',
        description: 'Positive workplace culture',
        score: greatCulture.score,
        supporting_evidence: greatCulture.evidence
      });
    }

    // Career growth opportunities
    const careerGrowth = this.detectCareerGrowth(allText);
    if (careerGrowth.score > 60) {
      strengths.push({
        category: 'Career Growth',
        description: 'Good career development opportunities',
        score: careerGrowth.score,
        supporting_evidence: careerGrowth.evidence
      });
    }

    return strengths.sort((a, b) => b.score - a.score);
  }

  private analyzeTrends(reviews: string[]): TrendAnalysis {
    // Simplified trend analysis - in real implementation, this would analyze time-series data
    const recentReviews = reviews.slice(0, Math.floor(reviews.length / 3));
    const olderReviews = reviews.slice(Math.floor(reviews.length * 2 / 3));

    const recentSentiment = this.analyzeSentiment(recentReviews.join(' '));
    const olderSentiment = this.analyzeSentiment(olderReviews.join(' '));

    const trend = recentSentiment.overallScore - olderSentiment.overallScore;
    
    let direction: 'improving' | 'declining' | 'stable';
    if (trend > 20) direction = 'improving';
    else if (trend < -20) direction = 'declining';
    else direction = 'stable';

    return {
      direction,
      timeframe: 'Last 6 months',
      keyChanges: this.identifyKeyChanges(recentReviews, olderReviews),
      confidence: 0.7
    };
  }

  private calculateOverallRating(sentimentBreakdown: any): number {
    const scores = [
      sentimentBreakdown.workLifeBalance.overallScore,
      sentimentBreakdown.management.overallScore,
      sentimentBreakdown.compensation.overallScore,
      sentimentBreakdown.culture.overallScore,
      sentimentBreakdown.careerGrowth.overallScore,
      sentimentBreakdown.jobSecurity.overallScore
    ];

    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Convert to 1-5 star rating
    return Math.max(1, Math.min(5, ((avgScore + 100) / 200) * 5));
  }

  private generateCompanyRecommendations(sentimentBreakdown: any, redFlags: RedFlag[], strengths: CompanyStrength[]): CompanyRecommendation[] {
    const recommendations: CompanyRecommendation[] = [];

    const avgScore = Object.values(sentimentBreakdown).reduce((sum: number, analysis: any) => sum + analysis.overallScore, 0) / 6;
    const criticalFlags = redFlags.filter(flag => flag.severity === 'critical');

    if (criticalFlags.length > 0) {
      recommendations.push({
        type: 'avoid',
        priority: 'high',
        reasoning: 'Critical red flags identified',
        action_items: ['Look for alternative opportunities', 'Avoid applying to this company']
      });
    } else if (avgScore > 50 && redFlags.length <= 1) {
      recommendations.push({
        type: 'apply',
        priority: 'high',
        reasoning: 'Strong positive sentiment with minimal concerns',
        action_items: ['Apply with confidence', 'Highlight relevant experience']
      });
    } else if (avgScore > 20) {
      recommendations.push({
        type: 'research_more',
        priority: 'medium',
        reasoning: 'Mixed reviews - requires deeper investigation',
        action_items: ['Research specific role and team', 'Ask targeted questions in interview']
      });
    }

    return recommendations;
  }

  // Helper methods for specific analysis types
  private containsManagerKeywords(review: string): boolean {
    const managerKeywords = ['manager', 'boss', 'supervisor', 'leadership', 'management'];
    return managerKeywords.some(keyword => review.toLowerCase().includes(keyword));
  }

  private determineManagementStyle(reviews: string[]): 'micromanager' | 'supportive' | 'hands_off' | 'inconsistent' {
    const allText = reviews.join(' ').toLowerCase();
    
    if (allText.includes('micromanage') || allText.includes('micro-manage')) return 'micromanager';
    if (allText.includes('supportive') || allText.includes('helpful')) return 'supportive';
    if (allText.includes('hands off') || allText.includes('independent')) return 'hands_off';
    return 'inconsistent';
  }

  private assessCommunicationQuality(reviews: string[]): number {
    const allText = reviews.join(' ');
    const sentiment = this.analyzeSentiment(allText);
    const commKeywords = ['communication', 'transparent', 'clear', 'feedback'];
    
    let score = sentiment.overallScore;
    for (const keyword of commKeywords) {
      if (allText.includes(keyword)) score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private assessCareerSupport(reviews: string[]): number {
    const careerKeywords = ['growth', 'promotion', 'development', 'mentoring', 'career'];
    const allText = reviews.join(' ').toLowerCase();
    
    let score = 50; // Base score
    for (const keyword of careerKeywords) {
      const regex = new RegExp(keyword, 'g');
      const matches = allText.match(regex);
      if (matches) score += matches.length * 5;
    }
    
    return Math.min(100, score);
  }

  private assessWorkLifeRespect(reviews: string[]): number {
    const workLifeText = reviews.filter(r => this.containsWorkLifeKeywords(r)).join(' ');
    if (!workLifeText) return 50; // Default if no mentions
    
    const sentiment = this.analyzeSentiment(workLifeText);
    return Math.max(0, Math.min(100, sentiment.overallScore + 50));
  }

  private assessTechnicalCompetence(reviews: string[]): number {
    const techKeywords = ['technical', 'knowledge', 'expertise', 'competent', 'skilled'];
    const allText = reviews.join(' ').toLowerCase();
    
    let score = 50;
    for (const keyword of techKeywords) {
      if (allText.includes(keyword)) score += 10;
    }
    
    return Math.min(100, score);
  }

  private extractCommonIssues(reviews: string[]): string[] {
    const issues: string[] = [];
    const allText = reviews.join(' ').toLowerCase();
    
    const commonIssues = [
      'micromanagement', 'poor communication', 'lack of feedback',
      'unclear expectations', 'favoritism', 'disorganization'
    ];
    
    for (const issue of commonIssues) {
      if (allText.includes(issue) || allText.includes(issue.replace(' ', ''))) {
        issues.push(issue);
      }
    }
    
    return issues;
  }

  private extractPositiveTraits(reviews: string[]): string[] {
    const traits: string[] = [];
    const allText = reviews.join(' ').toLowerCase();
    
    const positiveTraits = [
      'supportive', 'knowledgeable', 'fair', 'transparent',
      'helpful', 'experienced', 'understanding', 'flexible'
    ];
    
    for (const trait of positiveTraits) {
      if (allText.includes(trait)) {
        traits.push(trait);
      }
    }
    
    return traits;
  }

  private containsWorkLifeKeywords(review: string): boolean {
    const workLifeKeywords = ['work life', 'work-life', 'balance', 'hours', 'overtime', 'weekend'];
    return workLifeKeywords.some(keyword => review.toLowerCase().includes(keyword));
  }

  private extractWorkingHours(reviews: string[]): string[] {
    const hours: string[] = [];
    const hourRegex = /(\d{1,2})\s*[-to]*\s*(\d{1,2})\s*hour/gi;
    
    for (const review of reviews) {
      const matches = review.match(hourRegex);
      if (matches) hours.push(...matches);
    }
    
    return hours;
  }

  private detectStressIndicators(reviews: string[]): string[] {
    const stressKeywords = ['stress', 'burnout', 'exhausted', 'overwhelming', 'pressure'];
    const indicators: string[] = [];
    
    for (const review of reviews) {
      for (const keyword of stressKeywords) {
        if (review.toLowerCase().includes(keyword)) {
          indicators.push(keyword);
        }
      }
    }
    
    return indicators;
  }

  private extractFlexibilityMentions(reviews: string[]): string[] {
    const flexKeywords = ['flexible', 'remote', 'work from home', 'flexible hours'];
    const mentions: string[] = [];
    
    for (const review of reviews) {
      for (const keyword of flexKeywords) {
        if (review.toLowerCase().includes(keyword)) {
          mentions.push(keyword);
        }
      }
    }
    
    return mentions;
  }

  private detectBurnoutSignals(reviews: string[]): string[] {
    const burnoutKeywords = ['burnout', 'burnt out', 'exhausted', 'overworked', 'unsustainable'];
    const signals: string[] = [];
    
    for (const review of reviews) {
      for (const keyword of burnoutKeywords) {
        if (review.toLowerCase().includes(keyword)) {
          signals.push(keyword);
        }
      }
    }
    
    return signals;
  }

  private calculateWorkLifeScore(sentiment: SentimentAnalysis, stressIndicators: string[], flexibilityMentions: string[]): number {
    let score = sentiment.overallScore + 50; // Base on sentiment, normalize to 0-100
    
    // Deduct for stress indicators
    score -= stressIndicators.length * 10;
    
    // Add for flexibility mentions
    score += flexibilityMentions.length * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  private generateWorkLifeInsights(sentiment: SentimentAnalysis, hours: string[], stressIndicators: string[]): string[] {
    const insights: string[] = [];
    
    if (sentiment.overallScore < -20) {
      insights.push('Consistently negative work-life balance feedback');
    }
    
    if (hours.length > 0) {
      insights.push(`Working hours mentioned: ${hours.join(', ')}`);
    }
    
    if (stressIndicators.length > 3) {
      insights.push('High stress levels reported by multiple employees');
    }
    
    return insights;
  }

  private calculateCultureCompatibility(culture: CulturalFitAnalysis, preferences: any): number {
    let score = 50; // Base score
    
    // Work style compatibility
    if (preferences.workStyle === culture.workStyle) score += 20;
    
    // Pace compatibility
    if (preferences.pace === culture.pace) score += 15;
    
    // Innovation compatibility
    if (preferences.innovation === culture.innovation) score += 15;
    
    return Math.min(100, score);
  }

  private findCultureMatches(culture: CulturalFitAnalysis, preferences: any): string[] {
    const matches: string[] = [];
    
    if (preferences.workStyle === culture.workStyle) {
      matches.push(`Work style: ${culture.workStyle}`);
    }
    
    if (preferences.diversity && culture.diversity > 70) {
      matches.push('Strong diversity and inclusion');
    }
    
    return matches;
  }

  private findCultureMismatches(culture: CulturalFitAnalysis, preferences: any): string[] {
    const mismatches: string[] = [];
    
    if (preferences.workStyle !== culture.workStyle) {
      mismatches.push(`Work style: prefers ${preferences.workStyle} but company is ${culture.workStyle}`);
    }
    
    if (preferences.pace !== culture.pace) {
      mismatches.push(`Pace: prefers ${preferences.pace} but company is ${culture.pace}`);
    }
    
    return mismatches;
  }

  private generateCultureRecommendations(compatibilityScore: number, culture: CulturalFitAnalysis): string[] {
    const recommendations: string[] = [];
    
    if (compatibilityScore > 80) {
      recommendations.push('Excellent culture fit - proceed with confidence');
    } else if (compatibilityScore > 60) {
      recommendations.push('Good culture fit with some areas to clarify');
    } else {
      recommendations.push('Cultural misalignment - consider carefully');
    }
    
    return recommendations;
  }

  // Additional helper methods (simplified implementations)
  private extractRole(review: string): string {
    const roleKeywords = ['engineer', 'manager', 'analyst', 'director', 'specialist'];
    for (const role of roleKeywords) {
      if (review.toLowerCase().includes(role)) return role;
    }
    return 'Unknown';
  }

  private extractTenure(review: string): string {
    const tenureRegex = /(\d+)\s*(year|month)/i;
    const match = review.match(tenureRegex);
    return match ? match[0] : 'Unknown';
  }

  private extractDepartment(review: string): string {
    const departments = ['engineering', 'sales', 'marketing', 'hr', 'finance'];
    for (const dept of departments) {
      if (review.toLowerCase().includes(dept)) return dept;
    }
    return 'Unknown';
  }

  private extractKeyPoints(review: string): string[] {
    // Extract sentences with strong sentiment
    const sentences = review.split(/[.!?]+/);
    return sentences
      .filter(s => Math.abs(this.calculateSentimentScore(this.tokenizer.tokenize(s), s)) > 30)
      .slice(0, 3);
  }

  private assessCredibility(review: string): number {
    let credibility = 50;
    
    // Length indicates thoughtfulness
    if (review.length > 200) credibility += 20;
    
    // Specific examples increase credibility
    if (review.includes('example') || review.includes('specifically')) credibility += 15;
    
    // Balanced view increases credibility
    const sentiment = this.analyzeSentiment(review);
    if (Math.abs(sentiment.overallScore) < 30) credibility += 10; // Not extremely biased
    
    return Math.min(100, credibility);
  }

  // Cultural analysis helper methods
  private determineWorkStyle(text: string): 'collaborative' | 'independent' | 'hierarchical' | 'flat' {
    if (text.includes('collaborative') || text.includes('team')) return 'collaborative';
    if (text.includes('independent') || text.includes('autonomous')) return 'independent';
    if (text.includes('hierarchical') || text.includes('top-down')) return 'hierarchical';
    return 'flat';
  }

  private determinePace(text: string): 'fast' | 'moderate' | 'relaxed' {
    if (text.includes('fast-paced') || text.includes('urgent')) return 'fast';
    if (text.includes('relaxed') || text.includes('slow')) return 'relaxed';
    return 'moderate';
  }

  private determineInnovationType(text: string): 'cutting_edge' | 'stable' | 'traditional' {
    if (text.includes('innovative') || text.includes('cutting edge')) return 'cutting_edge';
    if (text.includes('traditional') || text.includes('conservative')) return 'traditional';
    return 'stable';
  }

  private determineCommunicationStyle(text: string): 'direct' | 'diplomatic' | 'formal' | 'casual' {
    if (text.includes('direct') || text.includes('straightforward')) return 'direct';
    if (text.includes('diplomatic') || text.includes('polite')) return 'diplomatic';
    if (text.includes('formal') || text.includes('professional')) return 'formal';
    return 'casual';
  }

  private assessDiversity(text: string): number {
    const diversityKeywords = ['diverse', 'diversity', 'inclusive', 'multicultural'];
    let score = 50;
    
    for (const keyword of diversityKeywords) {
      if (text.includes(keyword)) score += 15;
    }
    
    return Math.min(100, score);
  }

  private assessInclusivity(text: string): number {
    const inclusivityKeywords = ['inclusive', 'welcoming', 'belonging', 'respect'];
    let score = 50;
    
    for (const keyword of inclusivityKeywords) {
      if (text.includes(keyword)) score += 12;
    }
    
    return Math.min(100, score);
  }

  private extractValues(text: string): string[] {
    const commonValues = ['integrity', 'innovation', 'collaboration', 'excellence', 'respect', 'transparency'];
    return commonValues.filter(value => text.toLowerCase().includes(value));
  }

  private extractPerks(text: string): CompanyPerk[] {
    const perks: CompanyPerk[] = [];
    const perkKeywords = new Map([
      ['remote work', 'flexibility'],
      ['health insurance', 'benefits'],
      ['free food', 'culture'],
      ['gym membership', 'benefits'],
      ['stock options', 'compensation'],
      ['flexible hours', 'flexibility']
    ]);

    for (const [perk, category] of perkKeywords) {
      if (text.toLowerCase().includes(perk)) {
        perks.push({
          category: category as any,
          description: perk,
          frequency: 1,
          sentiment: 0.6
        });
      }
    }

    return perks;
  }

  // Red flag detection methods
  private detectManagementIssues(text: string): { frequency: number; examples: string[] } {
    const issueKeywords = ['micromanage', 'bad manager', 'poor leadership', 'incompetent'];
    let frequency = 0;
    const examples: string[] = [];

    for (const keyword of issueKeywords) {
      const regex = new RegExp(keyword, 'gi');
      const matches = text.match(regex);
      if (matches) {
        frequency += matches.length;
        examples.push(keyword);
      }
    }

    return { frequency, examples };
  }

  private detectToxicCulture(text: string): { frequency: number; examples: string[] } {
    const toxicKeywords = ['toxic', 'hostile', 'discrimination', 'harassment', 'bullying'];
    let frequency = 0;
    const examples: string[] = [];

    for (const keyword of toxicKeywords) {
      const regex = new RegExp(keyword, 'gi');
      const matches = text.match(regex);
      if (matches) {
        frequency += matches.length;
        examples.push(keyword);
      }
    }

    return { frequency, examples };
  }

  private detectWorkLifeIssues(text: string): { frequency: number; examples: string[] } {
    const workLifeIssues = ['overworked', 'burnout', 'no work life balance', 'excessive hours'];
    let frequency = 0;
    const examples: string[] = [];

    for (const issue of workLifeIssues) {
      const regex = new RegExp(issue, 'gi');
      const matches = text.match(regex);
      if (matches) {
        frequency += matches.length;
        examples.push(issue);
      }
    }

    return { frequency, examples };
  }

  // Strength detection methods
  private detectGoodManagement(text: string): { score: number; evidence: string[] } {
    const goodManagementKeywords = ['great manager', 'supportive', 'good leadership', 'helpful manager'];
    let score = 0;
    const evidence: string[] = [];

    for (const keyword of goodManagementKeywords) {
      if (text.includes(keyword)) {
        score += 15;
        evidence.push(keyword);
      }
    }

    return { score: Math.min(100, score), evidence };
  }

  private detectGreatCulture(text: string): { score: number; evidence: string[] } {
    const cultureKeywords = ['great culture', 'amazing culture', 'positive environment', 'inclusive'];
    let score = 0;
    const evidence: string[] = [];

    for (const keyword of cultureKeywords) {
      if (text.includes(keyword)) {
        score += 20;
        evidence.push(keyword);
      }
    }

    return { score: Math.min(100, score), evidence };
  }

  private detectCareerGrowth(text: string): { score: number; evidence: string[] } {
    const growthKeywords = ['career growth', 'promotion', 'learning opportunities', 'development'];
    let score = 0;
    const evidence: string[] = [];

    for (const keyword of growthKeywords) {
      if (text.includes(keyword)) {
        score += 15;
        evidence.push(keyword);
      }
    }

    return { score: Math.min(100, score), evidence };
  }

  private identifyKeyChanges(recentReviews: string[], olderReviews: string[]): string[] {
    // Simplified change detection
    const changes: string[] = [];
    
    const recentText = recentReviews.join(' ').toLowerCase();
    const olderText = olderReviews.join(' ').toLowerCase();
    
    if (recentText.includes('new management') && !olderText.includes('new management')) {
      changes.push('New management team');
    }
    
    if (recentText.includes('layoffs') && !olderText.includes('layoffs')) {
      changes.push('Recent layoffs reported');
    }
    
    if (recentText.includes('remote work') && !olderText.includes('remote work')) {
      changes.push('Remote work policy changes');
    }
    
    return changes;
  }
}