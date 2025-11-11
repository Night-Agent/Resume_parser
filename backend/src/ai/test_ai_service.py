#!/usr/bin/env python3
"""
Test script for Resume AI Service
"""

import requests
import json

def test_ai_service():
    """Test the AI service with sample resume data"""
    
    # Sample resume text for testing
    sample_resume = """
    John Smith
    Senior Full-Stack Developer
    john.smith@email.com | (555) 123-4567 | linkedin.com/in/johnsmith
    
    Professional Summary
    Innovative and result-driven Full-Stack Developer with 8+ years of experience in designing, 
    developing, and deploying large-scale enterprise-grade applications. Expert in React, Node.js, 
    Python, and cloud technologies.
    
    Technical Skills
    • Programming Languages: JavaScript, TypeScript, Python, Java, C++
    • Frontend: React, Vue.js, Angular, HTML5, CSS3, Tailwind CSS
    • Backend: Node.js, Express.js, Django, Flask, Spring Boot
    • Databases: MongoDB, PostgreSQL, MySQL, Redis
    • Cloud & DevOps: AWS, Docker, Kubernetes, Jenkins, Terraform
    • AI/ML: TensorFlow, PyTorch, Scikit-learn, Pandas, NumPy
    
    Professional Experience
    
    Lead Full-Stack Developer | TechCorp Inc. | Jan 2020 – Present
    • Architected a multi-tenant SaaS platform serving 50,000+ active users
    • Built microservices-based backend with Node.js and MongoDB
    • Implemented AI-powered recommendation engines and predictive analytics
    • Led a team of 12 engineers across frontend, backend, and ML modules
    
    Senior Software Engineer | InnovaTech Labs | Mar 2017 – Dec 2019
    • Developed real-time analytics dashboard for IoT devices
    • Optimized PostgreSQL and Redis caching for 1M+ concurrent requests
    • Designed end-to-end CI/CD pipeline with Docker and Kubernetes
    
    Education
    Master of Science in Computer Science | Stanford University | 2017
    Bachelor of Science in Software Engineering | UC Berkeley | 2015
    """
    
    base_url = "http://localhost:5001"
    
    print("🧪 Testing Resume AI Service...")
    
    # Test 1: Health check
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        if response.status_code == 200:
            print("✅ Health check passed")
            health_data = response.json()
            print(f"   Status: {health_data.get('status')}")
            print(f"   Models loaded: {health_data.get('models_loaded')}")
        else:
            print("❌ Health check failed")
            return
    except Exception as e:
        print(f"❌ Could not connect to AI service: {e}")
        print("   Make sure the Python AI service is running on port 5001")
        return
    
    # Test 2: Resume analysis
    try:
        print("\n📄 Testing resume analysis...")
        response = requests.post(
            f"{base_url}/analyze",
            json={"text": sample_resume},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ Resume analysis successful")
                analysis = result.get('analysis', {})
                
                print(f"   Experience Level: {analysis.get('experience_level')}")
                print(f"   Quality Score: {analysis.get('quality_score')}/100")
                print(f"   Total Skills: {analysis.get('summary', {}).get('total_skills')}")
                
                skills = analysis.get('skills', {})
                for category, skill_list in skills.items():
                    if skill_list:
                        print(f"   {category.title()}: {', '.join(skill_list[:3])}...")
                
                print(f"   Top Recommendations:")
                for i, rec in enumerate(analysis.get('recommendations', [])[:3], 1):
                    print(f"     {i}. {rec}")
                    
            else:
                print(f"❌ Analysis failed: {result.get('error')}")
        else:
            print(f"❌ Analysis request failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Analysis test failed: {e}")
    
    # Test 3: Skills extraction
    try:
        print("\n🔧 Testing skills extraction...")
        response = requests.post(
            f"{base_url}/skills/extract",
            json={"text": sample_resume},
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ Skills extraction successful")
                print(f"   Total skills found: {result.get('total_skills')}")
                
                skills = result.get('skills', {})
                for category, skill_list in skills.items():
                    if skill_list:
                        print(f"   {category.title()}: {len(skill_list)} skills")
            else:
                print(f"❌ Skills extraction failed: {result.get('error')}")
        else:
            print(f"❌ Skills extraction request failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Skills extraction test failed: {e}")
    
    # Test 4: Job matching
    try:
        print("\n🎯 Testing job matching...")
        
        sample_job_descriptions = [
            "We are looking for a Senior React Developer with 5+ years of experience in JavaScript, TypeScript, and Node.js. Experience with AWS and Docker is a plus.",
            "Python Developer needed for AI/ML projects. Must have experience with TensorFlow, PyTorch, and data science libraries like Pandas and NumPy.",
            "DevOps Engineer position requiring expertise in Kubernetes, Docker, AWS, and CI/CD pipelines. Terraform experience preferred."
        ]
        
        response = requests.post(
            f"{base_url}/match/jobs",
            json={
                "resume_text": sample_resume,
                "job_descriptions": sample_job_descriptions
            },
            timeout=20
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ Job matching successful")
                matches = result.get('matches', [])
                
                for i, match in enumerate(matches[:3], 1):
                    print(f"   Job {i}:")
                    print(f"     Similarity Score: {match.get('similarity_score', 0):.2f}")
                    print(f"     Skill Match: {match.get('skill_match_percent', 0):.1f}%")
                    print(f"     Matching Skills: {', '.join(match.get('matching_skills', [])[:3])}")
                    
            else:
                print(f"❌ Job matching failed: {result.get('error')}")
        else:
            print(f"❌ Job matching request failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Job matching test failed: {e}")
    
    print(f"\n🎉 AI Service testing completed!")
    print(f"   Visit http://localhost:5001/health for service status")

if __name__ == "__main__":
    test_ai_service()