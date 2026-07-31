import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  subject: z.string().min(3).max(180),
  message: z.string().min(10).max(4000),
  recipients: z
    .array(z.object({ id: z.string(), name: z.string().max(120), email: z.string().email() }))
    .min(1)
    .max(10),
});

export type SendEmailsResponse = {
  /** false when no free email service is connected yet. */
  configured: boolean;
  results: { id: string; status: "delivered" | "failed"; error?: string }[];
};

/** Sends the AEGIS emergency email to every trusted contact through EmailJS. */
export const sendEmergencyEmails = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<SendEmailsResponse> => {
    const { emailConfig, sendViaEmailJs } = await import("@/lib/email.server");
    if (!emailConfig()) return { configured: false, results: [] };
    const results = await sendViaEmailJs(data);
    return { configured: true, results };
  });