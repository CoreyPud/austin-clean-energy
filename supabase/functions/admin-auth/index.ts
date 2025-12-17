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

// Token storage (in-memory for simplicity - resets on function cold start)
// In production, you might want to store this in the database
const validTokens = new Map<string, { createdAt: number; expiresAt: number }>();

// Clean up expired tokens
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of validTokens.entries()) {
    if (now > data.expiresAt) {
      validTokens.delete(token);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, password, token } = await req.json();
    
    // Validate token action
    if (action === 'validate') {
      if (!token) {
        return new Response(
          JSON.stringify({ valid: false, error: 'No token provided' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      cleanupExpiredTokens();
      const tokenData = validTokens.get(token);
      
      if (!tokenData || Date.now() > tokenData.expiresAt) {
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
      
      if (password !== ADMIN_PASSWORD) {
        console.warn('Invalid admin login attempt');
        return new Response(
          JSON.stringify({ error: 'Invalid password' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      // Generate token valid for 8 hours
      const newToken = await generateToken();
      const now = Date.now();
      const expiresAt = now + (8 * 60 * 60 * 1000); // 8 hours
      
      validTokens.set(newToken, { createdAt: now, expiresAt });
      cleanupExpiredTokens();
      
      console.log('Admin login successful, token generated');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          token: newToken,
          expiresAt: new Date(expiresAt).toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Logout action
    if (action === 'logout') {
      if (token) {
        validTokens.delete(token);
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
