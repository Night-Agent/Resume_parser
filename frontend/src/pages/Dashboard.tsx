import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Search, 
  TrendingUp, 
  Users, 
  Briefcase, 
  User,
  Zap,
  Star,
  DollarSign,
  Clock,
  Shield
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const features = [
    {
      title: '🆓 FREE Job Search',
      description: 'Search unlimited jobs across 6+ portals with zero monthly costs',
      icon: <Zap className="w-8 h-8" />,
      link: '/free-jobs',
      gradient: 'from-green-500 to-emerald-600',
      highlight: 'FREE Forever',
      badge: 'RECOMMENDED'
    },
    {
      title: 'AI Resume Builder',
      description: 'Create ATS-optimized resumes with AI analysis and suggestions',
      icon: <FileText className="w-8 h-8" />,
      link: '/resume-builder',
      gradient: 'from-blue-500 to-indigo-600',
      highlight: 'AI-Powered'
    },
    {
      title: 'Hybrid Job Search',
      description: 'Advanced job search with multiple APIs and smart caching',
      icon: <Search className="w-8 h-8" />,
      link: '/hybrid-jobs',
      gradient: 'from-purple-500 to-violet-600',
      highlight: 'Multi-Source'
    },
    {
      title: 'Job Analytics',
      description: 'Comprehensive insights and trends in the job market',
      icon: <TrendingUp className="w-8 h-8" />,
      link: '/job-analytics',
      gradient: 'from-orange-500 to-red-600',
      highlight: 'Data-Driven'
    },
    {
      title: 'Applications',
      description: 'Track and manage all your job applications in one place',
      icon: <Briefcase className="w-8 h-8" />,
      link: '/applications',
      gradient: 'from-teal-500 to-cyan-600',
      highlight: 'Organized'
    },
    {
      title: 'Companies',
      description: 'Discover companies and their hiring trends with AI insights',
      icon: <Users className="w-8 h-8" />,
      link: '/companies',
      gradient: 'from-pink-500 to-rose-600',
      highlight: 'Smart Discovery'
    }
  ];

  const stats = [
    { label: 'Jobs Available', value: '50,000+', icon: <Briefcase className="w-6 h-6" /> },
    { label: 'Monthly Cost', value: '₹0', icon: <DollarSign className="w-6 h-6" /> },
    { label: 'Search Time', value: '<30s', icon: <Clock className="w-6 h-6" /> },
    { label: 'Success Rate', value: '95%', icon: <TrendingUp className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Resume Intelligence Platform
            </h1>
            <p className="text-gray-300">AI-Powered • Completely FREE • No Subscriptions</p>
          </div>
          
          <Link 
            to="/profile"
            className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-all duration-300 border border-white/20"
          >
            <User className="w-6 h-6" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl font-bold text-white mb-4">
            Welcome to Your <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">FREE</span> Job Search Hub
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            No monthly fees • No API limits • No n8n costs • Unlimited access to premium features
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
              >
                <div className="text-green-400 mb-2 flex justify-center">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-300 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="bg-green-500/20 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-bold text-green-400">100% FREE Promise</h3>
            </div>
            <p className="text-gray-300">
              We eliminated n8n costs (₹1,500+/month) and replaced expensive APIs with FREE direct scraping. 
              <br />
              <span className="text-green-400 font-semibold">Zero monthly fees, forever!</span>
            </p>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="group relative"
            >
              <Link to={feature.link}>
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-green-500/50 transition-all duration-300 h-full relative overflow-hidden">
                  {/* Badge */}
                  {feature.badge && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {feature.badge}
                      </span>
                    </div>
                  )}

                  {/* Icon with gradient background */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-green-300 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-lg bg-gradient-to-r ${feature.gradient} text-white text-sm font-semibold`}>
                      {feature.highlight}
                    </span>
                    
                    <div className="text-green-400 group-hover:translate-x-2 transition-transform duration-300">
                      →
                    </div>
                  </div>

                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl p-12 border border-white/20">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Start Your FREE Job Search?
            </h3>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of job seekers who saved money and found better opportunities with our FREE platform.
            </p>
            
            <div className="flex justify-center gap-6">
              <Link
                to="/free-jobs"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Start FREE Job Search
              </Link>
              
              <Link
                to="/resume-builder"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold py-4 px-8 rounded-xl border border-white/20 transition-all duration-300 flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Build Resume First
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;