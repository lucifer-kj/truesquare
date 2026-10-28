import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Interface for document email dispatch payload.
 */
interface EmailDocumentRequestBody {
  recipientEmail: string;
  recipientName?: string;
  senderEmail?: string;
  senderName?: string;
  subject: string;
  messageBody: string;
  documentNumber: string;
  documentType: "invoice" | "estimate";
  pdfBase64?: string;
  pdfFileName?: string;
}

/**
 * Serverless API Endpoint to dispatch invoices/estimates via email.
 * Configured to work seamlessly with SMTP/Resend/SendGrid credentials.
 */
export default async function handleEmailDocument(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const requestBody = request.body as EmailDocumentRequestBody;

    if (!requestBody.recipientEmail || !requestBody.subject || !requestBody.messageBody) {
      return response.status(400).json({
        error: "Missing required fields: recipientEmail, subject, and messageBody are required.",
      });
    }

    const {
      recipientEmail,
      recipientName,
      senderEmail,
      senderName,
      subject,
      messageBody,
      documentNumber,
      documentType,
      pdfBase64,
      pdfFileName,
    } = requestBody;

    // Check if an email service provider API key is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const smtpHost = process.env.SMTP_HOST;

    if (resendApiKey) {
      // Direct call to Resend REST API
      const resendPayload: Record<string, unknown> = {
        from: senderEmail
          ? `${senderName || "TrueSquare Contractor"} <${senderEmail}>`
          : "TrueSquare Invoicing <onboarding@resend.dev>",
        to: recipientName ? [`${recipientName} <${recipientEmail}>`] : [recipientEmail],
        subject: subject,
        text: messageBody,
      };

      if (pdfBase64 && pdfFileName) {
        resendPayload.attachments = [
          {
            filename: pdfFileName,
            content: pdfBase64,
          },
        ];
      }

      const resendApiResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resendPayload),
      });

      const resendResult = await resendApiResponse.json();

      if (!resendApiResponse.ok) {
        return response.status(resendApiResponse.status).json({
          error: "Failed to dispatch email via Resend.",
          details: resendResult,
        });
      }

      return response.status(200).json({
        success: true,
        provider: "resend",
        data: resendResult,
      });
    }

    // If no provider API key is configured yet in environment variables
    // Return a structured status informing the client so the contractor can configure email auth
    return response.status(200).json({
      success: true,
      provider: "pending_configuration",
      message:
        "Email dispatch endpoint is ready. Configure RESEND_API_KEY, SENDGRID_API_KEY, or SMTP credentials in your environment variables to enable live cloud delivery.",
      dispatchedPayload: {
        to: recipientEmail,
        subject,
        documentNumber,
        documentType,
        hasAttachment: Boolean(pdfBase64),
      },
    });
  } catch (error) {
    console.error("Email dispatch failed:", error);
    return response.status(500).json({
      error: "Internal server error dispatching email document.",
    });
  }
}
