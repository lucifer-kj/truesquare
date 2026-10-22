import type { BuildingTradeCategory } from "../domain/types";

export type JobPreset = {
  id: string;
  name: string;
  description: string;
  categories: BuildingTradeCategory[];
  searchKeywords: string[];
};

export const JOB_PRESETS: JobPreset[] = [
  {
    id: "drywall",
    name: "Drywall & Interior Walls",
    description: "Drywall sheets, joint compound, tape, corner beads, and fasteners",
    categories: ["drywall", "fasteners"],
    searchKeywords: ["drywall", "sheet", "compound", "tape", "mud"],
  },
  {
    id: "framing",
    name: "Framing & Rough Carpentry",
    description: "Structural lumber, studs, plywood/OSB sheathing, and framing fasteners",
    categories: ["lumber", "fasteners"],
    searchKeywords: ["stud", "lumber", "plywood", "sheathing", "framing"],
  },
  {
    id: "concrete",
    name: "Foundation & Concrete Works",
    description: "Cement, ready-mix concrete, rebar, forms, and waterproofing",
    categories: ["concrete", "masonry"],
    searchKeywords: ["concrete", "cement", "rebar", "slab", "foundation"],
  },
  {
    id: "roofing",
    name: "Roofing & Weatherproofing",
    description: "Shingles, underlayment, flashing, vents, and gutters",
    categories: ["roofing", "fasteners"],
    searchKeywords: ["roof", "shingle", "flashing", "underlayment", "gutter"],
  },
  {
    id: "insulation",
    name: "Thermal Insulation & Energy",
    description: "Fiberglass batts, mineral wool, foam boards, and vapor barriers",
    categories: ["insulation"],
    searchKeywords: ["insulation", "batt", "fiberglass", "foam"],
  },
  {
    id: "masonry",
    name: "Masonry & Stone",
    description: "Concrete masonry units (CMU), bricks, mortar, and ties",
    categories: ["masonry", "concrete"],
    searchKeywords: ["masonry", "brick", "block", "mortar", "stone"],
  },
  {
    id: "general",
    name: "General Construction Supplies",
    description: "Comprehensive mix across structural and finishing materials",
    categories: ["concrete", "lumber", "drywall", "roofing", "insulation", "masonry", "other"],
    searchKeywords: ["drywall", "lumber", "concrete", "paint", "insulation"],
  },
];
