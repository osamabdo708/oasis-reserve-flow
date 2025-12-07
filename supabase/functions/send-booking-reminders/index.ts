import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting booking reminder process...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    console.log("Checking reminders at:", now.toISOString());

    const { data: pendingReminders, error: remindersError } = await supabase
      .from("reminders")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", now.toISOString());

    if (remindersError) throw remindersError;

    console.log(
      `Found ${pendingReminders?.length || 0} pending reminders to send`,
    );

    if (!pendingReminders || pendingReminders.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No pending reminders to send",
          count: 0,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        },
      );
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const reminder of pendingReminders) {
      try {
        console.log(
          `Sending reminder ${reminder.id} to ${reminder.phone_number}`,
        );

        const rawPhoneNumber = (reminder.phone_number || "")
          .toString()
          .replace(/\D/g, "");
        const whatsappPhoneNumber = `+${rawPhoneNumber}`;

        console.log('Sending WhatsApp reminder to:', whatsappPhoneNumber);

        // Send WhatsApp message - same pattern as approve-booking and send-verification
        const whatsappResponse = await fetch("https://wp.palmart.ps/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: whatsappPhoneNumber,
            text: reminder.message,
          }),
        });

        const whatsappData = await whatsappResponse.json();
        
        console.log('WhatsApp API response:', whatsappResponse.status, whatsappData);

        if (!whatsappResponse.ok) {
          console.error("WhatsApp API error:", whatsappData);
          
          // If WhatsApp is still connecting, keep the reminder as pending to retry later
          if (whatsappData.status === 'connecting') {
            console.log('WhatsApp is connecting, will retry later');
            results.errors.push(`Reminder ${reminder.id}: WhatsApp connecting, will retry`);
            continue; // Don't mark as failed, keep as pending
          }

          await supabase
            .from("reminders")
            .update({
              status: "failed",
              error_message: JSON.stringify(whatsappData),
            })
            .eq("id", reminder.id);

          results.errors.push(
            `Reminder ${reminder.id}: WhatsApp API error`,
          );
          results.failed++;
          continue;
        }

        // Check if response indicates success
        if (whatsappData.success === false) {
          console.error('WhatsApp API returned unsuccessful:', whatsappData);
          
          await supabase
            .from("reminders")
            .update({
              status: "failed",
              error_message: JSON.stringify(whatsappData),
            })
            .eq("id", reminder.id);

          results.errors.push(`Reminder ${reminder.id}: WhatsApp unsuccessful`);
          results.failed++;
          continue;
        }

        // Mark as sent
        await supabase
          .from("reminders")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            error_message: null,
          })
          .eq("id", reminder.id);

        console.log(`Reminder sent successfully: ${reminder.id}, messageId:`, whatsappData.messageId);
        results.sent++;
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error);

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        await supabase
          .from("reminders")
          .update({
            status: "failed",
            error_message: errorMessage,
          })
          .eq("id", reminder.id);

        results.errors.push(`Reminder ${reminder.id}: ${errorMessage}`);
        results.failed++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Reminder process completed",
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in send-booking-reminders:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      },
    );
  }
});
