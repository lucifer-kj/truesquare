import type { FC } from "react";
import type { ContractorBusinessProfile } from "@/domain/types";
import { Building2 } from "lucide-react";

interface ContractorProfileFormProps {
  contractorProfile: ContractorBusinessProfile;
  onUpdateContractorProfile: (updatedProfile: ContractorBusinessProfile) => void;
}

export const ContractorProfileForm: FC<ContractorProfileFormProps> = ({
  contractorProfile,
  onUpdateContractorProfile,
}) => {
  const handleProfileFieldChange = (
    fieldName: keyof ContractorBusinessProfile,
    fieldValue: string | number | string[]
  ) => {
    onUpdateContractorProfile({
      ...contractorProfile,
      [fieldName]: fieldValue,
    });
  };

  const handleAddressLineChange = (lineIndex: number, lineContent: string) => {
    const updatedAddressLines = [...contractorProfile.addressLines];
    updatedAddressLines[lineIndex] = lineContent;
    handleProfileFieldChange("addressLines", updatedAddressLines);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 pb-2 border-b border-border">
        <Building2 className="w-4 h-4 text-primary" />
        <h4 className="text-xs font-bold tracking-tight text-foreground">
          Contractor Business Profile
        </h4>
        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
          Letterhead Info
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Company / Business Name
          </label>
          <input
            type="text"
            value={contractorProfile.businessName}
            onChange={(changeEvent) =>
              handleProfileFieldChange("businessName", changeEvent.target.value)
            }
            className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Business Phone
          </label>
          <input
            type="text"
            value={contractorProfile.phone}
            onChange={(changeEvent) =>
              handleProfileFieldChange("phone", changeEvent.target.value)
            }
            className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Business Email
          </label>
          <input
            type="email"
            value={contractorProfile.email}
            onChange={(changeEvent) =>
              handleProfileFieldChange("email", changeEvent.target.value)
            }
            className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Street Address
          </label>
          <input
            type="text"
            value={contractorProfile.addressLines[0] || ""}
            onChange={(changeEvent) =>
              handleAddressLineChange(0, changeEvent.target.value)
            }
            className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            City
          </label>
          <input
            type="text"
            value={contractorProfile.city}
            onChange={(changeEvent) =>
              handleProfileFieldChange("city", changeEvent.target.value)
            }
            className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            State / Region
          </label>
          <input
            type="text"
            value={contractorProfile.region}
            onChange={(changeEvent) =>
              handleProfileFieldChange("region", changeEvent.target.value)
            }
            className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Postal Code
          </label>
          <input
            type="text"
            value={contractorProfile.postalCode}
            onChange={(changeEvent) =>
              handleProfileFieldChange("postalCode", changeEvent.target.value)
            }
            className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          />
        </div>
      </div>
    </div>
  );
};
