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
    const { phoneNumber: rawPhoneNumber, code } = await req.json();
    
    // Validate inputs
    if (!rawPhoneNumber || !code) {
      throw new Error('رقم الهاتف أو رمز التحقق مفقود');
    }

    // Validate code format (must be exactly 6 digits)
    if (!/^[0-9]{6}$/.test(code)) {
      throw new Error('رمز التحقق غير صحيح');
    }

    // Validate and normalize phone number (same as send-verification)
    const validatePhoneNumber = (phone: string): string => {
      if (!phone) {
        throw new Error('رقم الهاتف مطلوب');
      }
      
      // Remove all non-digit characters including +
      const digitsOnly = phone.replace(/\D/g, '');
      
      // Validate minimum length
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        throw new Error('رقم الهاتف غير صحيح');
      }
      
      // Return digits only (no + sign)
      return digitsOnly;
    };

    const phoneNumber = validatePhoneNumber(rawPhoneNumber);
    
    console.log('Verifying code for phone:', phoneNumber.substring(0, 3) + '***' + phoneNumber.substring(phoneNumber.length - 2));

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

    // Rate limiting: Check if too many failed attempts (5 max)
    if (data && data.attempts >= 5) {
      // Invalidate the code after too many attempts
      await supabase
        .from('verification_codes')
        .delete()
        .eq('id', data.id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'تم تجاوز عدد المحاولات المسموح بها. يرجى طلب رمز جديد' 
        }), 
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!data) {
      // Increment attempt counter for all codes with this phone number
      const { data: existingCodes } = await supabase
        .from('verification_codes')
        .select('id, attempts')
        .eq('phone_number', phoneNumber)
        .eq('verified', false);

      if (existingCodes && existingCodes.length > 0) {
        for (const record of existingCodes) {
          await supabase
            .from('verification_codes')
            .update({ attempts: (record.attempts || 0) + 1 })
            .eq('id', record.id);
        }
      }

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

    console.log('Verification successful for:', phoneNumber.substring(0, 3) + '***' + phoneNumber.substring(phoneNumber.length - 2));

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
