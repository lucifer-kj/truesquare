import { describe, it, expect, beforeEach } from "vitest";
import {
  loadPersistedContractorProfile,
  savePersistedContractorProfile,
  loadPersistedDocumentDraft,
  savePersistedDocumentDraft,
  clearPersistedDocumentDraft,
  loadPersistedRecentClients,
  savePersistedRecentClient,
  loadPersistedSavedDocuments,
  saveFinalizedDocumentToArchive,
  deleteDocumentFromArchive,
  clearAllLocalApplicationData,
} from "../src/services/local-storage-service";
import {
  createDefaultContractorBusinessProfile,
  createNewDocumentDraft,
} from "../src/domain/document-factory";

// Simple in-memory localStorage polyfill for testing
const mockStorageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => mockStorageMap.get(key) || null,
  setItem: (key: string, value: string) => mockStorageMap.set(key, value),
  removeItem: (key: string) => mockStorageMap.delete(key),
  clear: () => mockStorageMap.clear(),
};
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("Service: Local Storage Persistence & Schema Recovery", () => {
  beforeEach(() => {
    mockStorageMap.clear();
  });

  it("loads default contractor profile when storage is empty", () => {
    const profile = loadPersistedContractorProfile();
    expect(profile.businessName).toBe("Acme Building & Supplies LLC");
  });

  it("persists and restores updated contractor profile", () => {
    const updatedProfile = {
      ...createDefaultContractorBusinessProfile(),
      businessName: "Highland Construction Supply",
    };

    savePersistedContractorProfile(updatedProfile);
    const restored = loadPersistedContractorProfile();
    expect(restored.businessName).toBe("Highland Construction Supply");
  });

  it("recovers safely when contractor profile in storage is corrupt", () => {
    localStorageMock.setItem("buildbill:v1:business-settings", "{ corrupt json / invalid }");
    const recoveredProfile = loadPersistedContractorProfile();
    expect(recoveredProfile.businessName).toBe("Acme Building & Supplies LLC");
  });

  it("persists, reloads, and clears document draft", () => {
    const draft = createNewDocumentDraft({
      documentType: "estimate",
      contractorProfile: createDefaultContractorBusinessProfile(),
    });

    savePersistedDocumentDraft(draft);
    const restoredDraft = loadPersistedDocumentDraft();
    expect(restoredDraft).not.toBeNull();
    expect(restoredDraft?.documentNumber).toBe(draft.documentNumber);

    clearPersistedDocumentDraft();
    expect(loadPersistedDocumentDraft()).toBeNull();
  });

  it("manages recent client records with deduplication and order", () => {
    savePersistedRecentClient({
      id: "client-1",
      name: "Alice Builder",
      addressLines: ["123 Elm St"],
    });

    savePersistedRecentClient({
      id: "client-2",
      name: "Bob Contractor",
      addressLines: ["456 Oak St"],
    });

    // Re-saving client-1 puts them at the front
    savePersistedRecentClient({
      id: "client-1",
      name: "Alice Builder Updated",
      addressLines: ["123 Elm St"],
    });

    const recentList = loadPersistedRecentClients();
    expect(recentList.length).toBe(2);
    expect(recentList[0].name).toBe("Alice Builder Updated");
  });

  it("archives and deletes documents from saved document store", () => {
    const doc1 = createNewDocumentDraft({
      documentType: "invoice",
      contractorProfile: createDefaultContractorBusinessProfile(),
    });
    doc1.id = "doc-alpha";

    saveFinalizedDocumentToArchive(doc1);
    let archive = loadPersistedSavedDocuments();
    expect(archive.length).toBe(1);
    expect(archive[0].id).toBe("doc-alpha");
    expect(archive[0].documentStatus).toBe("saved");

    deleteDocumentFromArchive("doc-alpha");
    archive = loadPersistedSavedDocuments();
    expect(archive.length).toBe(0);
  });

  it("clears all local application data cleanly", () => {
    savePersistedContractorProfile(createDefaultContractorBusinessProfile());
    clearAllLocalApplicationData();
    expect(mockStorageMap.size).toBe(0);
  });
});
