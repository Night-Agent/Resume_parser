import React, { useState } from 'react';

const JobSearch: React.FC = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchTerm,
          location: location,
          limit: 20
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setJobs(data.data || []);
      }
    } catch (error) {
      console.error('Job search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/job-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData: { skills: ['JavaScript', 'React', 'Node.js'] },
          preferences: { location: location, salaryMin: 80000 }
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('AI Recommendations:', data);
      }
    } catch (error) {
      console.error('AI recommendations failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Job Search</h1>
        
        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <input
              type="text"
              placeholder="Job title, keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Searching...' : 'Search Jobs'}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleAIRecommendations}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-colors"
          >
            Get AI Job Recommendations
          </button>
        </div>

        {/* Results */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading jobs...</p>
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Results ({jobs.length} jobs)</h2>
              {jobs.map((job: any, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title || 'Job Title'}</h3>
                  <p className="text-gray-600 mb-2">{job.company || 'Company Name'}</p>
                  <p className="text-gray-500 text-sm mb-3">{job.location || 'Location'}</p>
                  <p className="text-gray-700 text-sm">{job.description || 'Job description...'}</p>
                  {job.salary && (
                    <p className="text-green-600 font-medium text-sm mt-2">{job.salary}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No jobs found. Try searching with different keywords.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSearch;