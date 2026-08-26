import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  password_hash: z.string(),
  role: z.enum(['citizen', 'moderator', 'department_admin', 'super_admin']),
  home_city_id: z.string().uuid().optional().nullable(),
  notification_prefs: z.any().optional(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().optional().nullable(),
});

export const ComplaintCategorySchema = z.enum([
  'Pothole',
  'Garbage Dump',
  'Broken Streetlight',
  'Water Leakage',
  'Drainage Issue',
  'Damaged Road',
  'Illegal Dumping',
  'Sewage Overflow',
  'Traffic Signal Issue',
  'Public Safety Hazard',
  'Other'
]);

export const ComplaintSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  category: ComplaintCategorySchema,
  description: z.string().min(10).max(1000),
  image_url: z.string().url(),
  image_hash: z.string().optional().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional().nullable(),
  city_id: z.string().uuid().optional().nullable(),
  status: z.string(),
  severity_score: z.number().optional().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  deleted_at: z.date().optional().nullable(),
});

export const AiAnalysisSchema = z.object({
  id: z.string().uuid(),
  complaint_id: z.string().uuid(),
  authenticity_score: z.number().optional().nullable(),
  manipulation_score: z.number().optional().nullable(),
  ai_generated_probability: z.number().optional().nullable(),
  duplicate_score: z.number().optional().nullable(),
  model_version: z.string().optional().nullable(),
  heatmap_url: z.string().url().optional().nullable(),
  verdict: z.string().optional().nullable(),
  analyzed_at: z.date(),
});

export const AuthoritySchema = z.object({
  id: z.string().uuid(),
  city_id: z.string().uuid(),
  department_name: z.string(),
  category: ComplaintCategorySchema,
  twitter_handle: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  sla_hours: z.number().int().optional().nullable(),
});

export const CitySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  state: z.string(),
  timezone: z.string(),
});

export const PostSchema = z.object({
  id: z.string().uuid(),
  complaint_id: z.string().uuid(),
  tweet_id: z.string().optional().nullable(),
  posted_at: z.date().optional().nullable(),
  post_status: z.enum(['pending', 'posted', 'failed']),
  retry_count: z.number().int().default(0),
});

export const StatusHistorySchema = z.object({
  id: z.string().uuid(),
  complaint_id: z.string().uuid(),
  from_status: z.string().optional().nullable(),
  to_status: z.string(),
  changed_by: z.string().uuid().optional().nullable(),
  reason: z.string().optional().nullable(),
  changed_at: z.date(),
});

export const RefreshTokenSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  token_hash: z.string(),
  expires_at: z.date(),
  revoked_at: z.date().optional().nullable(),
});

// Create inferred TypeScript types
export type User = z.infer<typeof UserSchema>;
export type Complaint = z.infer<typeof ComplaintSchema>;
export type AiAnalysis = z.infer<typeof AiAnalysisSchema>;
export type Authority = z.infer<typeof AuthoritySchema>;
export type City = z.infer<typeof CitySchema>;
export type Post = z.infer<typeof PostSchema>;
export type StatusHistory = z.infer<typeof StatusHistorySchema>;
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;
