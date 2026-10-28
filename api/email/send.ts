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
 * Dispatches true binary multipart/form-data where `data` is sent as a native binary PDF file.
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

    const cleanPdfFileName = pdfFileName || `${documentNumber || "INV-0001"}.pdf`;

    // Construct native multipart/form-data so `data` is sent as pure binary PDF file
    const formData = new FormData();
    formData.append("senderEmail", senderEmail || "billing@truesquare.app");
    formData.append("senderName", senderName || "TrueSquare Invoicing Studio");
    formData.append("recipientEmail", recipientEmail.trim());
    formData.append("recipientName", recipientName || recipientEmail.split("@")[0] || "Client");
    formData.append("subject", subject);
    formData.append("body", messageBody);
    formData.append("filename", cleanPdfFileName);
    formData.append("documentNumber", documentNumber || "INV-0001");
    formData.append("documentType", documentType || "invoice");
    formData.append("dispatchedAt", new Date().toISOString());

    if (pdfBase64) {
      // Decode Base64 to binary buffer and append as a true binary File Blob under the field `data`
      const binaryBuffer = Buffer.from(pdfBase64, "base64");
      const pdfBinaryBlob = new Blob([binaryBuffer], { type: "application/pdf" });
      formData.append("data", pdfBinaryBlob, cleanPdfFileName);
    }

    const webhookHeaders: Record<string, string> = {
      Authorization: `bearer ${emailWebhookToken}`,
    };

    const webhookApiResponse = await fetch(emailWebhookUrl, {
      method: "POST",
      headers: webhookHeaders,
      body: formData,
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
      binaryDataSent: Boolean(pdfBase64),
      data: parsedResponse,
    });
  } catch (error) {
    console.error("Email webhook dispatch failed:", error);
    return response.status(500).json({
      error: "Internal server error dispatching email to webhook.",
    });
  }
}
