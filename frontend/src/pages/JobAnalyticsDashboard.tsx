import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { Filter, TrendingUp, Database, Zap, Users, Target } from 'lucide-react';

interface DeduplicationStats {
  totalJobsScraped: number;
  uniqueJobsAfterDedup: number;
  duplicatesRemoved: number;
  deduplicationRate: string;
}

interface SourceEfficiency {
  [key: string]: {
    jobs: number;
    duplicateRate: string;
    avgQuality: number;
  };
}

interface AnalyticsData {
  topSkills: Array<{
    skill: string;
    jobs: number;
    avgSalary: string;
    growth: string;
  }>;
  topCompanies: Array<{
    company: string;
    jobs: number;
    avgMatch: number;
  }>;
  locationTrends: Array<{
    location: string;
    jobs: number;
    avgSalary: string;
  }>;
  duplicateStats: DeduplicationStats;
  sourceEfficiency: SourceEfficiency;
}

const JobAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'skills' | 'companies' | 'dedup' | 'sources'>('dedup');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch('/api/hybrid-jobs/analytics', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data.data);
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const duplicateChartData = [
    { name: 'Unique Jobs', value: analytics.duplicateStats.uniqueJobsAfterDedup, color: '#10B981' },
    { name: 'Duplicates Removed', value: analytics.duplicateStats.duplicatesRemoved, color: '#EF4444' }
  ];

  const sourceEfficiencyData = Object.entries(analytics.sourceEfficiency).map(([source, data]) => ({
    source: source.toUpperCase(),
    jobs: data.jobs,
    quality: data.avgQuality,
    duplicateRate: parseFloat(data.duplicateRate.replace('%', ''))
  }));

  const tabs = [
    { id: 'dedup', label: 'Deduplication', icon: Filter },
    { id: 'sources', label: 'Source Analysis', icon: Database },
    { id: 'skills', label: 'Skills Trends', icon: TrendingUp },
    { id: 'companies', label: 'Companies', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Job Intelligence Analytics
          </h1>
          <p className="text-xl text-gray-300">
            Advanced insights from hybrid n8n + API job fetching with deduplication
          </p>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-green-400 text-sm font-medium">Total Jobs Scraped</p>
                <p className="text-white text-3xl font-bold">{analytics.duplicateStats.totalJobsScraped.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-blue-400 text-sm font-medium">Unique Jobs</p>
                <p className="text-white text-3xl font-bold">{analytics.duplicateStats.uniqueJobsAfterDedup.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30">
            <div className="flex items-center gap-3">
              <Filter className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-red-400 text-sm font-medium">Duplicates Removed</p>
                <p className="text-white text-3xl font-bold">{analytics.duplicateStats.duplicatesRemoved.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-purple-400 text-sm font-medium">Dedup Efficiency</p>
                <p className="text-white text-3xl font-bold">{analytics.duplicateStats.deduplicationRate}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  selectedTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {selectedTab === 'dedup' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Deduplication Pie Chart */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Filter className="w-6 h-6 text-purple-400" />
                  Deduplication Overview
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={duplicateChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={true}
                    >
                      {duplicateChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)', 
                        borderRadius: '12px',
                        color: 'white'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Deduplication Algorithm Details */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6">Algorithm Details</h3>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
                    <h4 className="text-purple-300 font-semibold mb-2">Fingerprint Matching</h4>
                    <p className="text-gray-300 text-sm">
                      MD5 hash-based primary deduplication using title + company + location
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30">
                    <h4 className="text-blue-300 font-semibold mb-2">Fuzzy Matching</h4>
                    <p className="text-gray-300 text-sm">
                      Levenshtein distance algorithm for similar job detection (85% threshold)
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-xl p-4 border border-green-500/30">
                    <h4 className="text-green-300 font-semibold mb-2">Quality Scoring</h4>
                    <p className="text-gray-300 text-sm">
                      AI-powered quality assessment to keep the best version of duplicates
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'sources' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Source Efficiency Chart */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6">Source Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourceEfficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="source" stroke="#fff" />
                    <YAxis stroke="#fff" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)', 
                        borderRadius: '12px',
                        color: 'white'
                      }} 
                    />
                    <Bar dataKey="jobs" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Source Quality Metrics */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6">Quality Metrics</h3>
                <div className="space-y-4">
                  {Object.entries(analytics.sourceEfficiency).map(([source, data]) => (
                    <div key={source} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-semibold text-white capitalize">{source}</h4>
                        <span className="text-purple-400 font-bold">{data.avgQuality}/10</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Jobs Found</p>
                          <p className="text-white font-semibold">{data.jobs}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Duplicate Rate</p>
                          <p className="text-red-400 font-semibold">{data.duplicateRate}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'skills' && (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-6">Top Skills in Demand</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.topSkills.map((skill, index) => (
                  <div key={skill.skill} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-white">{skill.skill}</h4>
                      <span className={`text-sm font-bold ${
                        skill.growth.startsWith('+') ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {skill.growth}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400 text-sm">Jobs Available: <span className="text-white font-semibold">{skill.jobs}</span></p>
                      <p className="text-gray-400 text-sm">Avg Salary: <span className="text-green-400 font-semibold">{skill.avgSalary}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'companies' && (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-6">Top Hiring Companies</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.topCompanies.map((company, index) => (
                  <div key={company.company} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-white">{company.company}</h4>
                      <div className="text-right">
                        <p className="text-purple-400 font-bold">{company.avgMatch}%</p>
                        <p className="text-gray-400 text-xs">Avg Match</p>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Active Jobs: <span className="text-white font-semibold">{company.jobs}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default JobAnalyticsDashboard;