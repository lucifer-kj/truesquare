import type { DocumentClassificationType } from "./types";

/**
 * Generate a local-first sequential document reference code.
 * Pattern: EST-YYYY-0001 or INV-YYYY-0001
 * Checks against existing stored numbers to prevent collisions.
 */
export function generateDocumentNumber(
  documentType: DocumentClassificationType,
  existingDocumentNumbers: string[],
  calendarYear: number = new Date().getFullYear()
): string {
  const documentPrefix = documentType === "estimate" ? "EST" : "INV";
  const yearPrefix = `${documentPrefix}-${calendarYear}-`;

  const matchingSequences = existingDocumentNumbers
    .filter((docNum) => docNum.startsWith(yearPrefix))
    .map((docNum) => {
      const sequenceString = docNum.slice(yearPrefix.length);
      const parsedSequence = parseInt(sequenceString, 10);
      return Number.isFinite(parsedSequence) ? parsedSequence : 0;
    });

  const nextSequenceNumber = matchingSequences.length > 0 ? Math.max(...matchingSequences) + 1 : 1;
  const paddedSequence = String(nextSequenceNumber).padStart(4, "0");

  return `${yearPrefix}${paddedSequence}`;
}
