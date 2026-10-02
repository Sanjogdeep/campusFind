export type UserRole = 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  grad_year?: number;
  phone_number?: string;
  profile_image?: string;
  is_verified: boolean;
  is_suspended: boolean;
  badges: string[];
  items_found_count: number;
  items_returned_count: number;
  created_at: string;
}

export interface UserPublic {
  id: number;
  name: string;
  is_verified: boolean;
  badges: string[];
  items_found_count: number;
  items_returned_count: number;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  is_active: boolean;
}

export interface CampusLocation {
  id: number;
  name: string;
  zone_code: string;
  description?: string;
  map_x: number;
  map_y: number;
  latitude?: number;
  longitude?: number;
  is_meeting_point: boolean;
}

export interface LostItem {
  id: number;
  owner_id?: number;
  category_id: number;
  location_id: number;
  title: string;
  description: string;
  lost_date: string;
  approx_time?: string;
  brand?: string;
  model?: string;
  color?: string;
  image_url?: string;
  distinguishing_features?: string;
  status: string;
  created_at: string;
  category?: Category;
  location?: CampusLocation;
}

export interface FoundItem {
  id: number;
  finder_id?: number;
  category_id: number;
  location_id: number;
  title: string;
  description: string;
  found_date: string;
  approx_time?: string;
  brand?: string;
  color?: string;
  image_url?: string;
  has_item: boolean;
  distinguishing_features?: string;
  status: string;
  created_at: string;
  category?: Category;
  location?: CampusLocation;
}

export interface Match {
  id: number;
  lost_item_id: number;
  found_item_id: number;
  match_score: number;
  match_label: string;
  category_score: number;
  location_score: number;
  date_score: number;
  keyword_score: number;
  brand_score: number;
  color_score: number;
  status: string;
  created_at: string;
  lost_item?: LostItem;
  found_item?: FoundItem;
}

export type CaseStatus =
  | 'LOST_REPORTED'
  | 'FOUND_REPORTED'
  | 'POSSIBLE_MATCH'
  | 'MATCH_REQUESTED'
  | 'FINDER_CONFIRMED'
  | 'VERIFICATION_PENDING'
  | 'VERIFIED'
  | 'MEETING_PROPOSED'
  | 'MEETING_CONFIRMED'
  | 'HANDOVER_PENDING'
  | 'RETURNED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'DISPUTED';

export interface Case {
  id: number;
  lost_item_id: number;
  found_item_id: number;
  owner_id: number;
  finder_id: number;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
  owner?: UserPublic;
  finder?: UserPublic;
  lost_item?: LostItem;
  found_item?: FoundItem;
  verification_question?: string;
  verification_answer?: string;
  verification_accepted?: boolean;
}

export interface Meeting {
  id: number;
  case_id: number;
  location_id: number;
  scheduled_time: string;
  proposer_id: number;
  status: 'PROPOSED' | 'ACCEPTED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  created_at: string;
  updated_at: string;
  location?: CampusLocation;
}

export interface HandoverToken {
  token_code: string;
  qr_payload: string;
  expires_at: string;
  finder_confirmed: boolean;
  owner_confirmed: boolean;
  is_redeemed: boolean;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface Dispute {
  id: number;
  case_id: number;
  raised_by_id: number;
  raised_by_name?: string;
  reason: string;
  description: string;
  admin_notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Analytics {
  total_users: number;
  lost_reports_count: number;
  found_reports_count: number;
  possible_matches_count: number;
  successful_returns_count: number;
  active_cases_count: number;
  disputes_count: number;
  average_resolution_hours: number;
  lost_by_category: Record<string, number>;
  found_by_category: Record<string, number>;
  reports_by_location: Record<string, number>;
  monthly_trend: Array<{ month: string; lost: number; found: number; returned: number }>;
  return_rate_percentage: number;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  details?: string;
  timestamp: string;
}

export interface CampusZoneActivity {
  id: number;
  name: string;
  zone_code: string;
  description?: string;
  map_x: number;
  map_y: number;
  latitude?: number;
  longitude?: number;
  is_meeting_point: boolean;
  active_lost_count: number;
  active_found_count: number;
  total_activity: number;
}
