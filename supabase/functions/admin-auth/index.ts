import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple token generation using crypto
async function generateToken(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time string comparison to prevent timing attacks
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Rate limiting for login attempts: 5 attempts per 15 minutes per IP
const loginAttemptMap = new Map<string, { count: number; resetTime: number }>();
const LOGIN_RATE_LIMIT = 5;
const LOGIN_RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

function checkLoginRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = loginAttemptMap.get(ip);
  
  if (!record || now > record.resetTime) {
    loginAttemptMap.set(ip, { count: 1, resetTime: now + LOGIN_RATE_WINDOW });
    return { allowed: true, remaining: LOGIN_RATE_LIMIT - 1 };
  }
  
  if (record.count >= LOGIN_RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: LOGIN_RATE_LIMIT - record.count };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for admin_sessions access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, password, token } = await req.json();
    
    // Clean up expired tokens
    await supabase
      .from('admin_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());
    
    // Validate token action
    if (action === 'validate') {
      if (!token) {
        return new Response(
          JSON.stringify({ valid: false, error: 'No token provided' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      const { data: session, error } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      if (error || !session) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Token expired or invalid' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      return new Response(
        JSON.stringify({ valid: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Login action
    if (action === 'login') {
      // Rate limit login attempts
      const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';
      const rateCheck = checkLoginRateLimit(ip);
      
      if (!rateCheck.allowed) {
        console.warn(`Login rate limit exceeded for IP`);
        return new Response(
          JSON.stringify({ error: 'Too many login attempts. Please try again later.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }

      if (!password) {
        return new Response(
          JSON.stringify({ error: 'Password is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      const ADMIN_PASSWORD = Deno.env.get('ADMIN_CORRECTIONS_PASSWORD');
      if (!ADMIN_PASSWORD) {
        console.error('ADMIN_CORRECTIONS_PASSWORD not configured');
        return new Response(
          JSON.stringify({ error: 'Admin authentication not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      if (!constantTimeEqual(password, ADMIN_PASSWORD)) {
        console.warn('Invalid admin login attempt');
        return new Response(
          JSON.stringify({ error: 'Invalid password' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      // Generate token valid for 8 hours
      const newToken = await generateToken();
      const expiresAt = new Date(Date.now() + (8 * 60 * 60 * 1000)); // 8 hours
      
      // Store token in database
      const { error: insertError } = await supabase
        .from('admin_sessions')
        .insert({
          token: newToken,
          expires_at: expiresAt.toISOString()
        });
      
      if (insertError) {
        console.error('Failed to store session:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      console.log('Admin login successful, token generated');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          token: newToken,
          expiresAt: expiresAt.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Logout action
    if (action === 'logout') {
      if (token) {
        await supabase
          .from('admin_sessions')
          .delete()
          .eq('token', token);
      }
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
    
  } catch (error) {
    console.error('Error in admin-auth function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
