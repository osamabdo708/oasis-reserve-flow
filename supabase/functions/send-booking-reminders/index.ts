import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    console.log("Starting booking reminder process...");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const whatsappToken = Deno.env.get('WACHAT_TOKEN')!;

    if (!whatsappToken) {
      throw new Error('WACHAT_TOKEN is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate time range: 55 minutes to 65 minutes from now
    const now = new Date();
    const startTime = new Date(now.getTime() + 55 * 60 * 1000);
    const endTime = new Date(now.getTime() + 65 * 60 * 1000);

    console.log("Checking for bookings between:", startTime.toISOString(), "and", endTime.toISOString());

    // Fetch approved bookings for today that are 1 hour away
    const today = now.toISOString().split('T')[0];
    
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', today)
      .eq('status', 'approved');

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      throw bookingsError;
    }

    console.log(`Found ${bookings?.length || 0} approved bookings for today`);

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No approved bookings found for today', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const booking of bookings) {
      try {
        // Parse booking time to check if it's within the 1-hour window
        const bookingDateTime = new Date(`${booking.booking_date}T${convertArabicTimeToISO(booking.booking_time)}`);
        
        console.log(`Checking booking ${booking.id} scheduled for:`, bookingDateTime.toISOString());

        if (bookingDateTime < startTime || bookingDateTime > endTime) {
          console.log(`Skipping booking ${booking.id} - not in reminder window`);
          results.skipped++;
          continue;
        }

        // Check if reminder already sent or pending
        const { data: existingReminder } = await supabase
          .from('reminders')
          .select('*')
          .eq('booking_id', booking.id)
          .in('status', ['sent', 'pending'])
          .single();

        if (existingReminder) {
          console.log(`Skipping booking ${booking.id} - reminder already exists`);
          results.skipped++;
          continue;
        }

        // Create reminder message
        const message = `مرحباً ${booking.customer_name}،\n\nهذا تذكير بموعدك في سبا ريا:\n\n📅 التاريخ: ${formatDate(booking.booking_date)}\n🕐 الوقت: ${booking.booking_time}\n💆 الخدمة: ${booking.service}\n⏱ المدة: ${booking.booking_duration}\n\nنتطلع لرؤيتك قريباً! 🌸`;

        const scheduledFor = new Date(bookingDateTime.getTime() - 60 * 60 * 1000); // 1 hour before

        // Create reminder record
        const { data: reminder, error: reminderError } = await supabase
          .from('reminders')
          .insert({
            booking_id: booking.id,
            phone_number: booking.phone_number,
            customer_name: booking.customer_name,
            service_name: booking.service,
            booking_date: booking.booking_date,
            booking_time: booking.booking_time,
            message: message,
            status: 'pending',
            scheduled_for: scheduledFor
          })
          .select()
          .single();

        if (reminderError) {
          console.error(`Error creating reminder for booking ${booking.id}:`, reminderError);
          results.errors.push(`Booking ${booking.id}: ${reminderError.message}`);
          results.failed++;
          continue;
        }

        // Send WhatsApp message
        console.log(`Sending WhatsApp reminder to ${booking.phone_number}`);
        
        const whatsappResponse = await fetch('https://wp.palmart.ps/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: booking.phone_number,
            message: message
          }),
        });

        const whatsappData = await whatsappResponse.json();

        if (whatsappResponse.ok) {
          // Update reminder status to sent
          await supabase
            .from('reminders')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', reminder.id);

          console.log(`Reminder sent successfully for booking ${booking.id}`);
          results.sent++;
        } else {
          // Update reminder status to failed
          await supabase
            .from('reminders')
            .update({
              status: 'failed',
              error_message: JSON.stringify(whatsappData)
            })
            .eq('id', reminder.id);

          console.error(`Failed to send reminder for booking ${booking.id}:`, whatsappData);
          results.errors.push(`Booking ${booking.id}: WhatsApp API error`);
          results.failed++;
        }

      } catch (error) {
        console.error(`Error processing booking ${booking.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Booking ${booking.id}: ${errorMessage}`);
        results.failed++;
      }
    }

    console.log("Reminder process completed:", results);

    return new Response(
      JSON.stringify({
        message: 'Reminder process completed',
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error("Error in send-booking-reminders function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
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

// Helper function to format date in Arabic
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}