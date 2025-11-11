#!/usr/bin/env python3
"""
AI-Powered Resume Analysis Service
Real AI/ML implementation using Python with multiple models
"""

import os
import sys
import json
import logging
import re
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import hashlib
import pickle

# ML and NLP libraries
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
import spacy
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from textblob import TextBlob

# Deep learning
import torch
import transformers
from transformers import pipeline, AutoTokenizer, AutoModel

# PDF and document processing
import PyPDF2
import docx2txt
import pdfplumber

# Web framework
from flask import Flask, request, jsonify
from flask_cors import CORS

# OpenAI integration
import openai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResumeAIAnalyzer:
    """
    Advanced AI-powered resume analysis using multiple ML models
    """
    
    def __init__(self):
        self.setup_models()
        self.setup_skills_database()
        self.setup_openai()
        
    def setup_models(self):
        """Initialize ML models and NLP tools"""
        try:
            # Load spaCy model for NER
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("spaCy model not found. Installing...")
            os.system("python -m spacy download en_core_web_sm")
            self.nlp = spacy.load("en_core_web_sm")
        
        # Download NLTK data
        try:
            nltk.data.find('tokenizers/punkt')
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('punkt')
            nltk.download('stopwords')
        
        self.stop_words = set(stopwords.words('english'))
        
        # Initialize BERT model for embeddings
        try:
            self.bert_tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
            self.bert_model = AutoModel.from_pretrained('bert-base-uncased')
            logger.info("BERT model loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load BERT model: {e}")
            self.bert_tokenizer = None
            self.bert_model = None
        
        # Initialize sentiment analysis
        try:
            self.sentiment_analyzer = pipeline("sentiment-analysis")
            logger.info("Sentiment analysis model loaded")
        except Exception as e:
            logger.warning(f"Could not load sentiment model: {e}")
            self.sentiment_analyzer = None
    
    def setup_skills_database(self):
        """Setup comprehensive skills database"""
        self.skills_database = {
            'programming': [
                'python', 'javascript', 'java', 'c++', 'c#', 'go', 'rust', 'typescript',
                'php', 'ruby', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql'
            ],
            'web_development': [
                'react', 'vue.js', 'angular', 'node.js', 'express.js', 'django', 'flask',
                'spring boot', 'laravel', 'next.js', 'nuxt.js', 'svelte', 'html', 'css',
                'sass', 'less', 'tailwind css', 'bootstrap'
            ],
            'databases': [
                'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
                'dynamodb', 'oracle', 'sqlite', 'neo4j', 'influxdb', 'snowflake'
            ],
            'cloud_platforms': [
                'aws', 'azure', 'google cloud', 'gcp', 'heroku', 'digitalocean',
                'linode', 'vercel', 'netlify', 'firebase'
            ],
            'devops': [
                'docker', 'kubernetes', 'jenkins', 'gitlab ci', 'github actions',
                'terraform', 'ansible', 'chef', 'puppet', 'vagrant', 'nginx', 'apache'
            ],
            'ai_ml': [
                'tensorflow', 'pytorch', 'scikit-learn', 'keras', 'pandas', 'numpy',
                'matplotlib', 'seaborn', 'opencv', 'nltk', 'spacy', 'transformers',
                'bert', 'gpt', 'llama', 'yolo', 'resnet'
            ],
            'mobile': [
                'react native', 'flutter', 'ios', 'android', 'swift', 'kotlin',
                'xamarin', 'ionic', 'cordova', 'phonegap'
            ],
            'blockchain': [
                'ethereum', 'solidity', 'bitcoin', 'web3.js', 'truffle', 'hardhat',
                'metamask', 'defi', 'nft', 'smart contracts'
            ]
        }
        
        # Flatten skills for easy lookup
        self.all_skills = []
        for category, skills in self.skills_database.items():
            self.all_skills.extend(skills)
    
    def setup_openai(self):
        """Setup OpenAI client"""
        openai_key = os.getenv('OPENAI_API_KEY')
        if openai_key:
            openai.api_key = openai_key
            self.openai_enabled = True
            logger.info("OpenAI integration enabled")
        else:
            self.openai_enabled = False
            logger.warning("OpenAI API key not found. AI features will be limited.")
    
    def extract_text_from_file(self, file_path: str) -> str:
        """Extract text from PDF or DOCX files"""
        try:
            if file_path.lower().endswith('.pdf'):
                return self.extract_pdf_text(file_path)
            elif file_path.lower().endswith('.docx'):
                return docx2txt.process(file_path)
            else:
                with open(file_path, 'r', encoding='utf-8') as file:
                    return file.read()
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {e}")
            return ""
    
    def extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF using multiple methods"""
        text = ""
        
        # Method 1: pdfplumber (better for complex layouts)
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            if text.strip():
                return text
        except Exception as e:
            logger.warning(f"pdfplumber failed: {e}")
        
        # Method 2: PyPDF2 (fallback)
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            logger.error(f"PyPDF2 also failed: {e}")
        
        return text
    
    def extract_contact_info(self, text: str) -> Dict[str, Any]:
        """Extract contact information using regex and NLP"""
        contact_info = {}
        
        # Email extraction
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        contact_info['emails'] = emails
        
        # Phone number extraction
        phone_patterns = [
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            r'\(\d{3}\)\s*\d{3}[-.]?\d{4}',
            r'\+\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}'
        ]
        phones = []
        for pattern in phone_patterns:
            phones.extend(re.findall(pattern, text))
        contact_info['phones'] = phones
        
        # LinkedIn profile
        linkedin_pattern = r'linkedin\.com/in/[\w-]+'
        linkedin = re.findall(linkedin_pattern, text.lower())
        contact_info['linkedin'] = linkedin
        
        # GitHub profile
        github_pattern = r'github\.com/[\w-]+'
        github = re.findall(github_pattern, text.lower())
        contact_info['github'] = github
        
        return contact_info
    
    def extract_skills(self, text: str) -> Dict[str, List[str]]:
        """Extract skills using ML and pattern matching"""
        text_lower = text.lower()
        found_skills = {category: [] for category in self.skills_database.keys()}
        
        # Pattern-based extraction
        for category, skills in self.skills_database.items():
            for skill in skills:
                if skill in text_lower:
                    found_skills[category].append(skill)
        
        # NLP-based extraction using spaCy
        doc = self.nlp(text)
        
        # Extract potential skills from noun phrases
        for chunk in doc.noun_chunks:
            chunk_text = chunk.text.lower().strip()
            if len(chunk_text) > 2 and chunk_text in self.all_skills:
                for category, skills in self.skills_database.items():
                    if chunk_text in skills and chunk_text not in found_skills[category]:
                        found_skills[category].append(chunk_text)
        
        # Remove empty categories
        found_skills = {k: v for k, v in found_skills.items() if v}
        
        return found_skills
    
    def extract_experience(self, text: str) -> List[Dict[str, Any]]:
        """Extract work experience using NLP"""
        doc = self.nlp(text)
        experiences = []
        
        # Look for job titles and organizations
        organizations = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
        
        # Extract date ranges
        date_patterns = [
            r'\b\d{4}\s*[-–]\s*\d{4}\b',
            r'\b\d{4}\s*[-–]\s*present\b',
            r'\b[A-Za-z]+\s+\d{4}\s*[-–]\s*[A-Za-z]+\s+\d{4}\b'
        ]
        
        dates = []
        for pattern in date_patterns:
            dates.extend(re.findall(pattern, text, re.IGNORECASE))
        
        # Extract job titles (common patterns)
        job_title_keywords = [
            'engineer', 'developer', 'manager', 'analyst', 'consultant',
            'director', 'coordinator', 'specialist', 'architect', 'lead'
        ]
        
        sentences = sent_tokenize(text)
        for sentence in sentences:
            sentence_lower = sentence.lower()
            for keyword in job_title_keywords:
                if keyword in sentence_lower:
                    # Extract potential job title
                    words = word_tokenize(sentence)
                    for i, word in enumerate(words):
                        if keyword in word.lower():
                            # Get surrounding context
                            start = max(0, i-3)
                            end = min(len(words), i+4)
                            title = ' '.join(words[start:end])
                            
                            experiences.append({
                                'title': title.strip(),
                                'description': sentence,
                                'organizations': [org for org in organizations if org.lower() in sentence.lower()]
                            })
                            break
        
        return experiences[:5]  # Limit to top 5 experiences
    
    def extract_education(self, text: str) -> List[Dict[str, Any]]:
        """Extract education information"""
        doc = self.nlp(text)
        education = []
        
        # Educational keywords
        edu_keywords = [
            'university', 'college', 'institute', 'school', 'bachelor', 'master',
            'phd', 'doctorate', 'degree', 'diploma', 'certification'
        ]
        
        # Extract educational institutions
        organizations = [ent.text for ent in doc.ents if ent.label_ == "ORG"]
        edu_orgs = [org for org in organizations 
                   if any(keyword in org.lower() for keyword in edu_keywords)]
        
        # Extract degrees
        degree_patterns = [
            r'\b[A-Z][A-Za-z]*\.?\s+of\s+[A-Z][A-Za-z\s]+',
            r'\b(Bachelor|Master|PhD|Doctorate)\s+[of in]+\s+[A-Za-z\s]+',
            r'\b(BS|BA|MS|MA|PhD)\s+[A-Za-z\s]+'
        ]
        
        degrees = []
        for pattern in degree_patterns:
            degrees.extend(re.findall(pattern, text, re.IGNORECASE))
        
        for i, degree in enumerate(degrees[:3]):  # Limit to 3 degrees
            education.append({
                'degree': degree.strip(),
                'institution': edu_orgs[i] if i < len(edu_orgs) else 'Unknown',
                'field': self.extract_field_of_study(degree)
            })
        
        return education
    
    def extract_field_of_study(self, degree_text: str) -> str:
        """Extract field of study from degree text"""
        fields = {
            'computer science': ['computer science', 'cs', 'computing'],
            'engineering': ['engineering', 'engineer'],
            'business': ['business', 'management', 'mba'],
            'mathematics': ['mathematics', 'math', 'statistics'],
            'physics': ['physics', 'physical'],
            'data science': ['data science', 'data analytics']
        }
        
        degree_lower = degree_text.lower()
        for field, keywords in fields.items():
            if any(keyword in degree_lower for keyword in keywords):
                return field
        
        return 'Other'
    
    def calculate_experience_level(self, text: str) -> str:
        """Calculate experience level using ML"""
        # Extract years of experience
        year_patterns = [
            r'(\d+)\+?\s*years?\s*of\s*experience',
            r'(\d+)\+?\s*years?\s*in',
            r'experience\s*of\s*(\d+)\+?\s*years?'
        ]
        
        years = []
        for pattern in year_patterns:
            matches = re.findall(pattern, text.lower())
            years.extend([int(match) for match in matches])
        
        if years:
            max_years = max(years)
            if max_years >= 8:
                return 'Senior'
            elif max_years >= 3:
                return 'Mid-level'
            else:
                return 'Junior'
        
        # Fallback: analyze job titles
        senior_keywords = ['senior', 'lead', 'principal', 'director', 'manager']
        if any(keyword in text.lower() for keyword in senior_keywords):
            return 'Senior'
        
        return 'Mid-level'
    
    def analyze_resume_quality(self, text: str, extracted_data: Dict) -> Dict[str, Any]:
        """Analyze resume quality using multiple metrics"""
        quality_score = 0
        feedback = []
        
        # Length check
        word_count = len(word_tokenize(text))
        if 300 <= word_count <= 800:
            quality_score += 20
            feedback.append("✅ Good resume length")
        elif word_count < 300:
            feedback.append("⚠️ Resume seems too short. Add more details about your experience.")
        else:
            feedback.append("⚠️ Resume might be too long. Consider condensing to 1-2 pages.")
        
        # Contact information
        contact_info = extracted_data.get('contact_info', {})
        if contact_info.get('emails'):
            quality_score += 15
            feedback.append("✅ Email address found")
        else:
            feedback.append("❌ Missing email address")
        
        if contact_info.get('phones'):
            quality_score += 10
            feedback.append("✅ Phone number found")
        
        # Skills assessment
        skills = extracted_data.get('skills', {})
        total_skills = sum(len(skill_list) for skill_list in skills.values())
        if total_skills >= 10:
            quality_score += 25
            feedback.append("✅ Good variety of technical skills")
        elif total_skills >= 5:
            quality_score += 15
            feedback.append("✅ Decent technical skills listed")
        else:
            feedback.append("⚠️ Consider adding more technical skills")
        
        # Experience check
        experience = extracted_data.get('experience', [])
        if len(experience) >= 2:
            quality_score += 20
            feedback.append("✅ Multiple work experiences listed")
        elif len(experience) >= 1:
            quality_score += 10
            feedback.append("✅ Work experience found")
        else:
            feedback.append("⚠️ Add more details about your work experience")
        
        # Education check
        education = extracted_data.get('education', [])
        if education:
            quality_score += 10
            feedback.append("✅ Education information found")
        
        return {
            'score': min(quality_score, 100),
            'feedback': feedback,
            'grade': self.get_quality_grade(quality_score)
        }
    
    def get_quality_grade(self, score: int) -> str:
        """Convert quality score to grade"""
        if score >= 90:
            return 'A+'
        elif score >= 80:
            return 'A'
        elif score >= 70:
            return 'B+'
        elif score >= 60:
            return 'B'
        elif score >= 50:
            return 'C+'
        else:
            return 'C'
    
    def generate_ai_recommendations(self, extracted_data: Dict) -> List[str]:
        """Generate AI-powered recommendations"""
        if not self.openai_enabled:
            return self.generate_fallback_recommendations(extracted_data)
        
        try:
            # Prepare prompt for OpenAI
            skills = extracted_data.get('skills', {})
            experience_level = extracted_data.get('experience_level', 'Unknown')
            quality_analysis = extracted_data.get('quality_analysis', {})
            
            prompt = f"""
            Analyze this resume data and provide 5 specific, actionable recommendations:
            
            Skills: {skills}
            Experience Level: {experience_level}
            Quality Score: {quality_analysis.get('score', 0)}/100
            Current Feedback: {quality_analysis.get('feedback', [])}
            
            Provide recommendations to improve the resume for better job prospects.
            """
            
            response = openai.Completion.create(
                engine="text-davinci-003",
                prompt=prompt,
                max_tokens=300,
                temperature=0.7
            )
            
            recommendations = response.choices[0].text.strip().split('\n')
            return [rec.strip() for rec in recommendations if rec.strip()][:5]
            
        except Exception as e:
            logger.error(f"OpenAI recommendation error: {e}")
            return self.generate_fallback_recommendations(extracted_data)
    
    def generate_fallback_recommendations(self, extracted_data: Dict) -> List[str]:
        """Generate recommendations without OpenAI"""
        recommendations = []
        skills = extracted_data.get('skills', {})
        experience_level = extracted_data.get('experience_level', 'Unknown')
        
        # Skill-based recommendations
        if len(skills.get('programming', [])) < 3:
            recommendations.append("Consider adding more programming languages to broaden your technical profile")
        
        if not skills.get('cloud_platforms', []):
            recommendations.append("Add cloud platform experience (AWS, Azure, GCP) as it's highly demanded")
        
        if not skills.get('ai_ml', []) and any('data' in exp.get('title', '').lower() for exp in extracted_data.get('experience', [])):
            recommendations.append("Include AI/ML skills if you work with data - it's a growing field")
        
        # Experience-based recommendations
        if experience_level == 'Junior':
            recommendations.append("Highlight any projects, internships, or certifications to strengthen your profile")
        
        if not extracted_data.get('contact_info', {}).get('linkedin'):
            recommendations.append("Add your LinkedIn profile URL to make it easier for recruiters to find you")
        
        return recommendations[:5]
    
    def analyze_resume(self, file_path: str = None, text: str = None) -> Dict[str, Any]:
        """
        Complete resume analysis using AI/ML
        """
        try:
            # Extract text
            if file_path:
                resume_text = self.extract_text_from_file(file_path)
            elif text:
                resume_text = text
            else:
                raise ValueError("Either file_path or text must be provided")
            
            if not resume_text.strip():
                raise ValueError("No text could be extracted from the resume")
            
            # Extract structured data
            contact_info = self.extract_contact_info(resume_text)
            skills = self.extract_skills(resume_text)
            experience = self.extract_experience(resume_text)
            education = self.extract_education(resume_text)
            experience_level = self.calculate_experience_level(resume_text)
            
            # Prepare extracted data
            extracted_data = {
                'contact_info': contact_info,
                'skills': skills,
                'experience': experience,
                'education': education,
                'experience_level': experience_level
            }
            
            # Analyze quality
            quality_analysis = self.analyze_resume_quality(resume_text, extracted_data)
            extracted_data['quality_analysis'] = quality_analysis
            
            # Generate recommendations
            recommendations = self.generate_ai_recommendations(extracted_data)
            
            # Calculate matching scores for different roles
            role_matches = self.calculate_role_matches(skills)
            
            return {
                'success': True,
                'analysis': {
                    'contact_info': contact_info,
                    'skills': skills,
                    'experience': experience,
                    'education': education,
                    'experience_level': experience_level,
                    'quality_score': quality_analysis['score'],
                    'quality_grade': quality_analysis['grade'],
                    'feedback': quality_analysis['feedback'],
                    'recommendations': recommendations,
                    'role_matches': role_matches,
                    'summary': {
                        'total_skills': sum(len(skill_list) for skill_list in skills.values()),
                        'years_experience': self.extract_years_experience(resume_text),
                        'education_count': len(education),
                        'word_count': len(word_tokenize(resume_text))
                    }
                },
                'processed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Resume analysis error: {e}")
            return {
                'success': False,
                'error': str(e),
                'processed_at': datetime.now().isoformat()
            }
    
    def extract_years_experience(self, text: str) -> int:
        """Extract years of experience from text"""
        year_patterns = [
            r'(\d+)\+?\s*years?\s*of\s*experience',
            r'(\d+)\+?\s*years?\s*in',
            r'experience\s*of\s*(\d+)\+?\s*years?'
        ]
        
        years = []
        for pattern in year_patterns:
            matches = re.findall(pattern, text.lower())
            years.extend([int(match) for match in matches])
        
        return max(years) if years else 0
    
    def calculate_role_matches(self, skills: Dict[str, List[str]]) -> Dict[str, int]:
        """Calculate match percentage for different roles"""
        role_requirements = {
            'Full Stack Developer': {
                'programming': 3,
                'web_development': 4,
                'databases': 2,
                'cloud_platforms': 1
            },
            'Data Scientist': {
                'programming': 2,
                'ai_ml': 4,
                'databases': 2,
                'cloud_platforms': 1
            },
            'DevOps Engineer': {
                'programming': 2,
                'devops': 5,
                'cloud_platforms': 3,
                'databases': 1
            },
            'Mobile Developer': {
                'programming': 3,
                'mobile': 4,
                'databases': 1,
                'cloud_platforms': 1
            },
            'Machine Learning Engineer': {
                'programming': 3,
                'ai_ml': 5,
                'cloud_platforms': 2,
                'databases': 2
            }
        }
        
        matches = {}
        for role, requirements in role_requirements.items():
            total_required = sum(requirements.values())
            user_score = 0
            
            for category, required_count in requirements.items():
                user_skills_count = len(skills.get(category, []))
                user_score += min(user_skills_count, required_count)
            
            match_percentage = int((user_score / total_required) * 100)
            matches[role] = match_percentage
        
        return matches

# Flask API setup
app = Flask(__name__)
CORS(app)

# Initialize the AI analyzer
ai_analyzer = ResumeAIAnalyzer()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Resume AI Analyzer',
        'timestamp': datetime.now().isoformat(),
        'models_loaded': {
            'spacy': ai_analyzer.nlp is not None,
            'bert': ai_analyzer.bert_model is not None,
            'sentiment': ai_analyzer.sentiment_analyzer is not None,
            'openai': ai_analyzer.openai_enabled
        }
    })

@app.route('/analyze', methods=['POST'])
def analyze_resume():
    """Analyze resume endpoint"""
    try:
        data = request.get_json()
        
        if 'text' in data:
            # Analyze text directly
            result = ai_analyzer.analyze_resume(text=data['text'])
        elif 'file_path' in data:
            # Analyze file
            result = ai_analyzer.analyze_resume(file_path=data['file_path'])
        else:
            return jsonify({
                'success': False,
                'error': 'Either text or file_path must be provided'
            }), 400
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Analysis endpoint error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/skills/extract', methods=['POST'])
def extract_skills():
    """Extract skills from text"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({
                'success': False,
                'error': 'Text is required'
            }), 400
        
        skills = ai_analyzer.extract_skills(text)
        
        return jsonify({
            'success': True,
            'skills': skills,
            'total_skills': sum(len(skill_list) for skill_list in skills.values())
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/match/jobs', methods=['POST'])
def match_jobs():
    """Match resume with job descriptions"""
    try:
        data = request.get_json()
        resume_text = data.get('resume_text', '')
        job_descriptions = data.get('job_descriptions', [])
        
        if not resume_text or not job_descriptions:
            return jsonify({
                'success': False,
                'error': 'Resume text and job descriptions are required'
            }), 400
        
        # Extract skills from resume
        resume_skills = ai_analyzer.extract_skills(resume_text)
        resume_skills_flat = [skill for skills_list in resume_skills.values() for skill in skills_list]
        
        matches = []
        for i, job_desc in enumerate(job_descriptions):
            job_skills = ai_analyzer.extract_skills(job_desc)
            job_skills_flat = [skill for skills_list in job_skills.values() for skill in skills_list]
            
            # Calculate similarity using TF-IDF and cosine similarity
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform([resume_text, job_desc])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            # Calculate skill overlap
            skill_overlap = len(set(resume_skills_flat) & set(job_skills_flat))
            total_job_skills = len(job_skills_flat)
            skill_match_percent = (skill_overlap / total_job_skills * 100) if total_job_skills > 0 else 0
            
            matches.append({
                'job_index': i,
                'similarity_score': float(similarity),
                'skill_match_percent': skill_match_percent,
                'matching_skills': list(set(resume_skills_flat) & set(job_skills_flat)),
                'missing_skills': list(set(job_skills_flat) - set(resume_skills_flat))
            })
        
        # Sort by similarity score
        matches.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return jsonify({
            'success': True,
            'matches': matches
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Install required packages if not available
    required_packages = [
        'flask', 'flask-cors', 'pandas', 'numpy', 'scikit-learn',
        'spacy', 'nltk', 'textblob', 'torch', 'transformers',
        'PyPDF2', 'python-docx', 'pdfplumber', 'openai'
    ]
    
    print("🤖 Starting AI Resume Analysis Service...")
    print("📚 Loading ML models...")
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5001, debug=True)