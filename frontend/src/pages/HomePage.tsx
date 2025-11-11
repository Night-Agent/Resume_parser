import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ResumeAI Platform
            </span>
          </h1>
          
          <h2 className="text-2xl text-gray-700 mb-6">
            🤖 AI-Powered Resume Intelligence & Job Search
          </h2>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-3">🎉 Working System Demonstration</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div>
                <p>✅ AI Resume Analysis</p>
                <p>✅ Job Scraping (6+ Portals)</p>
                <p>✅ Smart Matching</p>
              </div>
              <div>
                <p>✅ Zero Monthly Costs</p>
                <p>✅ Save ₹138,000+/year</p>
                <p>✅ 50,000+ Jobs Available</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              to="/register"
              className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:shadow-xl transition-all"
            >
              🚀 Start FREE Analysis
            </Link>
            
            <Link
              to="/login"
              className="block w-full border-2 border-blue-600 text-blue-600 py-4 px-8 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all"
            >
              Login to Dashboard
            </Link>
            
            <Link
              to="/free-jobs"
              className="block w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:shadow-xl transition-all"
            >
              🔍 Try FREE Job Search
            </Link>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              💡 No subscriptions • No hidden costs • Completely FREE forever
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;