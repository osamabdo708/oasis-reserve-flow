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
    const { phoneNumber: rawPhoneNumber } = await req.json();
    
    // Validate and normalize phone number (supports multiple countries)
    const validatePhoneNumber = (phone: string): string => {
      if (!phone) {
        throw new Error('رقم الهاتف مطلوب');
      }
      
      // Remove all non-digit characters including +
      const digitsOnly = phone.replace(/\D/g, '');
      
      // Validate minimum length (country code + number should be at least 10 digits)
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        throw new Error('رقم الهاتف غير صحيح');
      }
      
      // Return digits only (no + sign)
      return digitsOnly;
    };
    
    const phoneNumber = validatePhoneNumber(rawPhoneNumber);
    
    console.log('Sending verification code to:', phoneNumber.substring(0, 3) + '***' + phoneNumber.substring(phoneNumber.length - 2));

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Rate limiting: Check recent verification attempts (3 per hour)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: recentCodes, error: rateLimitError } = await supabase
      .from('verification_codes')
      .select('created_at')
      .eq('phone_number', phoneNumber)
      .gte('created_at', oneHourAgo);

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (recentCodes && recentCodes.length >= 3) {
      return new Response(
        JSON.stringify({ 
          error: 'تم إرسال عدد كبير من الرموز. يرجى المحاولة بعد ساعة' 
        }), 
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete any existing unverified codes for this phone number
    await supabase
      .from('verification_codes')
      .delete()
      .eq('phone_number', phoneNumber)
      .eq('verified', false);

    // Insert new verification code
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        phone_number: phoneNumber,
        code: code,
      });

    if (insertError) {
      console.error('Error storing verification code:', insertError);
      throw new Error('فشل في تخزين رمز التحقق');
    }

    // Send WhatsApp message via whapi.cloud
    const whapiToken = Deno.env.get('WHAPI_TOKEN');
    if (!whapiToken) {
      throw new Error('WHAPI_TOKEN not configured');
    }

    // Phone number is already normalized to 9665XXXXXXXX format
    const whatsappResponse = await fetch('https://gate.whapi.cloud/messages/text', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${whapiToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        typing_time: 0,
        to: `${phoneNumber}@s.whatsapp.net`,
        body: `رمز التحقق الخاص بك هو: ${code}\n\nهذا الرمز صالح لمدة 10 دقائق.`,
      }),
    });

    const whatsappData = await whatsappResponse.json();
    
    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', whatsappData);
      throw new Error('فشل في إرسال رسالة WhatsApp');
    }

    console.log('Verification code sent successfully:', whatsappData);

    return new Response(
      JSON.stringify({ success: true, message: 'تم إرسال رمز التحقق' }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-verification function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'حدث خطأ أثناء إرسال رمز التحقق' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
