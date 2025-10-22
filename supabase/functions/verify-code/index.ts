import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, code } = await req.json();
    
    console.log('Verifying code for phone:', phoneNumber);

    if (!phoneNumber || !code) {
      throw new Error('رقم الهاتف أو رمز التحقق مفقود');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check verification code
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      throw new Error('خطأ في التحقق من الرمز');
    }

    if (!data) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'رمز التحقق غير صحيح أو منتهي الصلاحية' 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Mark code as verified
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({ verified: true })
      .eq('id', data.id);

    if (updateError) {
      console.error('Error updating verification status:', updateError);
      throw new Error('خطأ في تحديث حالة التحقق');
    }

    console.log('Verification successful for:', phoneNumber);

    return new Response(
      JSON.stringify({ success: true, message: 'تم التحقق بنجاح' }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in verify-code function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'حدث خطأ أثناء التحقق' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
