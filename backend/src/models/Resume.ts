import mongoose, { Document, Schema } from 'mongoose';

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  template: string;
  colorPalette: string;
  personalInfo: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    linkedIn?: string;
    website?: string;
    summary?: string;
  };
  experience: Array<{
    company: string;
    position: string;
    location?: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
    gpa?: number;
    achievements: string[];
  }>;
  skills: Array<{
    name: string;
    category: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    verified: boolean;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate: Date;
    expiryDate?: Date;
    credentialId?: string;
    url?: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    startDate: Date;
    endDate?: Date;
    url?: string;
    repository?: string;
  }>;
  languages: Array<{
    name: string;
    proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
  }>;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  parsedData?: any;
  atsScore?: number;
  blockchainHash?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  template: {
    type: String,
    default: 'modern'
  },
  colorPalette: {
    type: String,
    default: 'blue'
  },
  personalInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    linkedIn: String,
    website: String,
    summary: String
  },
  experience: [{
    company: {
      type: String,
      required: true
    },
    position: {
      type: String,
      required: true
    },
    location: String,
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    current: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      required: true
    },
    achievements: [String]
  }],
  education: [{
    institution: {
      type: String,
      required: true
    },
    degree: {
      type: String,
      required: true
    },
    fieldOfStudy: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    current: {
      type: Boolean,
      default: false
    },
    gpa: Number,
    achievements: [String]
  }],
  skills: [{
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      required: true
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],
  certifications: [{
    name: {
      type: String,
      required: true
    },
    issuer: {
      type: String,
      required: true
    },
    issueDate: {
      type: Date,
      required: true
    },
    expiryDate: Date,
    credentialId: String,
    url: String
  }],
  projects: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    technologies: [String],
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    url: String,
    repository: String
  }],
  languages: [{
    name: {
      type: String,
      required: true
    },
    proficiency: {
      type: String,
      enum: ['Basic', 'Conversational', 'Fluent', 'Native'],
      required: true
    }
  }],
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  parsedData: Schema.Types.Mixed,
  atsScore: Number,
  blockchainHash: String,
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export const Resume = mongoose.model<IResume>('Resume', resumeSchema);