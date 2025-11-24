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

    // Get current time
    const now = new Date();

    console.log("Checking for pending reminders to send at:", now.toISOString());

    // Fetch pending reminders that should be sent now (scheduled_for <= now)
    const { data: pendingReminders, error: remindersError } = await supabase
      .from('reminders')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString());

    if (remindersError) {
      console.error("Error fetching reminders:", remindersError);
      throw remindersError;
    }

    console.log(`Found ${pendingReminders?.length || 0} pending reminders to send`);

    if (!pendingReminders || pendingReminders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending reminders to send', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const reminder of pendingReminders) {
      try {
        console.log(`Sending reminder ${reminder.id} to ${reminder.phone_number}`);

        // Format phone number for WhatsApp (+ prefix, digits only)
        const rawPhoneNumber = (reminder.phone_number || '').toString().replace(/\D/g, '');
        const whatsappPhoneNumber = `+${rawPhoneNumber}`;

        // Send WhatsApp message using the same API format as other functions
        const whatsappResponse = await fetch('https://wp.palmart.ps/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: whatsappPhoneNumber,
            text: reminder.message,
          }),
        });

        const whatsappData = await whatsappResponse.json();

        if (whatsappResponse.ok && whatsappData.success !== false) {
          // Update reminder status to sent
          await supabase
            .from('reminders')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              error_message: null,
            })
            .eq('id', reminder.id);

          console.log(`Reminder sent successfully: ${reminder.id}`);
          results.sent++;
        } else {
          // If WhatsApp is still connecting, keep the reminder as pending so it can be retried
          if (whatsappData?.status === 'connecting') {
            console.warn(`WhatsApp still connecting for reminder ${reminder.id}:`, whatsappData);

            await supabase
              .from('reminders')
              .update({
                status: 'pending',
                error_message: JSON.stringify(whatsappData),
              })
              .eq('id', reminder.id);
          } else {
            // For real errors, mark as failed
            await supabase
              .from('reminders')
              .update({
                status: 'failed',
                error_message: JSON.stringify(whatsappData),
              })
              .eq('id', reminder.id);

            console.error(`Failed to send reminder ${reminder.id}:`, whatsappData);
            results.errors.push(`Reminder ${reminder.id}: WhatsApp API error`);
            results.failed++;
          }
        }

      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Update reminder status to failed
        await supabase
          .from('reminders')
          .update({
            status: 'failed',
            error_message: errorMessage,
          })
          .eq('id', reminder.id);

        results.errors.push(`Reminder ${reminder.id}: ${errorMessage}`);
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
