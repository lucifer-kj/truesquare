import { useState, useRef, useEffect, type FC } from "react";
import type { ClientCustomerRecord } from "@/domain/types";
import { UserCheck, MapPin, Sparkles, Building2 } from "lucide-react";
import {
  searchLocationSuggestions,
  type GeographicLocationPreset,
} from "@/services/location-autocomplete-service";

interface ClientCustomerFormProps {
  clientCustomerRecord: ClientCustomerRecord;
  onUpdateClientRecord: (updatedClientRecord: ClientCustomerRecord) => void;
}

type SearchableLocationField = "companyName" | "streetAddress" | "city" | "postalCode";

export const ClientCustomerForm: FC<ClientCustomerFormProps> = ({
  clientCustomerRecord,
  onUpdateClientRecord,
}) => {
  const [activeSearchField, setActiveSearchField] = useState<SearchableLocationField | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<GeographicLocationPreset[]>([]);
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (mouseEvent: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(mouseEvent.target as Node)
      ) {
        setLocationSuggestions([]);
        setActiveSearchField(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleClientFieldChange = (
    fieldName: keyof ClientCustomerRecord,
    fieldValue: string | string[]
  ) => {
    onUpdateClientRecord({
      ...clientCustomerRecord,
      [fieldName]: fieldValue,
    });
  };

  const handleAddressLineChange = (lineIndex: number, lineContent: string) => {
    const updatedAddressLines = [...clientCustomerRecord.addressLines];
    updatedAddressLines[lineIndex] = lineContent;
    handleClientFieldChange("addressLines", updatedAddressLines);
  };

  const handleQueryLocations = (field: SearchableLocationField, valueText: string) => {
    if (field === "streetAddress") {
      handleAddressLineChange(0, valueText);
    } else {
      handleClientFieldChange(field, valueText);
    }
    setActiveSearchField(field);

    if (valueText.trim().length >= 2) {
      const suggestions = searchLocationSuggestions(valueText);
      setLocationSuggestions(suggestions);
    } else {
      setLocationSuggestions([]);
    }
  };

  const handleApplyLocationPreset = (preset: GeographicLocationPreset) => {
    const updatedAddressLines = [...clientCustomerRecord.addressLines];
    if (preset.streetAddressLine) {
      updatedAddressLines[0] = preset.streetAddressLine;
    }

    onUpdateClientRecord({
      ...clientCustomerRecord,
      companyName: clientCustomerRecord.companyName || preset.namedLocationTitle,
      addressLines: updatedAddressLines,
      city: preset.city,
      region: preset.region,
      postalCode: preset.postalCode,
      country: preset.country,
    });
    setLocationSuggestions([]);
    setActiveSearchField(null);
  };

  return (
    <div ref={dropdownContainerRef} className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center space-x-2">
          <UserCheck className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold tracking-tight text-foreground">
            Client &amp; Jobsite Destination
          </h4>
        </div>
        <span className="text-xs text-muted-foreground font-mono font-medium">
          {clientCustomerRecord.id || "CUST-DEFAULT"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Client Contact Name
          </label>
          <input
            type="text"
            value={clientCustomerRecord.name}
            onChange={(changeEvent) =>
              handleClientFieldChange("name", changeEvent.target.value)
            }
            autoCapitalize="words"
            autoCorrect="off"
            placeholder="e.g. Marcus Vance"
            className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          />
        </div>

        {/* Client Company / Jobsite with Smart Named Location Search */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-medium text-muted-foreground">
              Client Company / Jobsite Location
            </label>
            <span title="Smart Location Auto-Complete: Type any company or site name">
              <Sparkles className="w-2.5 h-2.5 text-sky-500" />
            </span>
          </div>
          <input
            type="text"
            value={clientCustomerRecord.companyName || ""}
            onChange={(changeEvent) =>
              handleQueryLocations("companyName", changeEvent.target.value)
            }
            onFocus={() => {
              if ((clientCustomerRecord.companyName || "").length >= 2) {
                handleQueryLocations("companyName", clientCustomerRecord.companyName || "");
              }
            }}
            autoCapitalize="words"
            autoCorrect="off"
            placeholder="e.g. Apex Commercial Center"
            className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Phone
          </label>
          <input
            type="tel"
            inputMode="tel"
            value={clientCustomerRecord.phone || ""}
            onChange={(changeEvent) =>
              handleClientFieldChange("phone", changeEvent.target.value)
            }
            placeholder="(512) 555-0182"
            className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          />
        </div>

        {/* Street Address with Smart Location Search */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-medium text-muted-foreground">
              Street Address
            </label>
            <span title="Smart Location Auto-Complete: Type street or landmark">
              <Sparkles className="w-2.5 h-2.5 text-sky-500" />
            </span>
          </div>
          <input
            type="text"
            value={clientCustomerRecord.addressLines[0] || ""}
            onChange={(changeEvent) =>
              handleQueryLocations("streetAddress", changeEvent.target.value)
            }
            onFocus={() => {
              const currentStreet = clientCustomerRecord.addressLines[0] || "";
              if (currentStreet.length >= 2) {
                handleQueryLocations("streetAddress", currentStreet);
              }
            }}
            placeholder="e.g. 4520 West Braker Lane"
            className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
          />
        </div>
      </div>

      <div className="relative">
        <div className="grid grid-cols-3 gap-2">
          {/* City with Smart Autocomplete */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-medium text-muted-foreground">
                City
              </label>
              <span title="Smart Location Auto-Complete">
                <Sparkles className="w-2.5 h-2.5 text-sky-500" />
              </span>
            </div>
            <input
              type="text"
              value={clientCustomerRecord.city || ""}
              onChange={(changeEvent) =>
                handleQueryLocations("city", changeEvent.target.value)
              }
              onFocus={() => {
                if ((clientCustomerRecord.city || "").length >= 2) {
                  handleQueryLocations("city", clientCustomerRecord.city || "");
                }
              }}
              placeholder="Austin"
              className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
            />
          </div>

          {/* State / Region */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              State / Region
            </label>
            <input
              type="text"
              value={clientCustomerRecord.region || ""}
              onChange={(changeEvent) =>
                handleClientFieldChange("region", changeEvent.target.value.toUpperCase())
              }
              autoCapitalize="characters"
              placeholder="TX"
              maxLength={4}
              className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-mono"
            />
          </div>

          {/* Postal Code with Smart Autocomplete */}
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Postal Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={clientCustomerRecord.postalCode || ""}
              onChange={(changeEvent) =>
                handleQueryLocations("postalCode", changeEvent.target.value)
              }
              onFocus={() => {
                if ((clientCustomerRecord.postalCode || "").length >= 2) {
                  handleQueryLocations("postalCode", clientCustomerRecord.postalCode || "");
                }
              }}
              placeholder="78759"
              className="w-full text-xs px-2.5 py-1.5 bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-mono"
            />
          </div>
        </div>

        {/* Floating Location Autocomplete Suggestions */}
        {locationSuggestions.length > 0 && activeSearchField && (
          <div className="absolute z-30 left-0 right-0 mt-2 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl overflow-hidden divide-y divide-border">
            <div className="px-3 py-1.5 bg-muted/80 text-[10px] font-semibold text-muted-foreground flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-sky-500" />
                <span>Suggested Construction Locations &amp; Facilities (1-Click Fill)</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">
                {locationSuggestions.length} found
              </span>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {locationSuggestions.map((suggestion) => (
                <div
                  key={`${suggestion.namedLocationTitle}-${suggestion.city}-${suggestion.postalCode}`}
                  onClick={() => handleApplyLocationPreset(suggestion)}
                  className="px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                      <span className="font-bold text-foreground truncate">
                        {suggestion.namedLocationTitle}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 pl-5">
                      {suggestion.streetAddressLine ? `${suggestion.streetAddressLine}, ` : ""}
                      {suggestion.city}, {suggestion.region} {suggestion.postalCode}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                    {suggestion.primaryZoneName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
