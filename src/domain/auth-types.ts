export type OperatorRole = "owner" | "estimator" | "accountant";

export type OperatorAccountProfile = {
  operatorId: string;
  displayName: string;
  role: OperatorRole;
  companyName: string;
  avatarInitials: string;
  hasPinConfigured: boolean;
};

export type OperatorSessionLockState = "unlocked" | "locked";

export type OperatorSessionState = {
  lockState: OperatorSessionLockState;
  activeOperator: OperatorAccountProfile;
  lastUnlockedAt?: string;
};

export type CloudBackupSnapshot = {
  snapshotId: string;
  documentId: string;
  documentNumber: string;
  documentType: "invoice" | "estimate";
  totalCents: number;
  encryptedPayloadBase64: string;
  backupTimestamp: string;
  checksumSha256: string;
};
