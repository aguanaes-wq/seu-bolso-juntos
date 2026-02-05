 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 // Rate limiting: max 5 attempts per name per minute
 const rateLimitMap = new Map<string, { attempts: number[]; blocked_until?: number }>();
 const MAX_ATTEMPTS = 5;
 const WINDOW_MS = 60000; // 1 minute
 const BLOCK_DURATION_MS = 300000; // 5 minutes block after exceeding
 
 function checkRateLimit(name: string): { allowed: boolean; retryAfter?: number } {
   const now = Date.now();
   const key = name.toLowerCase();
   const record = rateLimitMap.get(key) || { attempts: [] };
   
   // Check if blocked
   if (record.blocked_until && now < record.blocked_until) {
     return { allowed: false, retryAfter: Math.ceil((record.blocked_until - now) / 1000) };
   }
   
   // Clean old attempts
   record.attempts = record.attempts.filter(t => now - t < WINDOW_MS);
   
   if (record.attempts.length >= MAX_ATTEMPTS) {
     record.blocked_until = now + BLOCK_DURATION_MS;
     rateLimitMap.set(key, record);
     return { allowed: false, retryAfter: Math.ceil(BLOCK_DURATION_MS / 1000) };
   }
   
   record.attempts.push(now);
   record.blocked_until = undefined;
   rateLimitMap.set(key, record);
   return { allowed: true };
 }
 
 serve(async (req) => {
   // Handle CORS preflight
   if (req.method === "OPTIONS") {
     return new Response("ok", { headers: corsHeaders });
   }
   
   try {
     const { action, name, pin, token } = await req.json();
     
     const supabase = createClient(
       Deno.env.get("SUPABASE_URL")!,
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
     );
     
     // LOGOUT action
     if (action === "logout" && token) {
       await supabase.rpc("delete_session", { session_token: token });
       return new Response(JSON.stringify({ success: true }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
     
     // VERIFY action - check if session token is valid
     if (action === "verify" && token) {
       const { data: sessionData } = await supabase.rpc("validate_session", {
         session_token: token,
       });
       
       if (!sessionData || sessionData.length === 0) {
         return new Response(JSON.stringify({ valid: false }), {
           status: 401,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       
       return new Response(JSON.stringify({
         valid: true,
         member: {
           id: sessionData[0].member_id,
           name: sessionData[0].member_name,
         },
       }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
     
     // LOGIN action
     if (action === "login") {
       if (!name || !pin) {
         return new Response(JSON.stringify({ error: "Nome e PIN são obrigatórios" }), {
           status: 400,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       
       // Check rate limit
       const rateCheck = checkRateLimit(name);
       if (!rateCheck.allowed) {
         return new Response(JSON.stringify({
           error: `Muitas tentativas. Tente novamente em ${rateCheck.retryAfter} segundos.`,
         }), {
           status: 429,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       
       // Fetch member by name (using service role to bypass RLS)
       const { data: member, error: memberError } = await supabase
         .from("family_members")
         .select("id, name, pin_hash, created_at")
         .eq("name", name)
         .single();
       
       if (memberError || !member) {
         console.log("Member not found:", name);
         return new Response(JSON.stringify({ error: "Nome ou PIN incorreto" }), {
           status: 401,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       
       // Verify PIN with bcrypt
       const pinValid = await bcrypt.compare(pin, member.pin_hash);
       if (!pinValid) {
         console.log("Invalid PIN for:", name);
         return new Response(JSON.stringify({ error: "Nome ou PIN incorreto" }), {
           status: 401,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       
       // Generate session token
       const sessionToken = crypto.randomUUID();
       await supabase.rpc("create_session", {
         p_member_id: member.id,
         p_token: sessionToken,
       });
       
       console.log("Login successful for:", name);
       
       return new Response(JSON.stringify({
         token: sessionToken,
         member: {
           id: member.id,
           name: member.name,
           created_at: member.created_at,
         },
       }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
     
     // REGISTER action
     if (action === "register") {
       if (!name || !pin) {
         return new Response(JSON.stringify({ error: "Nome e PIN são obrigatórios" }), {
           status: 400,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       
       if (!/^\d{4}$/.test(pin)) {
         return new Response(JSON.stringify({ error: "PIN deve ter 4 números" }), {
           status: 400,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       
       // Hash PIN with bcrypt (server-side)
       const pinHash = await bcrypt.hash(pin);
       
       // Insert new member
       const { data: newMember, error: insertError } = await supabase
         .from("family_members")
         .insert({ name: name.trim(), pin_hash: pinHash })
         .select("id, name, created_at")
         .single();
       
       if (insertError) {
         console.error("Registration error:", insertError);
         if (insertError.code === "23505") {
           return new Response(JSON.stringify({ error: "Nome já cadastrado" }), {
             status: 409,
             headers: { ...corsHeaders, "Content-Type": "application/json" },
           });
         }
         return new Response(JSON.stringify({ error: "Erro ao cadastrar" }), {
           status: 500,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       
       // Generate session token
       const sessionToken = crypto.randomUUID();
       await supabase.rpc("create_session", {
         p_member_id: newMember.id,
         p_token: sessionToken,
       });
       
       console.log("Registration successful for:", name);
       
       return new Response(JSON.stringify({
         token: sessionToken,
         member: {
           id: newMember.id,
           name: newMember.name,
           created_at: newMember.created_at,
         },
       }), {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
     
     return new Response(JSON.stringify({ error: "Ação inválida" }), {
       status: 400,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
     
   } catch (error) {
     console.error("Auth function error:", error);
     return new Response(JSON.stringify({
       error: error instanceof Error ? error.message : "Erro interno do servidor",
     }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });