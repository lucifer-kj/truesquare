import { z } from "zod";
import type {
  ContractorBusinessProfile,
  ClientCustomerRecord,
  InvoiceEstimateDocument,
} from "../domain/types";
import {
  ContractorBusinessProfileSchema,
  ClientCustomerRecordSchema,
  InvoiceEstimateDocumentSchema,
} from "../domain/schemas";
import { createDefaultContractorBusinessProfile } from "../domain/document-factory";

const STORAGE_KEYS = {
  CONTRACTOR_PROFILE: "buildbill:v1:business-settings",
  CURRENT_DOCUMENT_DRAFT: "buildbill:v1:last-draft",
  RECENT_CLIENT_RECORDS: "buildbill:v1:recent-clients",
  SAVED_DOCUMENT_ARCHIVE: "buildbill:v1:recent-documents",
} as const;

export function loadPersistedContractorProfile(): ContractorBusinessProfile {
  try {
    const serializedProfile = localStorage.getItem(STORAGE_KEYS.CONTRACTOR_PROFILE);
    if (!serializedProfile) {
      return createDefaultContractorBusinessProfile();
    }
    const parsedJson = JSON.parse(serializedProfile);
    const validatedResult = ContractorBusinessProfileSchema.safeParse(parsedJson);
    if (validatedResult.success) {
      return validatedResult.data;
    }
    console.warn("Stored contractor profile failed validation; recovering defaults.", validatedResult.error);
    return createDefaultContractorBusinessProfile();
  } catch (storageReadError) {
    console.warn("Unable to access localStorage for contractor profile:", storageReadError);
    return createDefaultContractorBusinessProfile();
  }
}

export function savePersistedContractorProfile(contractorProfile: ContractorBusinessProfile): boolean {
  try {
    const validatedResult = ContractorBusinessProfileSchema.safeParse(contractorProfile);
    if (!validatedResult.success) return false;
    localStorage.setItem(STORAGE_KEYS.CONTRACTOR_PROFILE, JSON.stringify(validatedResult.data));
    return true;
  } catch (storageWriteError) {
    console.warn("Unable to persist contractor profile to localStorage:", storageWriteError);
    return false;
  }
}

export function loadPersistedDocumentDraft(): InvoiceEstimateDocument | null {
  try {
    const serializedDraft = localStorage.getItem(STORAGE_KEYS.CURRENT_DOCUMENT_DRAFT);
    if (!serializedDraft) return null;
    const parsedDraftJson = JSON.parse(serializedDraft);
    const validatedDraftResult = InvoiceEstimateDocumentSchema.safeParse(parsedDraftJson);
    if (validatedDraftResult.success) {
      return validatedDraftResult.data;
    }
    console.warn("Stored document draft failed validation, ignoring corrupt draft.");
    return null;
  } catch (storageDraftReadError) {
    console.warn("Unable to access localStorage for document draft:", storageDraftReadError);
    return null;
  }
}

export function savePersistedDocumentDraft(activeDraftDocument: InvoiceEstimateDocument): boolean {
  try {
    const validatedDraftResult = InvoiceEstimateDocumentSchema.safeParse(activeDraftDocument);
    if (!validatedDraftResult.success) return false;
    localStorage.setItem(STORAGE_KEYS.CURRENT_DOCUMENT_DRAFT, JSON.stringify(validatedDraftResult.data));
    return true;
  } catch (storageDraftWriteError) {
    console.warn("Unable to persist document draft to localStorage:", storageDraftWriteError);
    return false;
  }
}

export function clearPersistedDocumentDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_DOCUMENT_DRAFT);
  } catch (storageRemoveError) {
    console.warn("Error removing document draft from localStorage:", storageRemoveError);
  }
}

export function loadPersistedRecentClients(maximumClientCount = 10): ClientCustomerRecord[] {
  try {
    const serializedClients = localStorage.getItem(STORAGE_KEYS.RECENT_CLIENT_RECORDS);
    if (!serializedClients) return [];
    const parsedClientsJson = JSON.parse(serializedClients);
    const clientListValidation = z.array(ClientCustomerRecordSchema).safeParse(parsedClientsJson);
    if (clientListValidation.success) {
      return clientListValidation.data.slice(0, maximumClientCount);
    }
    return [];
  } catch {
    return [];
  }
}

export function savePersistedRecentClient(newClientRecord: ClientCustomerRecord): void {
  if (!newClientRecord.name.trim()) return;
  try {
    const existingClientList = loadPersistedRecentClients(20);
    const updatedClientList = [
      newClientRecord,
      ...existingClientList.filter((existingClient) => existingClient.id !== newClientRecord.id),
    ].slice(0, 10);
    localStorage.setItem(STORAGE_KEYS.RECENT_CLIENT_RECORDS, JSON.stringify(updatedClientList));
  } catch (clientWriteError) {
    console.warn("Error saving recent client record:", clientWriteError);
  }
}

export function loadPersistedSavedDocuments(maximumDocumentCount = 20): InvoiceEstimateDocument[] {
  try {
    const serializedDocuments = localStorage.getItem(STORAGE_KEYS.SAVED_DOCUMENT_ARCHIVE);
    if (!serializedDocuments) return [];
    const parsedDocumentsJson = JSON.parse(serializedDocuments);
    const documentListValidation = z.array(InvoiceEstimateDocumentSchema).safeParse(parsedDocumentsJson);
    if (documentListValidation.success) {
      return documentListValidation.data.slice(0, maximumDocumentCount);
    }
    return [];
  } catch {
    return [];
  }
}

export function saveFinalizedDocumentToArchive(finalizedDocument: InvoiceEstimateDocument): void {
  try {
    const existingArchiveList = loadPersistedSavedDocuments(50);
    const updatedArchiveList = [
      { ...finalizedDocument, documentStatus: "saved" as const, updatedAt: new Date().toISOString() },
      ...existingArchiveList.filter((doc) => doc.id !== finalizedDocument.id),
    ].slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.SAVED_DOCUMENT_ARCHIVE, JSON.stringify(updatedArchiveList));
  } catch (archiveWriteError) {
    console.warn("Error archiving document:", archiveWriteError);
  }
}

export function deleteDocumentFromArchive(targetDocumentIdentifier: string): void {
  try {
    const existingArchiveList = loadPersistedSavedDocuments(50);
    const filteredArchiveList = existingArchiveList.filter((doc) => doc.id !== targetDocumentIdentifier);
    localStorage.setItem(STORAGE_KEYS.SAVED_DOCUMENT_ARCHIVE, JSON.stringify(filteredArchiveList));
  } catch (archiveDeleteError) {
    console.warn("Error deleting document from archive:", archiveDeleteError);
  }
}

export function clearAllLocalApplicationData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONTRACTOR_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_DOCUMENT_DRAFT);
    localStorage.removeItem(STORAGE_KEYS.RECENT_CLIENT_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.SAVED_DOCUMENT_ARCHIVE);
  } catch (storagePurgeError) {
    console.warn("Error purging local storage data:", storagePurgeError);
  }
}
