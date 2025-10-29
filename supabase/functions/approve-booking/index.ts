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
    const { bookingId } = await req.json();
    
    if (!bookingId) {
      throw new Error('معرف الحجز مطلوب');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get booking details
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError) {
      console.error('Error fetching booking:', fetchError);
      throw new Error('فشل في تحميل بيانات الحجز');
    }

    if (!booking) {
      throw new Error('الحجز غير موجود');
    }

    if (booking.status !== 'pending') {
      throw new Error('لا يمكن تأكيد حجز تم تأكيده أو إلغاؤه مسبقاً');
    }

    // Update booking status to approved
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'approved' })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      throw new Error('فشل في تحديث حالة الحجز');
    }

    // Send WhatsApp confirmation message
    const messageText = `مرحباً ${booking.customer_name}! ✅\n\nتم تأكيد حجزك بنجاح:\n\nالخدمة: ${booking.service}\nالتاريخ: ${booking.booking_date}\nالوقت: ${booking.booking_time}\n\nنتطلع لرؤيتك! 🌟`;
    
    // Format phone number to ensure it has + prefix
    const phoneNumber = booking.phone_number.startsWith('+') 
      ? booking.phone_number 
      : `+${booking.phone_number}`;
    
    console.log('Sending WhatsApp to:', phoneNumber);
    
    const whatsappResponse = await fetch('https://wp.palmart.ps/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('WACHAT_TOKEN')}`,
      },
      body: JSON.stringify({
        to: phoneNumber,
        text: messageText,
      }),
    });

    const whatsappData = await whatsappResponse.json();
    
    console.log('WhatsApp confirmation sent:', whatsappResponse.status, whatsappData);
    
    if (!whatsappResponse.ok || !whatsappData.success) {
      console.error('WhatsApp API error:', whatsappData);
      // Don't fail the approval if WhatsApp fails, just log it
      console.warn('Booking approved but WhatsApp notification failed');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'تم تأكيد الحجز وإرسال رسالة التأكيد',
        messageId: whatsappData.messageId
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in approve-booking function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'حدث خطأ أثناء تأكيد الحجز' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
