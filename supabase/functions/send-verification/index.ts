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
    const { phoneNumber } = await req.json();
    
    console.log('Sending verification code to:', phoneNumber);

    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 10) {
      throw new Error('رقم الهاتف غير صحيح');
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store verification code in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Delete any existing codes for this phone number
    await supabase
      .from('verification_codes')
      .delete()
      .eq('phone_number', phoneNumber);

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

    // Format phone number for WhatsApp (remove any special characters and add country code if needed)
    const formattedPhone = phoneNumber.replace(/\D/g, '');
    
    const whatsappResponse = await fetch('https://gate.whapi.cloud/messages/text', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${whapiToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        typing_time: 0,
        to: `${formattedPhone}@s.whatsapp.net`,
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
