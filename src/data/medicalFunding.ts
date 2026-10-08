/**
 * Hospitals and medical facilities funded by the Samiti (Our Projects -> Medical Facilities). The live list is managed in the
 * admin panel (Medical Funding, table medical_fundings); the entries below are shown only until that table can be read.
 * `amount` is in rupees; 0 = no amount published for that entry.
 * The three facilities are DEMO entries (made-up amounts) to show how the list looks: replace them with the real ones in the admin panel.
 */
export type FundingKind = "hospital" | "facility";
export interface MedicalFunding { id: string; kind: FundingKind; name: string; location: string; purpose: string; amount: number; period: string }

export const defaultMedicalFundings: MedicalFunding[] = [
  { id: "d1", kind: "hospital", name: "Municipal General Hospital", location: "Mumbai, Maharashtra", period: "", amount: 0,
    purpose: "Patient welfare and healthcare assistance, recognised by the hospital with a Certificate of Excellence." },
  { id: "d2", kind: "hospital", name: "Dr. R. N. Cooper General Hospital", location: "Mumbai, Maharashtra", period: "", amount: 0,
    purpose: "Support and contribution towards patient care facilities, acknowledged by the hospital in an appreciation letter." },
  { id: "d3", kind: "facility", name: "Mobility Aids & Rehabilitation Equipment", location: "Sagar District, M.P.", period: "2024-25", amount: 320000,
    purpose: "Wheelchairs, walkers and rehabilitation aids given to patients and persons with disabilities." },
  { id: "d4", kind: "facility", name: "Village Health Check-up Camp Unit", location: "Sagar District, M.P.", period: "2024-25", amount: 250000,
    purpose: "Doctors, medicines and basic tests for free health check-up camps in remote villages." },
  { id: "d5", kind: "facility", name: "Sanitary Pad Vending Machines in Schools", location: "Sagar District, M.P.", period: "2023-24", amount: 180000,
    purpose: "Vending machines installed in government schools so that girls have sanitary pads at hand." }
];
