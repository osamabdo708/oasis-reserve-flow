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
    
    // The frontend sends the number as digits only (e.g., 970599123456)
    const phoneNumber = rawPhoneNumber.replace(/\D/g, ''); // Ensure digits only for DB storage and rate limiting

    // Simple validation for DB storage
    if (phoneNumber.length < 10 || phoneNumber.length > 15) {
      throw new Error('رقم الهاتف غير صحيح');
    }

    // The number for WhatsApp API must have a '+' prefix
    const whatsappPhoneNumber = `+${phoneNumber}`;
    
    console.log('Sending verification code to:', whatsappPhoneNumber.substring(0, 4) + '***' + whatsappPhoneNumber.substring(whatsappPhoneNumber.length - 2));

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

    // Send WhatsApp message via new Node.js WhatsApp API
    const messageText = `رمز التحقق الخاص بك هو: ${code}\n\nهذا الرمز صالح لمدة 10 دقائق.`;
    
    const whatsappResponse = await fetch('https://wp.palmart.ps/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: whatsappPhoneNumber,
        text: messageText,
      }),
    });

    const whatsappData = await whatsappResponse.json();
    
    console.log('WhatsApp API response:', whatsappResponse.status, whatsappData);
    
    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', whatsappData);
      
      // If WhatsApp is still connecting, save the code anyway and return success
      // so users can manually retrieve it or try again later
      if (whatsappData.status === 'connecting') {
        console.log('WhatsApp API is connecting, verification code saved to database');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'تم حفظ رمز التحقق. سيتم إرساله قريباً عبر WhatsApp',
            warning: 'WhatsApp is connecting'
          }), 
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error('فشل في إرسال رسالة WhatsApp');
    }

    // Check if response indicates success
    if (whatsappData.success === false) {
      console.error('WhatsApp API returned unsuccessful response:', whatsappData);
      throw new Error('فشل في إرسال رسالة WhatsApp');
    }

    console.log('Verification code sent successfully, messageId:', whatsappData.messageId);

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
