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
 * Serverless API Endpoint to dispatch invoices/estimates via webhook (e.g. n8n).
 * Forwards senderEmail, recipientEmail, subject, body, and data (invoice as base64) with authorization.
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

    // Webhook destination and Bearer token from environment (or default n8n endpoint)
    const emailWebhookUrl =
      process.env.EMAIL_WEBHOOK_URL ||
      "https://n8n.alphabusinessdesigns.co.uk/webhook/477405ad-5d41-44f4-bec5-8e34c5451f84";
    const emailWebhookToken =
      process.env.EMAIL_WEBHOOK_AUTH_TOKEN ||
      "jksfbl24b32jkb4bdfjgQEjpJ46r3El0c71b2";

    // Format payload as expected by n8n workflow:
    // senderEmail, recipientEmail, subject, body, and data (invoice as base64)
    const webhookPayload = {
      senderEmail: senderEmail || "billing@truesquare.app",
      senderName: senderName || "TrueSquare Invoicing Studio",
      recipientEmail: recipientEmail.trim(),
      recipientName: recipientName || recipientEmail.split("@")[0] || "Client",
      subject: subject,
      body: messageBody,
      data: pdfBase64 || "",
      filename: pdfFileName || `${documentNumber || "INV-0001"}.pdf`,
      documentNumber: documentNumber || "INV-0001",
      documentType: documentType || "invoice",
      dispatchedAt: new Date().toISOString(),
    };

    const webhookHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `bearer ${emailWebhookToken}`,
    };

    const webhookApiResponse = await fetch(emailWebhookUrl, {
      method: "POST",
      headers: webhookHeaders,
      body: JSON.stringify(webhookPayload),
    });

    const responseStatus = webhookApiResponse.status;
    const responseText = await webhookApiResponse.text();

    if (!webhookApiResponse.ok) {
      return response.status(responseStatus).json({
        error: "Failed to dispatch email request to n8n webhook.",
        status: responseStatus,
        details: responseText,
      });
    }

    let parsedResponse: unknown = null;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      parsedResponse = { raw: responseText };
    }

    return response.status(200).json({
      success: true,
      provider: "n8n_webhook",
      data: parsedResponse,
    });
  } catch (error) {
    console.error("Email webhook dispatch failed:", error);
    return response.status(500).json({
      error: "Internal server error dispatching email to webhook.",
    });
  }
}
