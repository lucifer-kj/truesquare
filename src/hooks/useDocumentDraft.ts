import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type {
  InvoiceEstimateDocument,
  DocumentClassificationType,
  ContractorBusinessProfile,
  ClientCustomerRecord,
  SupplyLineItem,
  CalculatedDocumentTotals,
} from "../domain/types";
import { calculateDocumentTotals } from "../domain/calculations";
import {
  createNewDocumentDraft,
} from "../domain/document-factory";
import {
  loadPersistedContractorProfile,
  savePersistedContractorProfile,
  loadPersistedDocumentDraft,
  savePersistedDocumentDraft,
  saveFinalizedDocumentToArchive,
  loadPersistedSavedDocuments,
  savePersistedRecentClient,
} from "../services/local-storage-service";
import { generateDocumentNumber } from "../domain/invoice-number";

export type DraftPersistenceStatus = "saved" | "saving" | "idle";

export function useDocumentDraft() {
  const [contractorProfile, setContractorProfileState] = useState<ContractorBusinessProfile>(() =>
    loadPersistedContractorProfile()
  );

  const [activeDocument, setActiveDocument] = useState<InvoiceEstimateDocument>(() => {
    const existingDraft = loadPersistedDocumentDraft();
    if (existingDraft) return existingDraft;

    const initialProfile = loadPersistedContractorProfile();
    const existingArchive = loadPersistedSavedDocuments();
    const existingNumbers = existingArchive.map((doc) => doc.documentNumber);

    return createNewDocumentDraft({
      documentType: "estimate",
      contractorProfile: initialProfile,
      existingDocumentNumbers: existingNumbers,
    });
  });

  const [persistenceStatus, setPersistenceStatus] = useState<DraftPersistenceStatus>("saved");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced auto-save effect
  useEffect(() => {
    setPersistenceStatus("saving");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      savePersistedDocumentDraft(activeDocument);
      setPersistenceStatus("saved");
    }, 600);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [activeDocument]);

  // Derived financial totals
  const calculatedTotals: CalculatedDocumentTotals = useMemo(() => {
    return calculateDocumentTotals({
      supplyItems: activeDocument.items,
      taxRateBasisPoints: activeDocument.taxRateBasisPoints,
      targetBudgetTotalCents: activeDocument.targetTotalCents,
    });
  }, [activeDocument.items, activeDocument.taxRateBasisPoints, activeDocument.targetTotalCents]);

  const updateContractorProfile = useCallback((newProfile: ContractorBusinessProfile) => {
    setContractorProfileState(newProfile);
    savePersistedContractorProfile(newProfile);
    setActiveDocument((prevDoc) => ({
      ...prevDoc,
      business: { ...newProfile },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateClientRecord = useCallback((newClient: ClientCustomerRecord) => {
    setActiveDocument((prevDoc) => ({
      ...prevDoc,
      client: { ...newClient },
      updatedAt: new Date().toISOString(),
    }));
    if (newClient.name.trim()) {
      savePersistedRecentClient(newClient);
    }
  }, []);

  const updateDocumentType = useCallback((newType: DocumentClassificationType) => {
    setActiveDocument((prevDoc) => {
      if (prevDoc.documentType === newType) return prevDoc;
      const existingArchive = loadPersistedSavedDocuments();
      const existingNumbers = existingArchive.map((doc) => doc.documentNumber);
      const newDocNumber = generateDocumentNumber(newType, existingNumbers);

      return {
        ...prevDoc,
        documentType: newType,
        documentNumber: newDocNumber,
        paymentTerms: newType === "invoice" ? "Net 30 Days" : "Estimate valid for 30 days from issue date.",
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  const updateDates = useCallback((issueDate: string, dueOrExpiryDate?: string) => {
    setActiveDocument((prevDoc) => ({
      ...prevDoc,
      issueDate,
      dueOrExpiryDate,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const addSupplyLineItem = useCallback((newItem: SupplyLineItem) => {
    setActiveDocument((prevDoc) => ({
      ...prevDoc,
      items: [...prevDoc.items, newItem],
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateSupplyLineItem = useCallback((itemId: string, itemUpdates: Partial<SupplyLineItem>) => {
    setActiveDocument((prevDoc) => ({
      ...prevDoc,
      items: prevDoc.items.map((existingItem) =>
        existingItem.id === itemId ? { ...existingItem, ...itemUpdates } : existingItem
      ),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const removeSupplyLineItem = useCallback((itemId: string) => {
    setActiveDocument((prevDoc) => ({
      ...prevDoc,
      items: prevDoc.items.filter((existingItem) => existingItem.id !== itemId),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateTaxSettings = useCallback((taxLabel: string, taxRateBasisPoints: number) => {
    setActiveDocument((prevDoc) => ({
      ...prevDoc,
      taxLabel,
      taxRateBasisPoints,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateNotesAndTerms = useCallback((notes: string, paymentTerms: string) => {
    setActiveDocument((prevDoc) => ({
      ...prevDoc,
      notes,
      paymentTerms,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const applyProposedLineItems = useCallback((proposedItems: SupplyLineItem[], targetBudgetCents: number) => {
    setActiveDocument((prevDoc) => ({
      ...prevDoc,
      items: [...proposedItems],
      targetTotalCents: targetBudgetCents,
      generatedFromBudget: true,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const startNewBlankDocument = useCallback((type: DocumentClassificationType = "estimate") => {
    const existingArchive = loadPersistedSavedDocuments();
    const existingNumbers = existingArchive.map((doc) => doc.documentNumber);

    const freshDraft = createNewDocumentDraft({
      documentType: type,
      contractorProfile,
      existingDocumentNumbers: existingNumbers,
    });

    setActiveDocument(freshDraft);
    savePersistedDocumentDraft(freshDraft);
  }, [contractorProfile]);

  const loadArchivedDocumentIntoDraft = useCallback((archivedDoc: InvoiceEstimateDocument) => {
    setActiveDocument({ ...archivedDoc, documentStatus: "draft" });
    savePersistedDocumentDraft(archivedDoc);
  }, []);

  const duplicateActiveDocument = useCallback(() => {
    const existingArchive = loadPersistedSavedDocuments();
    const existingNumbers = existingArchive.map((doc) => doc.documentNumber);
    const newDocNumber = generateDocumentNumber(activeDocument.documentType, existingNumbers);

    const duplicatedDoc: InvoiceEstimateDocument = {
      ...activeDocument,
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      documentNumber: newDocNumber,
      documentStatus: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setActiveDocument(duplicatedDoc);
    savePersistedDocumentDraft(duplicatedDoc);
  }, [activeDocument]);

  const finalizeAndArchiveDocument = useCallback(() => {
    saveFinalizedDocumentToArchive(activeDocument);
    setActiveDocument((prevDoc) => ({
      ...prevDoc,
      documentStatus: "saved",
      updatedAt: new Date().toISOString(),
    }));
  }, [activeDocument]);

  return {
    activeDocument,
    contractorProfile,
    calculatedTotals,
    persistenceStatus,
    updateContractorProfile,
    updateClientRecord,
    updateDocumentType,
    updateDates,
    addSupplyLineItem,
    updateSupplyLineItem,
    removeSupplyLineItem,
    updateTaxSettings,
    updateNotesAndTerms,
    applyProposedLineItems,
    startNewBlankDocument,
    loadArchivedDocumentIntoDraft,
    duplicateActiveDocument,
    finalizeAndArchiveDocument,
  };
}
