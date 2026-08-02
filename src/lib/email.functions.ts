import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  subject: z.string().trim().min(3).max(180),
  message: z.string().trim().min(10).max(4000),
  recipients: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string().trim().max(120),
        email: z.string().trim().email().max(255),
      }),
    )
    .min(1)
    .max(10),
});

export type SendEmailsResponse = {
  /** false when no free email service is connected yet. */
  configured: boolean;
  results: { id: string; status: "delivered" | "failed"; error?: string }[];
};

/**
 * Sends the RESQORA emergency email to every trusted contact through EmailJS.
 * Sign-in is required and the caller is rate limited so the endpoint can never
 * be used as an open relay.
 */
export const sendEmergencyEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<SendEmailsResponse> => {
    const { enforceLimit } = await import("@/lib/rate-limit.server");
    enforceLimit(getRequest(), "email", 20, 5 * 60_000);
    const { emailConfig, sendViaEmailJs } = await import("@/lib/email.server");
    if (!emailConfig()) return { configured: false, results: [] };
    const results = await sendViaEmailJs(data);
    return { configured: true, results };
  });