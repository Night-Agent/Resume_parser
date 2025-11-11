import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, MapPin, Clock, Zap, Brain, Target, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface Job {
  id: string;
  title: string;
  company: {
    name: string;
    logo?: string;
    size?: string;
  };
  location: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  postedDate: string;
  description: string;
  requirements: string[];
  remote: boolean;
  source: string;
  matchPercentage?: number;
  applyUrl: string;
}

interface JobSearchMetadata {
  totalJobs: number;
  duplicatesRemoved: number;
  sourcesUsed: string[];
  fetchTime: number;
  cacheUsed: boolean;
}

const HybridJobSearch: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('India');
  const [filters, setFilters] = useState({
    remote: false,
    minSalary: '',
    companies: [] as string[],
    datePosted: 'all'
  });
  const [metadata, setMetadata] = useState<JobSearchMetadata | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Premium animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  // Hybrid job search function
  const searchJobs = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter skills to search for jobs');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        skills: searchQuery,
        location,
        remote: filters.remote.toString(),
        ...(filters.minSalary && { salaryMin: filters.minSalary }),
        ...(filters.datePosted !== 'all' && { datePosted: filters.datePosted })
      });

      const response = await fetch(`/api/hybrid-jobs/hybrid-search?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setJobs(data.data.jobs);
        setMetadata(data.data.metadata);
        
        toast.success(
          `🎯 Found ${data.data.jobs.length} jobs! ${data.data.metadata.duplicatesRemoved} duplicates removed`,
          { duration: 4000 }
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
  }, [searchQuery, location, filters]);

  // Real-time job monitoring
  const toggleRealTime = useCallback(() => {
    if (!isRealTimeEnabled) {
      // Start real-time monitoring
      const eventSource = new EventSource('/api/hybrid-jobs/real-time-stream', {
        // Add auth headers if needed
      });

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          toast.success('🔴 Real-time job monitoring active');
        } else if (data.type === 'new_job') {
          setJobs(prevJobs => [data.job, ...prevJobs]);
          toast(`💼 New job alert: ${data.job.title} at ${data.job.company.name}`, {
            icon: '🆕',
            duration: 6000
          });
        }
      };

      eventSource.onerror = () => {
        toast.error('Real-time connection lost');
        setIsRealTimeEnabled(false);
      };

      eventSourceRef.current = eventSource;
      setIsRealTimeEnabled(true);
    } else {
      // Stop real-time monitoring
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsRealTimeEnabled(false);
      toast('Real-time monitoring stopped', { icon: '⏹️' });
    }
  }, [isRealTimeEnabled]);

  // Load analytics on mount
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch('/api/hybrid-jobs/analytics', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          await response.json();
          // Analytics data loaded successfully
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      }
    };

    loadAnalytics();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'n8n': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'jsearch': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'adzuna': return 'bg-gradient-to-r from-green-500 to-teal-500';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center mb-8"
        >
          <motion.h1
            variants={itemVariants}
            className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4"
          >
            Hybrid AI Job Search
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-xl text-gray-300 max-w-3xl mx-auto"
          >
            Powered by n8n automation + multiple APIs with intelligent deduplication
          </motion.p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          variants={itemVariants}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-white/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter skills (e.g., React, Node.js, Python)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <motion.button
              onClick={searchJobs}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Hybrid Search
                </>
              )}
            </motion.button>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="flex items-center space-x-2 text-white">
              <input
                type="checkbox"
                checked={filters.remote}
                onChange={(e) => setFilters({...filters, remote: e.target.checked})}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span>Remote Only</span>
            </label>

            <select
              value={filters.datePosted}
              onChange={(e) => setFilters({...filters, datePosted: e.target.value})}
              className="bg-white/10 border border-white/20 rounded-xl text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Any Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <input
              type="number"
              placeholder="Min Salary (₹)"
              value={filters.minSalary}
              onChange={(e) => setFilters({...filters, minSalary: e.target.value})}
              className="bg-white/10 border border-white/20 rounded-xl text-white px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <motion.button
              onClick={toggleRealTime}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                isRealTimeEnabled
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                  : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Zap className={`w-4 h-4 ${isRealTimeEnabled ? 'animate-pulse' : ''}`} />
              {isRealTimeEnabled ? 'Live Active' : 'Enable Live'}
            </motion.button>
          </div>
        </motion.div>

        {/* Metadata and Stats */}
        {metadata && (
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-blue-400 text-sm font-medium">Total Jobs</p>
                  <p className="text-white text-2xl font-bold">{metadata.totalJobs}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-3">
                <Filter className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-purple-400 text-sm font-medium">Duplicates Removed</p>
                  <p className="text-white text-2xl font-bold">{metadata.duplicatesRemoved}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-green-400 text-sm font-medium">Sources Used</p>
                  <p className="text-white text-2xl font-bold">{metadata.sourcesUsed.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-yellow-400 text-sm font-medium">Fetch Time</p>
                  <p className="text-white text-2xl font-bold">{metadata.fetchTime}ms</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Jobs List */}
        <AnimatePresence>
          <motion.div
            variants={containerVariants}
            className="grid gap-6"
          >
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                variants={itemVariants}
                layout
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-300 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                        {job.title}
                      </h3>
                      {job.matchPercentage && (
                        <div className={`text-sm font-bold ${getMatchColor(job.matchPercentage)}`}>
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
                        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-lg text-xs">
                          Remote
                        </span>
                      )}
                    </div>

                    {job.salary && (
                      <p className="text-green-400 font-semibold mb-3">
                        {job.salary.currency}{job.salary.min?.toLocaleString()} - {job.salary.currency}{job.salary.max?.toLocaleString()}
                      </p>
                    )}

                    <p className="text-gray-400 mb-4 line-clamp-2">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.requirements.slice(0, 5).map((req, idx) => (
                        <span
                          key={idx}
                          className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg text-sm border border-purple-500/30"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getSourceBadgeColor(job.source)}`}>
                      {job.source.toUpperCase()}
                    </div>
                    
                    <div className="text-gray-400 text-sm">
                      {new Date(job.postedDate).toLocaleDateString()}
                    </div>

                    <motion.a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-6 rounded-xl transition-all duration-300"
                    >
                      Apply Now
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {jobs.length === 0 && !loading && (
          <motion.div
            variants={itemVariants}
            className="text-center py-16"
          >
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-400">
              Try adjusting your search criteria or skills
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HybridJobSearch;