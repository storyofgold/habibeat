
import { createClient } from '@supabase/supabase-js';

// Credentials provided by user
const supabaseUrl = 'https://snxbanveszrdpyaryxis.supabase.co';
const supabaseAnonKey = 'sb_publishable_QPQzaGz8BUYOiOlBSuTMyw_8o1J0VNs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
