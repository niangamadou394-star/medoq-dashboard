export interface Medication {
  id: string;
  name: string;
  dci: string; // Dénomination Commune Internationale
  category: string;
  description?: string;
  imageUrl?: string;
  manufacturer?: string;
  requiresPrescription: boolean;
  dosageForm: string;
  strength?: string;
  isActive: boolean;
  createdAt: string;
}

export interface MedicationSearchResult {
  id: string;
  name: string;
  dci: string;
  category: string;
  dosageForm: string;
  requiresPrescription: boolean;
  imageUrl?: string;
}

export interface MedicationCategory {
  id: string;
  name: string;
  icon?: string;
  count: number;
}
