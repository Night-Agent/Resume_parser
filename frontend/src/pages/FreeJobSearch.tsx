import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, Clock, DollarSign, ExternalLink, Heart, Zap, Star, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Job {
  id: string;
  title: string;
  company: {
    name: string;
    logo?: string;
  };
  location: string;
  description: string;
  requirements: string[];
  skills: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: string;
  };
  remote: boolean;
  url: string;
  source: string;
  postedDate: string;
  matchPercentage?: number;
}

interface CostComparison {
  name: string;
  cost: string;
  features: string[];
  pros: string[];
  cons: string[];
  recommended?: boolean;
}

const FreeJobSearch: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('India');
  const [costComparison, setCostComparison] = useState<CostComparison[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<Set<string>>(new Set());

  // Load cost comparison on mount
  useEffect(() => {
    const loadCostComparison = async () => {
      try {
        const response = await fetch('/api/free-jobs/cost-comparison', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCostComparison(data.data.options);
        }
      } catch (error) {
        console.error('Failed to load cost comparison:', error);
      }
    };

    loadCostComparison();
  }, []);

  // FREE Job Search
  const searchJobs = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter skills to search for jobs');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        skills: searchQuery,
        location
      });

      const response = await fetch(`/api/free-jobs/free-scrape?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setJobs(data.data.jobs);
        toast.success(
          `🆓 Found ${data.data.jobs.length} jobs for FREE! (₹0 cost)`,
          { duration: 5000 }
        );
      } else {
        toast.error(data.message || 'Failed to search jobs');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('An error occurred while searching jobs');
    } finally {
      setLoading(false);
    }
  };

  // Apply to Job
  const applyToJob = async (job: Job) => {
    setApplying(prev => new Set(prev).add(job.id));
    
    try {
      const response = await fetch(`/api/free-jobs/apply/${job.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customMessage: `I am very interested in the ${job.title} position at ${job.company.name}.`
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`✅ Application submitted via ${data.data.method}!`);
        // Open job URL in new tab
        if (job.url !== '#') {
          window.open(job.url, '_blank');
        }
      } else {
        toast.error(data.message || 'Application failed');
      }
    } catch (error) {
      console.error('Apply error:', error);
      toast.error('Application failed');
    } finally {
      setApplying(prev => {
        const newSet = new Set(prev);
        newSet.delete(job.id);
        return newSet;
      });
    }
  };

  // Save Job
  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
        toast('Job removed from saved', { icon: '💔' });
      } else {
        newSet.add(jobId);
        toast('Job saved!', { icon: '💝' });
      }
      return newSet;
    });
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'indeed_free': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'naukri_free': return 'bg-gradient-to-r from-purple-500 to-purple-600';
      case 'shine_free': return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'monsterindia_free': return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'timesjobs_free': return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'freshersworld_free': return 'bg-gradient-to-r from-teal-500 to-teal-600';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            🆓 FREE Job Search
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4">
            No monthly fees • No n8n costs • No API limits • Unlimited searches
          </p>
          
          <div className="flex justify-center gap-4 mb-6">
            <div className="bg-green-500/20 backdrop-blur-xl rounded-2xl p-4 border border-green-500/30">
              <p className="text-green-400 font-bold text-lg">₹0/month</p>
              <p className="text-gray-300 text-sm">Forever FREE</p>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-xl rounded-2xl p-4 border border-blue-500/30">
              <p className="text-blue-400 font-bold text-lg">6+ Portals</p>
              <p className="text-gray-300 text-sm">Multiple Sources</p>
            </div>
            <div className="bg-purple-500/20 backdrop-blur-xl rounded-2xl p-4 border border-purple-500/30">
              <p className="text-purple-400 font-bold text-lg">Unlimited</p>
              <p className="text-gray-300 text-sm">No Restrictions</p>
            </div>
          </div>

          <button
            onClick={() => setShowComparison(!showComparison)}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300 backdrop-blur-xl border border-white/20"
          >
            💰 Compare with Paid Tools
          </button>
        </motion.div>

        {/* Cost Comparison Modal */}
        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowComparison(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-3xl font-bold text-white mb-6 text-center">
                  💰 Cost Comparison: FREE vs Paid
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {costComparison.map((option, index) => (
                    <div
                      key={index}
                      className={`relative rounded-2xl p-6 border ${
                        option.recommended 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-white/20 bg-white/5'
                      }`}
                    >
                      {option.recommended && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            RECOMMENDED
                          </span>
                        </div>
                      )}
                      
                      <h3 className="text-xl font-bold text-white mb-2">{option.name}</h3>
                      <p className="text-2xl font-bold text-green-400 mb-4">{option.cost}</p>
                      
                      <div className="mb-4">
                        <h4 className="text-green-400 font-semibold mb-2">Pros:</h4>
                        <ul className="text-gray-300 text-sm space-y-1">
                          {option.pros.map((pro, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-green-400 mt-1">✓</span>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-red-400 font-semibold mb-2">Cons:</h4>
                        <ul className="text-gray-300 text-sm space-y-1">
                          {option.cons.map((con, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-red-400 mt-1">✗</span>
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setShowComparison(false)}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300"
                  >
                    Start Using FREE System
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-white/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter skills (e.g., React, Node.js, Python)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  onKeyPress={(e) => e.key === 'Enter' && searchJobs()}
                />
              </div>
            </div>
            
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <motion.button
              onClick={searchJobs}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  FREE Search
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Jobs Results */}
        <AnimatePresence>
          <motion.div className="grid gap-6">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-green-500/50 transition-all duration-300 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-green-300 transition-colors">
                        {job.title}
                      </h3>
                      {job.matchPercentage && (
                        <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded-lg text-sm font-bold">
                          {job.matchPercentage}% match
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-gray-300 mb-3">
                      <span className="font-semibold">{job.company.name}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      {job.remote && (
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg text-xs">
                          Remote
                        </span>
                      )}
                    </div>

                    {job.salary && (
                      <p className="text-green-400 font-semibold mb-3 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {job.salary.currency}{job.salary.min?.toLocaleString()} - {job.salary.currency}{job.salary.max?.toLocaleString()} 
                        <span className="text-sm text-gray-400">/ {job.salary.period}</span>
                      </p>
                    )}

                    <p className="text-gray-400 mb-4 line-clamp-2">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.skills.slice(0, 5).map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-green-500/20 text-green-300 px-3 py-1 rounded-lg text-sm border border-green-500/30"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getSourceColor(job.source)}`}>
                      {job.source.replace('_free', '').toUpperCase()}
                    </div>
                    
                    <div className="text-gray-400 text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(job.postedDate).toLocaleDateString()}
                    </div>

                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => toggleSaveJob(job.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          savedJobs.has(job.id) 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                      >
                        <Heart className="w-5 h-5" fill={savedJobs.has(job.id) ? 'currentColor' : 'none'} />
                      </motion.button>

                      <motion.button
                        onClick={() => applyToJob(job)}
                        disabled={applying.has(job.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                      >
                        {applying.has(job.id) ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            Apply FREE
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {jobs.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search criteria or skills
            </p>
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 max-w-md mx-auto border border-white/20">
              <h4 className="text-lg font-semibold text-white mb-3">💡 Pro Tips:</h4>
              <ul className="text-gray-300 text-sm space-y-2 text-left">
                <li>• Use specific skills like "React", "Python", "Node.js"</li>
                <li>• Try different job titles like "Developer", "Engineer"</li>
                <li>• Search in multiple cities</li>
                <li>• Use our FREE system - no costs involved!</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Success Message */}
        {jobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <div className="bg-green-500/20 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30">
              <h3 className="text-xl font-bold text-green-400 mb-2 flex items-center justify-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Amazing! You just saved money! 
              </h3>
              <p className="text-gray-300">
                This search would cost <span className="text-red-400 font-bold">₹1,500+/month</span> with paid tools, 
                but you got it for <span className="text-green-400 font-bold">₹0 with our FREE system!</span>
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FreeJobSearch;