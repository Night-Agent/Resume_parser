import mongoose, { Document, Schema } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  description: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  website?: string;
  logo?: string;
  headquarters: {
    city: string;
    state?: string;
    country: string;
  };
  founded?: number;
  employees: {
    min?: number;
    max?: number;
  };
  culture: {
    values: string[];
    benefits: string[];
    workEnvironment: string;
  };
  contact: {
    email?: string;
    phone?: string;
    address?: string;
  };
  socialMedia: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  rating: {
    overall: number;
    culture: number;
    workLifeBalance: number;
    compensation: number;
    management: number;
    careerGrowth: number;
    reviewsCount: number;
  };
  isVerified: boolean;
  jobsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  industry: {
    type: String,
    required: true
  },
  size: {
    type: String,
    enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
    required: true
  },
  website: String,
  logo: String,
  headquarters: {
    city: {
      type: String,
      required: true
    },
    state: String,
    country: {
      type: String,
      required: true
    }
  },
  founded: Number,
  employees: {
    min: Number,
    max: Number
  },
  culture: {
    values: [String],
    benefits: [String],
    workEnvironment: String
  },
  contact: {
    email: String,
    phone: String,
    address: String
  },
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  },
  rating: {
    overall: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    culture: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    workLifeBalance: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    compensation: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    management: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    careerGrowth: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewsCount: {
      type: Number,
      default: 0
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  jobsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search optimization
companySchema.index({ name: 'text', description: 'text', industry: 'text' });
companySchema.index({ 'headquarters.city': 1, 'headquarters.country': 1 });

export const Company = mongoose.model<ICompany>('Company', companySchema);