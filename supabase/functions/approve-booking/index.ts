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

    // Get service name separately
    const { data: service } = await supabase
      .from('services')
      .select('name')
      .eq('id', booking.service)
      .single();
    
    const serviceName = service?.name || 'خدمة';
    
    // Format date to Gregorian
    const bookingDate = new Date(booking.booking_date);
    const formattedDate = bookingDate.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Update booking status to approved
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'approved' })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      throw new Error('فشل في تحديث حالة الحجز');
    }

    // Create reminder record for this booking (1 hour before booking time)
    // Parse the booking date components to avoid timezone issues
    const [year, month, day] = booking.booking_date.split('-').map(Number);
    const timeISO = convertArabicTimeToISO(booking.booking_time);
    const [hours, minutes] = timeISO.split(':').map(Number);
    
    // Create date using local timezone components
    const bookingDateTime = new Date(year, month - 1, day, hours, minutes, 0);
    const reminderTime = new Date(bookingDateTime.getTime() - 60 * 60 * 1000); // 1 hour before
    
    const reminderMessage = `مرحباً ${booking.customer_name}،\n\nهذا تذكير بموعدك في سبا ريا:\n\n📅 التاريخ: ${formattedDate}\n🕐 الوقت: ${booking.booking_time}\n💆 الخدمة: ${serviceName}\n⏱ المدة: ${booking.booking_duration}\n\nنتطلع لرؤيتك قريباً! 🌸`;

    // Create reminder record
    const { error: reminderError } = await supabase
      .from('reminders')
      .insert({
        booking_id: booking.id,
        phone_number: booking.phone_number,
        customer_name: booking.customer_name,
        service_name: serviceName,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        message: reminderMessage,
        status: 'pending',
        scheduled_for: reminderTime.toISOString()
      });

    if (reminderError) {
      console.error('Error creating reminder:', reminderError);
      // Don't fail the approval if reminder creation fails
    } else {
      console.log('Reminder created for booking:', booking.id, 'scheduled for:', reminderTime.toISOString());
    }

    // Send WhatsApp confirmation message
    const messageText = `مرحباً ${booking.customer_name}! ✅\n\nتم تأكيد حجزك بنجاح:\n\nالخدمة: ${serviceName}\nالتاريخ: ${formattedDate}\nالوقت: ${booking.booking_time}\nالمدة: ${booking.booking_duration}\nالسعر: ${booking.price} ₪\n\nنتطلع لرؤيتك! 🌟`;
    
    // Format phone number to ensure it has + prefix
    // The phone number from the database is stored as a string of digits (e.g., 970599123456).
    // We need to ensure it has the '+' prefix for the WhatsApp API.
    const rawPhoneNumber = booking.phone_number.replace(/\D/g, '');
    const whatsappPhoneNumber = `+${rawPhoneNumber}`;
    
    console.log('Sending WhatsApp to:', whatsappPhoneNumber);
    
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
    
    console.log('WhatsApp confirmation sent:', whatsappResponse.status, whatsappData);
    
    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', whatsappData);
      // Don't fail the approval if WhatsApp fails, just log it
      console.warn('Booking approved but WhatsApp notification failed');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'تم تأكيد الحجز وإرسال رسالة التأكيد',
        messageId: whatsappData.messageId,
        whatsappSuccess: whatsappData.success,
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

// Helper function to convert Arabic time format to ISO time
function convertArabicTimeToISO(arabicTime: string): string {
  // Example: "02:00 م" or "09:00 ص"
  const cleaned = arabicTime.trim();
  const match = cleaned.match(/(\d+):(\d+)/);
  
  if (!match) return '00:00:00';
  
  let hour = parseInt(match[1]);
  const minute = match[2];
  
  const isPM = cleaned.includes('م') || cleaned.includes('PM');
  const isAM = cleaned.includes('ص') || cleaned.includes('AM');
  
  if (isPM && hour !== 12) {
    hour += 12;
  } else if (isAM && hour === 12) {
    hour = 0;
  }
  
  return `${hour.toString().padStart(2, '0')}:${minute}:00`;
}
