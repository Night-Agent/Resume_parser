import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  id: string;
  title: string;
  company: {
    name: string;
    logo?: string;
    website?: string;
  };
  location: string;
  remote: boolean;
  salary?: {
    min?: number;
    max?: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
  };
  description: string;
  requirements: string[];
  skills: string[];
  url: string;
  postedDate: Date;
  source: string;
  matchPercentage?: number;
  cacheKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    logo: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  remote: {
    type: Boolean,
    default: false
  },
  salary: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'yearly'
    }
  },
  description: {
    type: String,
    required: true
  },
  requirements: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  url: {
    type: String,
    required: true,
    trim: true
  },
  postedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  source: {
    type: String,
    required: true,
    enum: ['JSearch', 'Adzuna', 'Jooble', 'Manual'],
    default: 'JSearch'
  },
  matchPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  cacheKey: {
    type: String,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
JobSchema.index({ title: 'text', 'company.name': 'text', description: 'text' });
JobSchema.index({ skills: 1 });
JobSchema.index({ location: 1 });
JobSchema.index({ remote: 1 });
JobSchema.index({ 'salary.min': 1, 'salary.max': 1 });
JobSchema.index({ postedDate: -1 });
JobSchema.index({ matchPercentage: -1 });
JobSchema.index({ cacheKey: 1, createdAt: 1 });

// Virtual for formatted salary
JobSchema.virtual('formattedSalary').get(function(this: IJob) {
  if (!this.salary) return null;
  
  const salary = this.salary as { min?: number; max?: number; currency: string; period: string };
  const { min, max, currency, period } = salary;
  const currencySymbol = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    CAD: 'C$',
    AUD: 'A$'
  }[currency] || currency;
  
  if (min && max) {
    return `${currencySymbol}${min.toLocaleString()} - ${currencySymbol}${max.toLocaleString()}`;
  } else if (max) {
    return `Up to ${currencySymbol}${max.toLocaleString()}`;
  } else if (min) {
    return `From ${currencySymbol}${min.toLocaleString()}`;
  }
  
  return null;
});

// Static method to clean old cache entries
JobSchema.statics.cleanOldCache = function(maxAge: number = 30 * 60 * 1000) {
  return this.deleteMany({
    cacheKey: { $exists: true },
    createdAt: { $lt: new Date(Date.now() - maxAge) }
  });
};

// Pre-save middleware to ensure skills are lowercase and unique
JobSchema.pre('save', function(this: IJob, next) {
  if (this.skills && Array.isArray(this.skills)) {
    this.skills = [...new Set(this.skills.map(skill => skill.toLowerCase().trim()))];
  }
  next();
});

export const Job = mongoose.model<IJob>('Job', JobSchema);