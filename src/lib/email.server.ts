/**
 * EmailJS REST transport. EmailJS' free tier needs no paid provider — the app
 * only needs a service id, template id, public key and private key stored as
 * secrets. When they are missing the caller falls back to manual channels.
 */
export type EmailRecipient = { id: string; name: string; email: string };
export type EmailResult = { id: string; status: "delivered" | "failed"; error?: string };

export function emailConfig() {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  if (!serviceId || !templateId || !publicKey || !privateKey) return null;
  return { serviceId, templateId, publicKey, privateKey };
}

export async function sendViaEmailJs(input: {
  recipients: EmailRecipient[];
  subject: string;
  message: string;
}): Promise<EmailResult[]> {
  const config = emailConfig();
  if (!config) return [];
  const results: EmailResult[] = [];

  for (const recipient of input.recipients) {
    try {
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: config.serviceId,
          template_id: config.templateId,
          user_id: config.publicKey,
          accessToken: config.privateKey,
          template_params: {
            to_email: recipient.email,
            to_name: recipient.name,
            subject: input.subject,
            message: input.message,
          },
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        console.error(`RESQORA email failed [${response.status}]: ${body}`);
        results.push({
          id: recipient.id,
          status: "failed",
          error: `Email provider error ${response.status}`,
        });
        continue;
      }
      results.push({ id: recipient.id, status: "delivered" });
    } catch (error) {
      results.push({
        id: recipient.id,
        status: "failed",
        error: error instanceof Error ? error.message : "Network error",
      });
    }
  }

  return results;
}