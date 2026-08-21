import { Fragment, useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlignCenter, AlignLeft, AlignRight, Bold, CheckCircle, ChevronDown, Code, Download, Eye, FileText, FolderOpen, Image, Italic, Link2, List, ListOrdered, Minus, Paperclip, Plus, Printer, Quote, Redo2, RemoveFormatting, Search, Share2, Strikethrough, Subscript, Superscript, Table2, Trash2, Underline, Undo2, XCircle } from 'lucide-react';
import { WizardSidebar } from './QuotesPoliciesLandingShell';
import {
  FilterPopup, FunnelIcon, evalOp,
  type AppliedFilters, type ColFilter, type SortState,
} from './GridHelpers';
import { authApi } from '../../api/auth';
import type { UserSelectDto } from '../../types/User';
import { quotesPoliciesApi } from '../../api/quotesPolicies';
import { distributionApi } from '../../api/distribution';
import api from '../../api/client';

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ State tax matrix (Source: State tax matrix_v2.xlsx) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
const STATE_TAX: Record<string, { sl: number; stamp: number; fire: number; flatStamp?: true }> = {
  'Alabama':{ sl:0.06, stamp:0, fire:0 },
  'Alaska':{ sl:0.027, stamp:0.01, fire:0 },
  'Arizona':{ sl:0.03, stamp:0.002, fire:0 },
  'Arkansas':{ sl:0.04, stamp:0, fire:0 },
  'California':{ sl:0.03, stamp:0.0018, fire:0 },
  'Colorado':{ sl:0.03, stamp:0, fire:0 },
  'Connecticut':{ sl:0.04, stamp:0, fire:0 },
  'Delaware':{ sl:0.03, stamp:0, fire:0 },
  'District of Columbia':{ sl:0.02, stamp:0, fire:0 },
  'Florida':{ sl:0.0494, stamp:0.0006, fire:0 },
  'Georgia':{ sl:0.04, stamp:0, fire:0 },
  'Hawaii':{ sl:0.0468, stamp:0, fire:0 },
  'Idaho':{ sl:0.015, stamp:0.005, fire:0 },
  'Illinois':{ sl:0.035, stamp:0.0004, fire:0.01 },
  'Indiana':{ sl:0.025, stamp:0, fire:0 },
  'Iowa':{ sl:0.00925, stamp:0, fire:0 },
  'Kansas':{ sl:0.03, stamp:0, fire:0 },
  'Kentucky':{ sl:0.03, stamp:0.018, fire:0 },
  'Louisiana':{ sl:0.0485, stamp:0, fire:0 },
  'Maine':{ sl:0.03, stamp:0, fire:0 },
  'Maryland':{ sl:0.03, stamp:0, fire:0 },
  'Massachusetts':{ sl:0.04, stamp:0, fire:0 },
  'Michigan':{ sl:0.02, stamp:0.005, fire:0 },
  'Minnesota':{ sl:0.03, stamp:0.0004, fire:0 },
  'Mississippi':{ sl:0.04, stamp:0.0025, fire:0 },
  'Missouri':{ sl:0.05, stamp:0, fire:0 },
  'Montana':{ sl:0.0275, stamp:0.0025, fire:0.025 },
  'Nebraska':{ sl:0.03, stamp:0, fire:0 },
  'Nevada':{ sl:0.035, stamp:0.004, fire:0 },
  'New Hampshire':{ sl:0.03, stamp:0, fire:0 },
  'New Jersey':{ sl:0.05, stamp:0, fire:0 },
  'New Mexico':{ sl:0.03003, stamp:0, fire:0 },
  'New York':{ sl:0.036, stamp:0.0015, fire:0 },
  'North Carolina':{ sl:0.05, stamp:0.003, fire:0 },
  'North Dakota':{ sl:0.0175, stamp:0, fire:0 },
  'Ohio':{ sl:0.05, stamp:0, fire:0 },
  'Oklahoma':{ sl:0.06, stamp:0.00175, fire:0 },
  'Oregon':{ sl:0.02, stamp:10, fire:0.003, flatStamp:true },
  'Pennsylvania':{ sl:0.03, stamp:20, fire:0, flatStamp:true },
  'Rhode Island':{ sl:0.04, stamp:0, fire:0 },
  'South Carolina':{ sl:0.06, stamp:0, fire:0 },
  'South Dakota':{ sl:0.025, stamp:0, fire:0.03 },
  'Tennessee':{ sl:0.05, stamp:0.00175, fire:0 },
  'Texas':{ sl:0.0485, stamp:0.0004, fire:0 },
  'Utah':{ sl:0.0425, stamp:0.0018, fire:0 },
  'Vermont':{ sl:0.03, stamp:0, fire:0 },
  'Virginia':{ sl:0.0225, stamp:0, fire:0 },
  'Washington':{ sl:0.02, stamp:0.003, fire:0 },
  'West Virginia':{ sl:0.0455, stamp:0, fire:0 },
  'Wisconsin':{ sl:0.03, stamp:0, fire:0 },
  'Wyoming':{ sl:0.03, stamp:0.00175, fire:0 },
};
const US_STATES = Object.keys(STATE_TAX).sort();
const CANADA_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
  'Quebec', 'Saskatchewan', 'Yukon'
];
const STATE_OPTIONS_BY_COUNTRY: Record<string, string[]> = {
  'United States': US_STATES,
  Canada: CANADA_PROVINCES,
};
const ALL_STATES = US_STATES;

const PRIMARY_INSURED_TYPES = [
  'Association', 'Corporation', 'Individual', 'Joint Venture', 'Legal Trust Organization',
  'Limited Liability Company', 'Partnership', 'Sole Proprietorship', 'Tenancy in Common'
];
const PERSON_INSURED_TYPES = new Set(['Individual', 'Sole Proprietorship']);
const HB_BUILDING_FLOOD_ELEVATION_OPTIONS = [
  'N/A', '4', '3', '2', '1', '0', '-1', '-2', '-3', '-4', '-5', '-6', '-7', '-8',
  '-9', '-10', '-11', '-12', '-13', '-14', '-15', '-16'
];
const HB_BUILDING_TYPE_OPTIONS = [
  'No basement/enclosure',
  'With basement',
  'With enclosure',
  'Elevated on crawlspace',
  'non-elevated with subgrade crawlspace',
  'manufactured'
];
const HB_BUILDING_DESCRIPTION_OPTIONS = [
  '1 floor',
  'More than 1 floor no basement',
  'More than 1 floor with basement',
  'Manufactured'
];
const HB_ROOF_CONSTRUCTION_TYPE_OPTIONS = [
  'Gable',
  'Hip',
  'Flat / Low-Slope',
  'Shed (Mono-pitch)',
  'Mansard',
  'Gambrel',
  'Complex / Combination',
  'Other / Unknown'
];
const FLOOD_ZONE_OPTIONS = ['A,AO,AH,D3', 'V,VE,V1-V30', 'A99,B,C,X', 'D', 'AE, A1-A30', 'None'];
const LENDER_TYPE_OPTIONS = ['Scheduled Lender Organization', 'Scheduled Lender Person'];
const LOAN_TYPE_OPTIONS = ['Primary Lender', 'Secondary Lender', 'Loss Payee'];
const COVERED_ASSET_OPTIONS = ['Dwelling', 'Other'];

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Interfaces ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
interface LocationItem {
  id: number;
  addressLine1: string; addressLine2: string;
  country: string; state: string; city: string;
  county: string; zip: string; latitude: string; longitude: string;
}

interface AdditionalInsuredItem {
  id: number;
  firstName: string; middleName: string; lastName: string;
  relationship: string; telephone: string; altTelephone: string;
  email: string; insuredType: string; dbaName: string;
  isManual?: boolean;
}

interface AdditionalOrgItem {
  id: number;
  orgName: string; orgType: string;
  telephone: string; extension: string; altTelephone: string;
  email: string;
  contactFirstName: string; contactMiddleName: string; contactLastName: string;
  isManual?: boolean;
}

interface MortgageItem {
  id: number;
  name: string; loanNumber: string; mortgageServiceCompany: string;
  telephone: string; extension: string; altTelephone: string;
  phoneCountry: string; altPhoneCountry: string; googleAddress: string; manualAddress: boolean;
  clientId: string; lenderType: string; loanType: string; coveredAsset: string;
  email: string;
  addressLine1: string; addressLine2: string;
  country: string; state: string; city: string; county: string; zip: string;
  latitude: string; longitude: string;
}

interface FormState {
  effectiveDate: string; expirationDate: string; policyTerm: string;
  writingCompany: string; insuredType: string;
  brokerageFirm: string; brokerageFirmId?: number | null; producerName: string; producerId?: number | null;
  firstName: string; middleName: string; lastName: string; age65OrOlder: string;
  organizationName: string; doingBusinessAs: string;
  googleAddress: string; addressLine1: string; addressLine2: string;
  country: string; state: string; city: string; county: string; zip: string;
  latitude: string; longitude: string;
  phone: string; altPhone: string; email: string;
  phoneCountry: string; altPhoneCountry: string; extension: string;
  locationSameAsMailing: boolean;
  buildingFloodElevation: string; buildingType: string; buildingDescription: string;
  hexZoneLR: string; hexZoneHR: string; floodZone: string;
  roofYear: string; roofConstructionType: string;
  hexCatStatus: string; hexCatTimestamp: string; nonApprovalCounter: number;
  dwellingLimit: string; appurtenantLimit: string; personalAssetsLimit: string;
  occupancyDisruptionLimit: string;
  deductible: string; coverageLevel: string; liabilityAmount: string;
  excessBlanketLiabilities: string; sinkhole: string; earthquake: string;
  flood: string; windHail: string; wildfire: string;
  resWorkerMedical: string; farmingEndorsement: string;
  landlordEndorsement: string; homeOfficeEndorsement: string;
  priorPolicyPremium: string; basePremium: string; rateModification: string;
  selectedPlan: string; policyFee: string; totalInsuredValues: string;
  paymentFrequency: string; responsibleParty: string;
  lockSubmission: boolean;
  policyInsuranceType: string; policyType: string;
  policyNumber: string; quoteNumber: string; recordStatus: string;
  lob: string; subProduct: string; endorsementEffectiveDate: string; renewalOfferDate: string; priorPolicyNumber: string;
  screenCode: string;
  isHBProducer: boolean;
  isQuickQuote: boolean;
  isBulkUploaded: boolean;
  isDataLocationDisabled: boolean;
  isAddressDataFetched: boolean;
  isPolicyPaid: boolean;
  isPBEDone: boolean;
  feesFullyPaidFirstInstallment: boolean | null; // null = not yet answered (PRD initial state)
  paymentRequiredToBind: boolean;
  modeOfPayment: string;
}

const defaultForm: FormState = {
  // Only genuine blank-state / single-option defaults live here — never a specific
  // person's name, address, phone, email, dollar amount, or lookup result. Those used
  // to be seeded with fictional data (a fake "Gabriel Hughes" at a fake Texas address
  // with a fake premium) that appeared pre-filled on every brand-new manual submission.
  effectiveDate: '', expirationDate: '', policyTerm: 'Annual',
  writingCompany: 'Sierra Specialty Insurance Company', insuredType: 'Individual',
  brokerageFirm: '', brokerageFirmId: null, producerName: '', producerId: null,
  firstName: '', middleName: '', lastName: '', age65OrOlder: 'No',
  organizationName: '', doingBusinessAs: '',
  googleAddress: '', addressLine1: '', addressLine2: '',
  country: 'United States', state: '', city: '',
  county: '', zip: '',
  latitude: '', longitude: '',
  phone: '', altPhone: '', email: '',
  phoneCountry: 'United States +1', altPhoneCountry: 'United States +1', extension: '',
  locationSameAsMailing: true,
  buildingFloodElevation: '', buildingType: '', buildingDescription: '',
  hexZoneLR: '', hexZoneHR: '', floodZone: 'None',
  roofYear: '', roofConstructionType: '',
  hexCatStatus: '', hexCatTimestamp: '', nonApprovalCounter: 0,
  dwellingLimit: '', appurtenantLimit: '', personalAssetsLimit: '',
  occupancyDisruptionLimit: '',
  deductible: '5,000', coverageLevel: 'Basic', liabilityAmount: '300,000',
  excessBlanketLiabilities: 'No Coverage', sinkhole: 'Non-Transferred', earthquake: 'None',
  flood: 'None', windHail: 'Non-Transferred', wildfire: 'Non-Transferred',
  resWorkerMedical: 'No', farmingEndorsement: 'No', landlordEndorsement: 'No', homeOfficeEndorsement: 'No',
  priorPolicyPremium: '0', basePremium: '0', rateModification: '0',
  selectedPlan: 'Basic', policyFee: '195', totalInsuredValues: '0',
  // PRD §2: both dropdowns start blank ("Select...") and are required before Save & Next.
  paymentFrequency: '', responsibleParty: '',
  lockSubmission: false,
  policyInsuranceType: '2', policyType: 'NEWBUSINESS',
  policyNumber: '', quoteNumber: '', recordStatus: 'Draft',
  lob: 'E&S Homeowners', subProduct: 'SuperPerils', endorsementEffectiveDate: '', renewalOfferDate: '', priorPolicyNumber: '',
  screenCode: 'NEWBUSINESSINDIVIDUAL',
  isHBProducer: false,
  isQuickQuote: false,
  isBulkUploaded: false,
  isDataLocationDisabled: true,
  isAddressDataFetched: false,
  isPolicyPaid: false,
  isPBEDone: false,
  feesFullyPaidFirstInstallment: null,
  paymentRequiredToBind: false,
  modeOfPayment: 'CreditCard',
};

// Older drafts serialized boolean fields as 'true'/'false' strings, which breaks
// radio bindings (=== true) and server-side bool? model binding. Coerce every field
// whose default is a boolean back to a real boolean on hydrate.
function coerceFormBooleans(f: FormState): FormState {
  const out: any = { ...f };
  const toBool = (v: any, fallback: boolean | null) =>
    v === true || v === 'true' || v === 'Yes' ? true
      : v === false || v === 'false' || v === 'No' ? false
        : fallback;
  for (const k of Object.keys(defaultForm) as (keyof FormState)[]) {
    if (typeof defaultForm[k] === 'boolean' && typeof out[k] !== 'boolean') {
      out[k] = toBool(out[k], defaultForm[k] as boolean);
    }
  }
  // Tri-state: null means "not answered yet", so it can't ride the boolean-default loop.
  out.feesFullyPaidFirstInstallment = toBool(out.feesFullyPaidFirstInstallment, null);
  return out as FormState;
}

const EMPTY_MORTGAGE: Omit<MortgageItem, 'id'> = {
  name: '', loanNumber: '', mortgageServiceCompany: '',
  telephone: '', extension: '', altTelephone: '',
  phoneCountry: 'United States +1', altPhoneCountry: 'United States +1', googleAddress: '', manualAddress: false,
  clientId: '', lenderType: '', loanType: '',
  coveredAsset: '', email: '',
  addressLine1: '', addressLine2: '', country: 'United States',
  state: '', city: '', county: '', zip: '', latitude: '', longitude: '',
};

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ UI helpers ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
function Field({ label, required, children }: { label: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="form-group">
      <label>{required && <span className="required">* </span>}{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, disabled, placeholder, type = 'text', hasError }: {
  value: string; onChange?: (v: string) => void; disabled?: boolean; placeholder?: string; type?: string; hasError?: boolean;
}) {
  return <input type={type} value={value} onChange={e => onChange?.(e.target.value)} disabled={disabled} placeholder={placeholder}
    style={hasError ? { borderColor: '#dc2626' } : undefined} />;
}

function FSelect({ value, onChange, options, disabled, placeholder = 'Select...' }: { value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean; placeholder?: string }) {
  const valueExistsInOptions = options.some(o => o.toLowerCase() === value.toLowerCase());
  return (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} aria-label={typeof placeholder === 'string' ? placeholder : undefined}>
      {value === '' && <option value="">{placeholder}</option>}
      {value !== '' && !valueExistsInOptions && <option value={value}>{value}</option>}
      {options.map((o, i) => <option key={`${o}-${i}`} value={o}>{o}</option>)}
    </select>
  );
}

type DropdownOption = { id: number; name: string };

function firstText(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return '';
}

function toIntermediaryOption(row: Record<string, unknown>): DropdownOption | null {
  const id = Number(row.id ?? row.Id);
  const name = firstText(row, ['intermediary_name', 'intermediaryName', 'IntermediaryName', 'name']);
  return Number.isFinite(id) && name ? { id, name } : null;
}

function toProducerOption(row: Record<string, unknown>): DropdownOption | null {
  const id = Number(row.id ?? row.Id);
  const firstName = firstText(row, ['first_name', 'firstName', 'FirstName']);
  const middleName = firstText(row, ['middle_name', 'middleName', 'MiddleName']);
  const lastName = firstText(row, ['last_name', 'lastName', 'LastName']);
  const fallback = firstText(row, ['producer_name', 'producerName', 'ProducerName', 'email', 'Email']);
  const name = [firstName, middleName, lastName].filter(Boolean).join(' ').trim() || fallback;
  return Number.isFinite(id) && name ? { id, name } : null;
}

type NewSubmissionLandingForm = {
  intermediaryType: 'Brokerage';
  brokerageFirm: string;
  brokerageFirmId: number | null;
  producerName: string;
  producerId: number | null;
  typeOfPolicy: 'Single' | 'Package';
  typeOfQuote: 'Quick' | 'Full';
  insuranceType: string;
  country: string;
  effectiveDate: string;
  lob: string;
  subProduct: string;
  primaryState: string;
};


function todayFormatted(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`;
}

function addOneYear(dateStr: string): string {
  if (!dateStr) return '';
  const [day, month, year] = dateStr.split('-');
  if (!day || !month || !year) return '';
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  d.setFullYear(d.getFullYear() + 1);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

const DEFAULT_LANDING_FORM: NewSubmissionLandingForm = {
  intermediaryType: 'Brokerage',
  brokerageFirm: '',
  brokerageFirmId: null,
  producerName: '',
  producerId: null,
  typeOfPolicy: 'Single',
  typeOfQuote: 'Quick',
  insuranceType: 'Specialty Lines',
  country: 'United States',
  effectiveDate: todayFormatted(),
  lob: 'E&S Homeowners',
  subProduct: 'SuperPerils',
  primaryState: '',
};

const NEW_SUBMISSION_INSURANCE_TYPES = ['Specialty Lines', 'Admitted Lines', 'Non-Admitted Lines'];
const NEW_SUBMISSION_POLICY_TYPES = ['Single', 'Package'] as const;
const NEW_SUBMISSION_QUOTE_TYPES = ['Quick', 'Full'] as const;

function NewSubmissionLanding({
  form,
  setForm,
  onCreate,
  onCancel,
  isCreating,
  error,
  intermediaryOptions,
  producerOptions,
  isProducer,
}: {
  form: NewSubmissionLandingForm;
  setForm: React.Dispatch<React.SetStateAction<NewSubmissionLandingForm>>;
  onCreate: () => void;
  onCancel: () => void;
  isCreating?: boolean;
  error?: string | null;
  intermediaryOptions: DropdownOption[];
  producerOptions: DropdownOption[];
  isProducer?: boolean;
}) {
  const intermediaryNames = intermediaryOptions.map(option => option.name);
  const producerNames = producerOptions.map(option => option.name);

  function handleIntermediaryChange(value: string) {
    const selected = intermediaryOptions.find(option => option.name === value);
    setForm(prev => ({
      ...prev,
      brokerageFirm: value,
      brokerageFirmId: selected?.id ?? null,
      producerName: '',
      producerId: null,
    }));
  }

  function handleProducerChange(value: string) {
    const selected = producerOptions.find(option => option.name === value);
    setForm(prev => ({ ...prev, producerName: value, producerId: selected?.id ?? null }));
  }

  return (
    <div className="wizard-page" style={{ flex: 1 }}>
      <div className="wizard-breadcrumb">
        <strong>New Submission</strong>
        <span>Specialty - New Business Quote / New Submission</span>
      </div>
      <div className="wizard-content" style={{ padding: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
          <div className="wizard-section" style={{ padding: 0 }}>
            <div className="wizard-section-subtitle">Producer Details</div>
            <div className="form-grid-3">
              <Field label="Intermediary Type">
                <FSelect value={form.intermediaryType} onChange={v => setForm(prev => ({ ...prev, intermediaryType: v as 'Brokerage' }))} options={['Brokerage']} disabled />
              </Field>
              <Field label="Intermediary" required>
                <FSelect value={form.brokerageFirm} onChange={handleIntermediaryChange} options={intermediaryNames} disabled={isProducer} />
              </Field>
              <Field label="Producer Name" required>
                <FSelect value={form.producerName} onChange={handleProducerChange} options={producerNames} disabled={!form.brokerageFirm || producerNames.length === 0} />
              </Field>
            </div>
          </div>

          <div className="wizard-section" style={{ padding: 0, marginTop: 28 }}>
            <div className="wizard-section-subtitle">Product Details</div>
            <div className="form-grid-3">
              <Field label="Type of Policy" required>
                <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
                  {NEW_SUBMISSION_POLICY_TYPES.map(option => (
                    <label key={option} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <input type="radio" name="typeOfPolicy" checked={form.typeOfPolicy === option} onChange={() => setForm(prev => ({ ...prev, typeOfPolicy: option }))} />
                      {option}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Type of Quote" required>
                <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
                  {NEW_SUBMISSION_QUOTE_TYPES.map(option => (
                    <label key={option} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <input type="radio" name="typeOfQuote" checked={form.typeOfQuote === option} onChange={() => setForm(prev => ({ ...prev, typeOfQuote: option }))} />
                      {option}
                    </label>
                  ))}
                </div>
              </Field>
              <div />
            </div>

            <div className="form-grid-3" style={{ marginTop: 16 }}>
              <Field label="Insurance Type" required>
                <FSelect value={form.insuranceType} onChange={v => setForm(prev => ({ ...prev, insuranceType: v }))} options={NEW_SUBMISSION_INSURANCE_TYPES} />
              </Field>
              <Field label="Country" required>
                <FSelect value={form.country} onChange={v => setForm(prev => ({ ...prev, country: v }))} options={['United States']} />
              </Field>
              <Field label="Effective Date" required>
                <Input value={form.effectiveDate} onChange={v => setForm(prev => ({ ...prev, effectiveDate: v }))} />
              </Field>
            </div>
            <div className="form-grid-3" style={{ marginTop: 16 }}>
              <Field label="Line of Business" required>
                <FSelect value={form.lob} onChange={v => setForm(prev => ({ ...prev, lob: v }))} options={['E&S Homeowners', 'E&S Commercial']} />
              </Field>
              <Field label="Sub-Product" required>
                <FSelect value={form.subProduct} onChange={v => setForm(prev => ({ ...prev, subProduct: v }))} options={['SuperPerils']} />
              </Field>
              <Field label="Primary State" required>
                <FSelect value={form.primaryState} onChange={v => setForm(prev => ({ ...prev, primaryState: v }))} options={ALL_STATES} placeholder="Select" />
              </Field>
            </div>
          </div>
        </div>
      </div>
      <div className="wizard-footer" style={{ padding: '16px 24px' }}>
        <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={onCreate} disabled={isCreating}>
          {isCreating ? 'Creating…' : 'Create'}
        </button>
      </div>
      {error && <div className="wizard-error" style={{ padding: '0 24px 16px', color: '#b91c1c' }}>{error}</div>}
    </div>
  );
}

type FlowKind = 'policy' | 'newBusiness' | 'endorsement' | 'renewal';
type PlanId = 'Basic' | 'Standard' | 'Preferred';

type PlanAmounts = {
  id: PlanId;
  name: string;
  basePremium: number;
  wildfire: number;
  windHail: number;
  sinkhole: number;
  excessLiability: number;
  earthquake: number;
  flood: number;
  resWorker: number;
  farming: number;
  landlord: number;
  homeOffice: number;
  policyFee: number;
  total: number;
};

const PLAN_TIERS: Array<{ id: PlanId; name: string }> = [
  { id: 'Basic', name: 'Basic Plan' },
  { id: 'Standard', name: 'Standard Plan' },
  { id: 'Preferred', name: 'Preferred Plan' },
];

const POLICY_PLAN_BASE: Record<PlanId, number> = { Basic: 307.70, Standard: 515.70, Preferred: 746.70 };
const NEW_BUSINESS_PLAN_BASE: Record<PlanId, number> = { Basic: 9625, Standard: 9751, Preferred: 9877 };
const DEDUCTIBLE_ADJUSTMENT: Record<string, number> = { '2,500': 384, '5,000': 0, '10,000': -768, '25,000': -1536 };
const PLAN_TIER_COVERAGE_RATES: Record<'resWorker' | 'farming' | 'landlord' | 'homeOffice', Record<PlanId, number>> = {
  resWorker: { Basic: 50, Standard: 100, Preferred: 250 },
  farming: { Basic: 40, Standard: 120, Preferred: 200 },
  landlord: { Basic: 50, Standard: 150, Preferred: 250 },
  homeOffice: { Basic: 20, Standard: 60, Preferred: 100 },
};

const POLICY_SCENARIO_DEFAULTS: Partial<FormState> = {
  dwellingLimit: '5577', appurtenantLimit: '557', personalAssetsLimit: '3625', occupancyDisruptionLimit: '1394', totalInsuredValues: '11153',
  deductible: '5,000', liabilityAmount: '300,000', excessBlanketLiabilities: '500,000', sinkhole: 'Yes', earthquake: '50,000', flood: '10,000',
  windHail: 'Non-Transferred', wildfire: 'Non-Transferred', resWorkerMedical: 'Yes', farmingEndorsement: 'Yes', landlordEndorsement: 'Yes', homeOfficeEndorsement: 'No',
  selectedPlan: 'Basic', policyFee: '195', basePremium: '307.70', policyType: 'POLICY', screenCode: 'POLICYINDIVIDUAL',
};

function valueOrFallback(value: unknown, fallback: string) {
  const text = value == null ? '' : String(value);
  return text.trim() === '' ? fallback : text;
}

function booleanValue(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const text = String(value ?? '').trim().toLowerCase();
  if (['true', '1', 'yes'].includes(text)) return true;
  if (['false', '0', 'no', ''].includes(text)) return false;
  return Boolean(value);
}

function numberValue(value: unknown) {
  const n = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function totalInsuredValue(form: FormState) {
  return numberValue(form.dwellingLimit) + numberValue(form.appurtenantLimit) + numberValue(form.personalAssetsLimit) + numberValue(form.occupancyDisruptionLimit);
}

function formatNumberValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatMoney(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatWholeMoney(value: number) {
  return Math.round(value).toLocaleString('en-US');
}

function displayValue(value: unknown, fallback = '-') {
  const text = value == null ? '' : String(value).trim();
  return text === '' ? fallback : text;
}

function getFlowKind(form: FormState): FlowKind {
  // Check isRenewal flag first (set from backend for renewal quotes)
  if ((form as any).isRenewal === true || (form as any).isRenewal === 'true') return 'renewal';

  const code = String(form.screenCode || form.policyType || '').toUpperCase();
  if (code.startsWith('POLICY')) return 'policy';
  if (code.startsWith('ENDORSEMENT')) return 'endorsement';
  if (code.startsWith('RENEWAL')) return 'renewal';
  return 'newBusiness';
}

function selectedPlanId(value: string): PlanId {
  const normalized = String(value || '').toUpperCase();
  if (normalized.includes('PREFERRED')) return 'Preferred';
  if (normalized.includes('STANDARD')) return 'Standard';
  return 'Basic';
}

function normalizedOption(value: string, fallback: string) {
  const text = String(value || '').trim();
  if (!text) return fallback;
  if (['Excluded', 'No Transfer', 'Not Transferred'].includes(text)) return 'Non-Transferred';
  return text;
}

function applyPlanScenarioDefaults(form: FormState): FormState {
  const explicitPlanSource = valueOrFallback(form.coverageLevel, valueOrFallback(form.selectedPlan, ''));
  const flow = getFlowKind(form);
  const defaults = flow === 'newBusiness' ? defaultForm : POLICY_SCENARIO_DEFAULTS;
  const merged = { ...form };
  (Object.keys(defaults) as Array<keyof FormState>).forEach(key => {
    if (key === 'quoteNumber' || key === 'policyNumber') return;
    merged[key] = valueOrFallback(merged[key], String(defaults[key] ?? '')) as never;
  });
  merged.lockSubmission = booleanValue(merged.lockSubmission);
  merged.isHBProducer = booleanValue(merged.isHBProducer);
  merged.isQuickQuote = booleanValue(merged.isQuickQuote);
  merged.isBulkUploaded = booleanValue(merged.isBulkUploaded);
  merged.isDataLocationDisabled = booleanValue(merged.isDataLocationDisabled);
  merged.isAddressDataFetched = booleanValue(merged.isAddressDataFetched);
  merged.isPolicyPaid = booleanValue(merged.isPolicyPaid);
  merged.isPBEDone = booleanValue(merged.isPBEDone);
  if (flow === 'endorsement') {
    merged.policyType = valueOrFallback(merged.policyType, 'ENDORSEMENT');
    merged.screenCode = valueOrFallback(merged.screenCode, `ENDORSEMENT${String(merged.insuredType || 'Individual').toUpperCase()}`);
  }
  if (flow === 'renewal') {
    merged.policyType = valueOrFallback(merged.policyType, 'RENEWAL');
    merged.screenCode = valueOrFallback(merged.screenCode, `RENEWAL${String(merged.insuredType || 'Individual').toUpperCase()}`);
  }
  const planSelection = selectedPlanId(valueOrFallback(explicitPlanSource, merged.selectedPlan));
  merged.selectedPlan = planSelection;
  merged.coverageLevel = planSelection;
  merged.windHail = normalizedOption(merged.windHail, flow === 'newBusiness' ? 'Non-Transferred' : 'Non-Transferred');
  merged.wildfire = normalizedOption(merged.wildfire, flow === 'newBusiness' ? 'Included' : 'Non-Transferred');
  merged.sinkhole = normalizedOption(merged.sinkhole, flow === 'newBusiness' ? 'Non-Transferred' : 'Yes');
  merged.totalInsuredValues = valueOrFallback(merged.totalInsuredValues, formatNumberValue(totalInsuredValue(merged)));
  return merged;
}

function getCoveragePremiums(form: FormState) {
  return {
    wildfire: normalizedOption(form.wildfire, 'Non-Transferred') === 'Included' ? 893.70 : 0,
    windHail: normalizedOption(form.windHail, 'Non-Transferred') === 'Included' ? 125 : 0,
    sinkhole: normalizedOption(form.sinkhole, 'Non-Transferred') === 'Yes' ? 0 : 0,
    excessLiability: normalizedOption(form.excessBlanketLiabilities, 'Not Applicable') === '500,000' ? 100 : 0,
    earthquake: ({ '25,000': 40.65, '50,000': 81.30, '100,000': 162.60 } as Record<string, number>)[normalizedOption(form.earthquake, 'Non-Transferred')] ?? 0,
    flood: ({ '10,000': 10, '25,000': 25, '50,000': 50 } as Record<string, number>)[normalizedOption(form.flood, 'Non-Transferred')] ?? 0,
  };
}

function calculatePlanAmounts(form: FormState): PlanAmounts[] {
  const flow = getFlowKind(form);
  const baseSource = flow === 'newBusiness' ? NEW_BUSINESS_PLAN_BASE : POLICY_PLAN_BASE;
  const deductibleAdjustment = flow === 'newBusiness' ? (DEDUCTIBLE_ADJUSTMENT[normalizedOption(form.deductible, '5,000')] ?? 0) : 0;
  const coverage = getCoveragePremiums(form);
  const policyFee = numberValue(valueOrFallback(form.policyFee, '195'));

  return PLAN_TIERS.map(plan => {
    const resWorker = normalizedOption(form.resWorkerMedical, 'No') === 'Yes' ? PLAN_TIER_COVERAGE_RATES.resWorker[plan.id] : 0;
    const farming = normalizedOption(form.farmingEndorsement, 'No') === 'Yes' ? PLAN_TIER_COVERAGE_RATES.farming[plan.id] : 0;
    const landlord = normalizedOption(form.landlordEndorsement, 'No') === 'Yes' ? PLAN_TIER_COVERAGE_RATES.landlord[plan.id] : 0;
    const homeOffice = normalizedOption(form.homeOfficeEndorsement, 'No') === 'Yes' ? PLAN_TIER_COVERAGE_RATES.homeOffice[plan.id] : 0;
    const basePremium = baseSource[plan.id] + deductibleAdjustment;
    const total = basePremium + coverage.wildfire + coverage.windHail + coverage.sinkhole + coverage.excessLiability + coverage.earthquake + coverage.flood + resWorker + farming + landlord + homeOffice + policyFee;
    return { id: plan.id, name: plan.name, basePremium, ...coverage, resWorker, farming, landlord, homeOffice, policyFee, total };
  });
}

function normalizeBackendPlanAmounts(value: unknown): PlanAmounts[] | null {
  if (!Array.isArray(value)) return null;
  const byId = new Map<PlanId, Record<string, unknown>>();

  value.forEach(item => {
    if (!item || typeof item !== 'object') return;
    const plan = item as Record<string, unknown>;
    const id = selectedPlanId(String(plan.id || plan.coverageLevel || plan.name || ''));
    byId.set(id, plan);
  });

  const normalized = PLAN_TIERS.map(tier => {
    const plan = byId.get(tier.id);
    if (!plan) return null;
    return {
      id: tier.id,
      name: String(plan.name || tier.name),
      basePremium: numberValue(plan.basePremium),
      wildfire: numberValue(plan.wildfire),
      windHail: numberValue(plan.windHail),
      sinkhole: numberValue(plan.sinkhole),
      excessLiability: numberValue(plan.excessLiability),
      earthquake: numberValue(plan.earthquake),
      flood: numberValue(plan.flood),
      resWorker: numberValue(plan.resWorker),
      farming: numberValue(plan.farming),
      landlord: numberValue(plan.landlord),
      homeOffice: numberValue(plan.homeOffice),
      policyFee: numberValue(plan.policyFee),
      total: numberValue(plan.total),
    };
  });

  if (normalized.some(plan => !plan)) return null;
  return normalized as PlanAmounts[];
}
function getFlowCopy(form: FormState) {
  const flow = getFlowKind(form);
  const lob = valueOrFallback(form.lob, 'E&S Homeowners');
  const subProduct = valueOrFallback(form.subProduct, 'SuperPerils');
  if (flow === 'policy') {
    return {
      title: `Policy Number ${valueOrFallback(form.policyNumber, form.quoteNumber || '-')}`,
      breadcrumb: `${lob} : ${subProduct}`,
      breadcrumbSubtext: 'Specialty - Policies / Summary',
      dateLabel: 'Effective Date',
      recordLabel: 'Policy ID',
    };
  }
  if (flow === 'endorsement') {
    return {
      title: 'Endorsement Quote',
      breadcrumb: 'Specialty - Endorsement Quote / Endorsement Quote',
      breadcrumbSubtext: '',
      dateLabel: 'Endorsement Effective Date',
      recordLabel: 'Submission',
    };
  }
  if (flow === 'renewal') {
    return {
      title: 'Renewal Quote',
      breadcrumb: 'Specialty - Renewals Quote / Renewal Quote',
      breadcrumbSubtext: '',
      dateLabel: 'Effective Date',
      recordLabel: 'Submission',
    };
  }
  return {
    title: 'New Submission',
    breadcrumb: 'Specialty - New Business Quote / New Submission',
    breadcrumbSubtext: '',
    dateLabel: 'Effective Date',
    recordLabel: 'Submission',
  };
}
const PHONE_COUNTRIES = [
  { value: 'United States +1', flagClass: 'flag-us' },
  { value: 'Canada +1',        flagClass: 'flag-ca' },
];

function PhoneCountrySelect({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = PHONE_COUNTRIES.find(c => c.value === value) ?? PHONE_COUNTRIES[0];

  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="phone-country-select" ref={ref}>
      <button type="button" className="phone-country-trigger" onClick={() => setOpen(o => !o)} disabled={disabled}>
        <span className={`flag-icon ${current.flagClass}`} aria-hidden="true" />
        <svg viewBox="0 0 10 6" width="8" height="8" style={{ color: '#6b7280', flexShrink: 0 }}><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
      </button>
      {open && (
        <div className="phone-country-dropdown">
          {PHONE_COUNTRIES.map(c => (
            <div key={c.value} className={`phone-country-option${value === c.value ? ' active' : ''}`} onMouseDown={() => { onChange(c.value); setOpen(false); }}>
              <span className={`flag-icon ${c.flagClass}`} aria-hidden="true" />
              <span>{c.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Google Places Autocomplete ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
// API key stored in .env.local as VITE_GOOGLE_MAPS_API_KEY (never hardcoded)
function loadGoogleMapsScript(cb: () => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.google?.maps?.places) { cb(); return; }

  // Queue callbacks ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â only one script tag, multiple callers
  if (w.__gmapsCbs) { w.__gmapsCbs.push(cb); return; }
  w.__gmapsCbs = [cb];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  w.__gmapsReady = () => { (w.__gmapsCbs as any[]).forEach((fn: () => void) => fn()); delete w.__gmapsCbs; };

  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    console.error('[InsureEdge] VITE_GOOGLE_MAPS_API_KEY missing from .env.local ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â restart dev server after adding it');
    w.__gmapsCbs = undefined;
    return;
  }
  console.log('[InsureEdge] Loading Google Maps Places scriptÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦');
  const s = document.createElement('script');
  s.id = 'gmaps-script';
  s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&loading=async&callback=__gmapsReady`;
  s.async = true;
  s.onerror = () => console.error('[InsureEdge] Google Maps script failed to load ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â check API key and billing');
  document.head.appendChild(s);
}

interface GooglePlaceFields {
  addressLine1: string; addressLine2?: string; city: string; state: string;
  county: string; zip: string; country: string;
  latitude: string; longitude: string;
}

function GoogleAddressAutocomplete({ onSelect, disabled = false, clearToken = 0, placeholder }: { onSelect: (f: GooglePlaceFields) => void; disabled?: boolean; clearToken?: number; placeholder?: string }) {
  const [query, setQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svcRef  = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detRef  = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery('');
    setSuggestions([]);
    setOpen(false);
  }, [clearToken]);

  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) { setApiStatus('error'); return; }
    loadGoogleMapsScript(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (!svcRef.current) svcRef.current = new w.google.maps.places.AutocompleteService();
      if (!detRef.current) detRef.current = new w.google.maps.places.PlacesService(document.createElement('div'));
      console.log('[InsureEdge] Google Maps Places ready');
      setApiStatus('ready');
    });
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleChange = (val: string) => {
    if (disabled) return;
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!val.trim() || val.length < 2) { setSuggestions([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gmp = (window as any).google?.maps?.places;
      if (!gmp) return;
      try {
        const { suggestions } = await gmp.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: val,
          includedRegionCodes: ['us', 'ca'],
          includedPrimaryTypes: ['address'],
        });
        if (suggestions?.length) { setSuggestions(suggestions); setOpen(true); }
        else { setSuggestions([]); setOpen(false); }
      } catch (e) {
        console.error('[InsureEdge] AutocompleteSuggestion error:', e);
        setSuggestions([]); setOpen(false);
      }
    }, 250);
  };

  const handleSelect = async (suggestion: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gmp = (window as any).google?.maps?.places;
    const pred = suggestion.placePrediction;
    setQuery(pred.text?.text ?? pred.mainText?.text ?? '');
    setOpen(false);
    setSuggestions([]);
    try {
      const place = pred.toPlace();
      await place.fetchFields({ fields: ['addressComponents', 'location'] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const comps: any[] = place.addressComponents ?? [];
      const get  = (t: string) => comps.find((c: any) => c.types?.includes(t))?.longText  ?? '';
      const getS = (t: string) => comps.find((c: any) => c.types?.includes(t))?.shortText ?? '';
      onSelect({
        addressLine1: [get('street_number'), get('route')].filter(Boolean).join(' '),
        addressLine2: get('subpremise'),
        city:         get('locality') || get('sublocality_level_1') || get('postal_town'),
        state:        get('administrative_area_level_1'),
        county:       get('administrative_area_level_2'),
        zip:          get('postal_code'),
        country:      getS('country') === 'US' ? 'United States' : get('country'),
        latitude:     String(place.location?.lat() ?? ''),
        longitude:    String(place.location?.lng() ?? ''),
      });
    } catch (e) {
      console.error('[InsureEdge] Place fetchFields error:', e);
      // Fallback: use legacy PlacesService if new API fails
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!detRef.current && gmp) detRef.current = new gmp.PlacesService(document.createElement('div'));
      if (!detRef.current) return;
      detRef.current.getDetails(
        { placeId: pred.placeId, fields: ['address_components', 'geometry'] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (place: any, status: string) => {
          if (status !== 'OK' || !place) return;
          const comps: any[] = place.address_components ?? [];
          const get  = (t: string) => comps.find((c: any) => c.types.includes(t))?.long_name  ?? '';
          const getS = (t: string) => comps.find((c: any) => c.types.includes(t))?.short_name ?? '';
          onSelect({
            addressLine1: [get('street_number'), get('route')].filter(Boolean).join(' '),
            addressLine2: get('subpremise'),
            city:         get('locality') || get('sublocality_level_1') || get('postal_town'),
            state:        get('administrative_area_level_1'),
            county:       get('administrative_area_level_2'),
            zip:          get('postal_code'),
            country:      getS('country') === 'US' ? 'United States' : get('country'),
            latitude:     String(place.geometry?.location?.lat() ?? ''),
            longitude:    String(place.geometry?.location?.lng() ?? ''),
          });
        }
      );
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <input
        value={query}
        onChange={e => handleChange(e.target.value)}
        placeholder={apiStatus === 'ready' ? (placeholder ?? '') : apiStatus === 'error' ? 'Google Places API key missing' : 'Loading Google Maps...'}
        autoComplete="off"
        disabled={disabled || apiStatus === 'error'}
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
      {open && suggestions.length > 0 && (
        <div className="google-suggestions">
          {suggestions.map((s: any) => {
            const pred = s.placePrediction;
            return (
            <div
              key={pred?.placeId ?? Math.random()}
              onMouseDown={() => handleSelect(s)}
              className="google-suggestion-item">
              <span className="google-suggestion-pin" aria-hidden="true">&#9679;</span>
              <span className="google-suggestion-main">{pred?.mainText?.text}</span>
              {pred?.secondaryText?.text && (
                <span className="google-suggestion-secondary">{pred.secondaryText.text}</span>
              )}
            </div>
          );})}
          <div className="google-suggestions-powered">powered by <span>Google</span></div>
        </div>
      )}
    </div>
  );
}
// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Location Modal ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
function formatZipInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

function locationMedia(loc: Pick<LocationItem, 'latitude' | 'longitude'>, type: 'photo' | 'map') {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const hasGeo = Boolean(loc.latitude && loc.longitude && key);
  if (!hasGeo) return null;
  const center = `${loc.latitude},${loc.longitude}`;
  if (type === 'photo') {
    return `https://maps.googleapis.com/maps/api/streetview?size=640x180&location=${encodeURIComponent(center)}&key=${key}`;
  }
  return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(center)}&zoom=15&size=640x220&maptype=roadmap&markers=color:red%7C${encodeURIComponent(center)}&key=${key}`;
}

function LocationPhotoPanel({ loc, compact = false }: { loc: Pick<LocationItem, 'latitude' | 'longitude'>; compact?: boolean }) {
  const photo = locationMedia(loc, 'photo');
  return (
    <>
      <div className="loc-visual-label">Location Photos</div>
      <div className={`loc-photo-panel${compact ? ' loc-photo-panel-compact' : ''}`}>
        {photo ? <img src={photo} alt="Location street view" /> : <span>No Photos Available</span>}
      </div>
    </>
  );
}

function LocationMapPanel({ loc, compact = false }: { loc: Pick<LocationItem, 'latitude' | 'longitude'>; compact?: boolean }) {
  const map = locationMedia(loc, 'map');
  return (
    <>
      <div className="loc-visual-label">Location Google Maps</div>
      <div className={`loc-map-panel${compact ? ' loc-map-panel-compact' : ''}`}>
        {map ? <img src={map} alt="Location map" /> : <span>No Information Available</span>}
      </div>
    </>
  );
}

function LocationVisualPanel({ loc, compact = false }: { loc: Pick<LocationItem, 'latitude' | 'longitude'>; compact?: boolean }) {
  return (
    <>
      <LocationPhotoPanel loc={loc} compact={compact} />
      <LocationMapPanel loc={loc} compact={compact} />
    </>
  );
}

function LocationModal({ title, initial, onSave, onClose }: {
  title: string;
  initial: Omit<LocationItem, 'id'>;
  onSave: (loc: Omit<LocationItem, 'id'>) => void;
  onClose: () => void;
}) {
  const [loc, setLoc] = useState<Omit<LocationItem, 'id'>>({ ...initial, country: initial.country || 'United States', state: initial.state || '' });
  const [manual, setManual] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  function setL(k: string, v: string) {
    const next = k === 'zip' ? formatZipInput(v) : v;
    setLoc(l => ({ ...l, [k]: next }));
    setErrors(e => {
      const copy = { ...e };
      delete copy[k];
      return copy;
    });
  }
  function validate() {
    const next: Record<string, string> = {};
    if (!loc.addressLine1.trim()) next.addressLine1 = 'Provide Address Line 1 to continue';
    if (!loc.country.trim()) next.country = 'Provide Country to continue';
    if (!loc.state.trim()) next.state = 'Provide State to continue';
    if (!loc.city.trim()) next.city = 'Provide City to continue';
    if (!loc.county.trim()) next.county = 'Provide County to continue';
    if (!loc.zip.trim()) next.zip = 'Provide Zip Code to continue';
    setErrors(next);
    return Object.keys(next).length === 0;
  }
  function save() {
    if (!validate()) return;
    onSave(loc);
  }
  const addressDisabled = !manual;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl location-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          {title}
          <button className="modal-close" onClick={onClose}>&#215;</button>
        </div>
        <div className="location-modal-tab">Location - 1</div>
        <div className="modal-body location-modal-body">
          <div className="location-modal-form source-contact-panel">
            <div className="form-group form-full source-google-search">
              <label>Google Address Search</label>
              <GoogleAddressAutocomplete onSelect={f => {
                setLoc(l => ({ ...l,
                  addressLine1: f.addressLine1,
                  addressLine2: f.addressLine2 ?? '',
                  city: f.city,
                  state: f.state,
                  county: f.county,
                  zip: formatZipInput(f.zip),
                  country: f.country || 'United States',
                  latitude: f.latitude,
                  longitude: f.longitude,
                }));
                setErrors({});
              }} disabled={manual} />
            </div>
            <label className="check-row source-manual-check">
              <input type="checkbox" checked={manual} onChange={e => setManual(e.target.checked)} /> Enter Address Manually
            </label>
            <div className="source-address-grid source-address-two">
              <Field label="Address Line 1" required><Input value={loc.addressLine1} onChange={v => setL('addressLine1', v)} disabled={addressDisabled} /></Field>
              <Field label={<span>Address Line 2 <span className="source-info-icon" title="Address Line 2 can store additional information including: PO Box, Suite/Apartment Number, Community Name, etc.">(i)</span></span>}><Input value={loc.addressLine2} onChange={v => setL('addressLine2', v)} disabled={addressDisabled} /></Field>
            </div>
            <div className="source-address-grid source-address-two location-error-row">
              <div>{errors.addressLine1 && <div className="field-error">{errors.addressLine1}</div>}</div><div />
            </div>
            <div className="source-address-grid source-address-three">
              <Field label="Country" required><FSelect value={loc.country} onChange={v => { setL('country', v); setL('state', ''); }} options={['United States', 'Canada']} disabled={addressDisabled} /></Field>
              <Field label="State" required><FSelect value={loc.state} onChange={v => setL('state', v)} options={US_STATES} disabled={addressDisabled} /></Field>
              <Field label="City" required><Input value={loc.city} onChange={v => setL('city', v)} disabled={addressDisabled} /></Field>
            </div>
            <div className="source-address-grid source-address-three location-error-row">
              <div>{errors.country && <div className="field-error">{errors.country}</div>}</div>
              <div>{errors.state && <div className="field-error">{errors.state}</div>}</div>
              <div>{errors.city && <div className="field-error">{errors.city}</div>}</div>
            </div>
            <div className="source-address-grid source-address-two source-address-short">
              <Field label="County" required><Input value={loc.county} onChange={v => setL('county', v)} disabled={addressDisabled} /></Field>
              <Field label="Zip Code" required><Input value={loc.zip} onChange={v => setL('zip', v)} disabled={addressDisabled} /></Field>
            </div>
            <div className="source-address-grid source-address-two source-address-short location-error-row">
              <div>{errors.county && <div className="field-error">{errors.county}</div>}</div>
              <div>{errors.zip && <div className="field-error">{errors.zip}</div>}</div>
            </div>
            <div className="source-address-grid source-address-two source-address-short">
              <Field label="Latitude"><Input value={loc.latitude} onChange={v => setL('latitude', v)} disabled={addressDisabled} /></Field>
              <Field label="Longitude"><Input value={loc.longitude} onChange={v => setL('longitude', v)} disabled={addressDisabled} /></Field>
            </div>
          </div>
          <div className="location-modal-preview">
            <LocationVisualPanel loc={loc} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}
// Delete Confirm Modal ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
function DeleteConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: 40, color: '#dc2626', marginBottom: 12 }}>&#128465;</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Are you sure you want to delete this?</div>
          <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 24 }}>
            This Action cannot be undone. Please confirm if<br />you want to proceed
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={onCancel}>No, Keep It</button>
            <button className="btn btn-danger" onClick={onConfirm}>Yes, Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Mortgage Modal ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
type MortgageValidationErrors = Partial<Record<keyof Omit<MortgageItem, 'id'>, string>>;

function phoneDialPrefix(country: string | null | undefined) {
  if (!country) return '+1';
  return country.includes('+1') ? '+1' : '+1';
}

function mortgagePhoneDisplay(m: Pick<MortgageItem, 'telephone' | 'phoneCountry'>) {
  if (!m.telephone) return '';
  return m.telephone.trim().startsWith('+') ? m.telephone : `${phoneDialPrefix(m.phoneCountry)} ${m.telephone}`;
}

function mortgageAddressDisplay(m: Pick<MortgageItem, 'addressLine1' | 'addressLine2' | 'city' | 'state' | 'country' | 'county' | 'zip'>) {
  return [m.addressLine1, m.addressLine2, m.city, m.state, m.country, m.county, m.zip].filter(Boolean).join(', ');
}

function isValidPhoneValue(value: string) {
  return /^\(\d{3}\) \d{3}-\d{4}$/.test(value.trim()) || /^\+1 \(\d{3}\) \d{3}-\d{4}$/.test(value.trim());
}

function isValidZipValue(value: string) {
  return /^\d{5}(-\d{4})?$/.test(value.trim());
}

function isValidEmailValue(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function MortgageFieldError({ message }: { message?: string }) {
  return message ? <div className="field-error">{message}</div> : null;
}

function MortgageViewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="mortgage-view-row">
      <div className="mortgage-view-label">{label}</div>
      <div className="mortgage-view-value">{value || '-'}</div>
    </div>
  );
}

function MortgageModal({ mode, initial, onSave, onClose, onEdit }: {
  mode: 'add' | 'edit' | 'view';
  initial: Omit<MortgageItem, 'id'>;
  onSave: (m: Omit<MortgageItem, 'id'>) => void;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const [m, setM] = useState<Omit<MortgageItem, 'id'>>({ ...EMPTY_MORTGAGE, ...initial });
  const [errors, setErrors] = useState<MortgageValidationErrors>({});
  const [addressClearToken, setAddressClearToken] = useState(0);
  const isView = mode === 'view';
  const title = isView ? 'Mortgage Information' : 'Add Mortgage Information';
  const addressVisible = Boolean(m.name.trim());
  const manualEnabled = m.manualAddress;

  function set(k: keyof Omit<MortgageItem, 'id'>, v: string | boolean) {
    setM(x => ({ ...x, [k]: v }));
    setErrors(e => ({ ...e, [k]: undefined }));
  }

  function validate(next: Omit<MortgageItem, 'id'>) {
    const e: MortgageValidationErrors = {};
    if (!next.name.trim()) e.name = 'Provide Mortgagee Name to continue';
    else if (next.name.trim().length < 3 || next.name.trim().length > 100) e.name = 'Mortgagee Name should be in between 3 to 100 characters';
    if (!next.loanNumber.trim()) e.loanNumber = 'Provide Loan Number to continue';
    else if (next.loanNumber.trim().length < 6 || next.loanNumber.trim().length > 13) e.loanNumber = 'Loan Number should be in between 6 to 13 characters';
    if (next.mortgageServiceCompany.trim() && (next.mortgageServiceCompany.trim().length < 5 || next.mortgageServiceCompany.trim().length > 100))
      e.mortgageServiceCompany = 'Mortgagee Service Company should be in between 5 to 100 characters';
    if (!next.lenderType) e.lenderType = 'Provide Lender Type to continue';
    if (!next.loanType) e.loanType = 'Provide Loan Type to continue';
    if (!next.coveredAsset) e.coveredAsset = 'Provide Covered Asset to continue';
    if (!next.addressLine1.trim()) e.addressLine1 = 'Provide Address Line 1 to continue';
    if (!next.state.trim()) e.state = 'Provide State to continue';
    if (!next.city.trim()) e.city = 'Provide City to continue';
    if (!next.zip.trim() || !isValidZipValue(next.zip)) e.zip = 'Provide valid Zip Code to continue';
    if (!next.telephone.trim()) e.telephone = 'Provide Telephone Number to continue';
    else if (!isValidPhoneValue(next.telephone)) e.telephone = 'Provide valid Telephone Number to continue';
    if (!next.email.trim()) e.email = 'Provide Email ID to continue';
    else if (!isValidEmailValue(next.email)) e.email = 'Provide valid Email ID to continue';
    return e;
  }

  function save() {
    const nextErrors = validate(m);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave(m);
  }

  function applyGoogleAddress(f: GooglePlaceFields) {
    setM(x => ({
      ...x,
      googleAddress: [f.addressLine1, f.city, f.state, f.country].filter(Boolean).join(', '),
      addressLine1: f.addressLine1,
      addressLine2: f.addressLine2 || '',
      country: f.country || 'United States',
      state: f.state,
      city: f.city,
      county: f.county,
      zip: f.zip,
      latitude: f.latitude,
      longitude: f.longitude,
    }));
    setErrors(e => ({ ...e, addressLine1: undefined, state: undefined, city: undefined, zip: undefined }));
  }

  function toggleManual(checked: boolean) {
    setM(x => ({ ...x, manualAddress: checked }));
    if (checked) setAddressClearToken(t => t + 1);
  }

  if (isView) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal-xl mortgage-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-title">
            {title}
            <button className="modal-close" onClick={onClose}>&#215;</button>
          </div>
          <div className="modal-body mortgage-modal-body">
            <div className="mortgage-form-layout mortgage-view-layout">
              <div className="mortgage-form-main">
                <div className="mortgage-view-grid mortgage-view-top-grid">
                  <MortgageViewRow label="Mortgagee Name" value={m.name} />
                  <MortgageViewRow label="Loan Number" value={m.loanNumber} />
                  <MortgageViewRow label="Mortgagee Service Company" value={m.mortgageServiceCompany} />
                  <MortgageViewRow label="Client ID" value={m.clientId} />
                  <MortgageViewRow label="Lender Type" value={m.lenderType} />
                  <MortgageViewRow label="Loan Type" value={m.loanType} />
                  <MortgageViewRow label="Covered Asset" value={m.coveredAsset} />
                </div>
                <div className="mortgage-view-grid mortgage-view-address-grid">
                  <MortgageViewRow label="Address Line 1" value={m.addressLine1} />
                  <MortgageViewRow label="Address Line 2" value={m.addressLine2} />
                  <MortgageViewRow label="Country" value={m.country} />
                  <MortgageViewRow label="State" value={m.state} />
                  <MortgageViewRow label="City" value={m.city} />
                  <MortgageViewRow label="County" value={m.county} />
                  <MortgageViewRow label="Zip Code" value={m.zip} />
                  <MortgageViewRow label="Latitude" value={m.latitude} />
                  <MortgageViewRow label="Longitude" value={m.longitude} />
                </div>
              </div>
              <div className="mortgage-contact-panel mortgage-view-contact-panel">
                <div className="mortgage-subtitle">Contact Information</div>
                <div className="mortgage-view-grid mortgage-view-contact-grid">
                  <MortgageViewRow label="Telephone Number" value={mortgagePhoneDisplay(m)} />
                  <MortgageViewRow label="Extension" value={m.extension} />
                  <MortgageViewRow label="Alternative Telephone Number" value={m.altTelephone ? `${phoneDialPrefix(m.altPhoneCountry)} ${m.altTelephone}` : ''} />
                  <MortgageViewRow label="Email ID" value={m.email} />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-blue" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={onEdit}>Edit</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl mortgage-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          {title}
          <button className="modal-close" onClick={onClose}>&#215;</button>
        </div>
        <div className="modal-body mortgage-modal-body">
          <div className="mortgage-form-layout">
            <div className="mortgage-form-main">
              <div className="form-grid-2 mortgage-top-grid">
                <Field label="Mortgagee Name" required><Input value={m.name} onChange={v => set('name', v)} hasError={Boolean(errors.name)} /><MortgageFieldError message={errors.name} /></Field>
                <Field label="Loan Number" required><Input value={m.loanNumber} onChange={v => set('loanNumber', v)} hasError={Boolean(errors.loanNumber)} /><MortgageFieldError message={errors.loanNumber} /></Field>
                <Field label="Mortgagee Service Company"><Input value={m.mortgageServiceCompany} onChange={v => set('mortgageServiceCompany', v)} hasError={Boolean(errors.mortgageServiceCompany)} /><MortgageFieldError message={errors.mortgageServiceCompany} /></Field>
                <Field label="Client ID"><Input value={m.clientId} onChange={v => set('clientId', v)} /></Field>
                <Field label="Lender Type" required><FSelect value={m.lenderType} onChange={v => set('lenderType', v)} options={LENDER_TYPE_OPTIONS} placeholder="Select" /><MortgageFieldError message={errors.lenderType} /></Field>
                <Field label="Loan Type" required><FSelect value={m.loanType} onChange={v => set('loanType', v)} options={LOAN_TYPE_OPTIONS} placeholder="Select" /><MortgageFieldError message={errors.loanType} /></Field>
                <Field label="Covered Asset" required><FSelect value={m.coveredAsset} onChange={v => set('coveredAsset', v)} options={COVERED_ASSET_OPTIONS} placeholder="Select" /><MortgageFieldError message={errors.coveredAsset} /></Field>
              </div>

              {addressVisible && (
                <div className="mortgage-address-section">
                  <Field label="Search Address"><GoogleAddressAutocomplete onSelect={applyGoogleAddress} disabled={manualEnabled} clearToken={addressClearToken} placeholder="Start typing in address" /></Field>
                  <label className="check-row mortgage-manual-check"><input type="checkbox" checked={m.manualAddress} onChange={e => toggleManual(e.target.checked)} /> Enter Address Manually</label>
                  <div className="form-grid-2 mortgage-address-grid">
                    <Field label="Address Line 1" required><Input value={m.addressLine1} onChange={v => set('addressLine1', v)} disabled={!manualEnabled} /><MortgageFieldError message={errors.addressLine1} /></Field>
                    <Field label={<>Address Line 2 <span className="info-dot">i</span></>}><Input value={m.addressLine2} onChange={v => set('addressLine2', v)} disabled={!manualEnabled} /></Field>
                    <Field label="Country" required><FSelect value={m.country} onChange={v => set('country', v)} options={['United States', 'Canada']} disabled={!manualEnabled} /></Field>
                    <Field label="State" required><FSelect value={m.state} onChange={v => set('state', v)} options={ALL_STATES} disabled={!manualEnabled} placeholder="Select..." /><MortgageFieldError message={errors.state} /></Field>
                    <Field label="City" required><Input value={m.city} onChange={v => set('city', v)} disabled={!manualEnabled} /><MortgageFieldError message={errors.city} /></Field>
                    <Field label="County"><Input value={m.county} onChange={v => set('county', v)} disabled={!manualEnabled} /></Field>
                    <Field label="Zip Code" required><Input value={m.zip} onChange={v => set('zip', formatZipInput(v))} disabled={!manualEnabled} /><MortgageFieldError message={errors.zip} /></Field>
                    <Field label="Latitude"><Input value={m.latitude} onChange={v => set('latitude', v)} disabled={!manualEnabled} /></Field>
                    <Field label="Longitude"><Input value={m.longitude} onChange={v => set('longitude', v)} disabled={!manualEnabled} /></Field>
                  </div>
                </div>
              )}
            </div>

            <div className="mortgage-contact-panel">
              <div className="mortgage-subtitle">Contact Information</div>
              <Field label="Telephone Number" required>
                <div className="phone-input-wrap">
                  <PhoneCountrySelect value={m.phoneCountry} onChange={v => set('phoneCountry', v)} />
                  <input value={m.telephone} onChange={e => set('telephone', formatPhone(e.target.value))} placeholder="(###) ###-####" />
                </div>
                <MortgageFieldError message={errors.telephone} />
              </Field>
              <Field label="Extension"><Input value={m.extension} onChange={v => set('extension', v)} /></Field>
              <Field label="Alternative Telephone Number">
                <div className="phone-input-wrap">
                  <PhoneCountrySelect value={m.altPhoneCountry} onChange={v => set('altPhoneCountry', v)} />
                  <input value={m.altTelephone} onChange={e => set('altTelephone', formatPhone(e.target.value))} placeholder="(###) ###-####" />
                </div>
              </Field>
              <Field label="Email ID" required><Input value={m.email} onChange={v => set('email', v)} /><MortgageFieldError message={errors.email} /></Field>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

// Phone formatter (US: (###) ###-####)
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length <= 3) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Generic client-side sort ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
function sortItems<T>(items: T[], col: string, dir: 'asc' | 'desc'): T[] {
  return [...items].sort((a, b) => {
    const av = String((a as Record<string, unknown>)[col] ?? '').toLowerCase();
    const bv = String((b as Record<string, unknown>)[col] ?? '').toLowerCase();
    return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Sortable TH ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
function SortTh({ label, col, sortCol, sortDir, onSort }: {
  label: string; col: string;
  sortCol: string | null; sortDir: 'asc' | 'desc';
  onSort: () => void;
}) {
  const active = sortCol === col;
  const icon = active ? (sortDir === 'asc' ? '\u2191' : '\u2193') : '\u21C5';
  return (
    <th onClick={onSort} className="sortable-th">
      <div className="th-inner">
        <span>{label}</span>
        <span className="sort-icon" aria-hidden="true">{icon}</span>
      </div>
    </th>
  );
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Sample data ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Additional Named Insured Modal ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
// Source: GetInsuredType_HB (IE_Common_CS) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â HB Insurance System specific
const INSURED_TYPES_LIST = ['Individual', 'Trust', 'Corporation', 'LLC', 'Partnership'];
// Source: Get_RelationshipWithInsured_HBIS (IE_Common_CS)
const RELATIONSHIPS_LIST = ['Spouse', 'Child', 'Parent', 'Sibling', 'Relative (Other than Spouse)', 'Employee', 'Other'];

function NameInsuredModal({ title, initial, onSave, onClose, locked }: {
  title: string;
  initial: Omit<AdditionalInsuredItem, 'id'>;
  onSave: (v: Omit<AdditionalInsuredItem, 'id'>) => void;
  onClose: () => void;
  locked?: boolean;
}) {
  const [vals, setVals] = useState({ ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [relSearch, setRelSearch] = useState('');
  const [showRelDrop, setShowRelDrop] = useState(false);
  const [insuredSearch, setInsuredSearch] = useState('');
  const [showInsuredDrop, setShowInsuredDrop] = useState(false);

  function sv(k: keyof typeof vals, v: string) {
    setVals(x => ({ ...x, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k as string]; return n; });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!vals.firstName.trim()) errs.firstName = 'First Name is required';
    if (!vals.lastName.trim()) errs.lastName = 'Last Name is required';
    if (!vals.telephone.trim()) errs.telephone = 'Telephone Number is required';
    else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(vals.telephone)) errs.telephone = 'Format: (###) ###-####';
    if (vals.altTelephone && !/^\(\d{3}\) \d{3}-\d{4}$/.test(vals.altTelephone)) errs.altTelephone = 'Format: (###) ###-####';
    if (vals.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) errs.email = 'Invalid email format';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const filteredRels = RELATIONSHIPS_LIST.filter(r => !relSearch || r.toLowerCase().includes(relSearch.toLowerCase()));
  const filteredInsuredTypes = INSURED_TYPES_LIST.filter(t => !insuredSearch || t.toLowerCase().includes(insuredSearch.toLowerCase()));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{title}<button className="modal-close" onClick={onClose}>&#215;</button></div>
        <div className="modal-body">
          {Object.keys(errors).length > 0 && (
            <div className="validation-message">Please correct the highlighted errors before saving.</div>
          )}
          <div className="form-grid-3">
            <div className="form-group">
              <label><span style={{ color: '#dc2626' }}>* </span>First Name</label>
              <input value={vals.firstName} onChange={e => sv('firstName', e.target.value)} disabled={locked} />
              {errors.firstName && <div className="field-error">{errors.firstName}</div>}
            </div>
            <div className="form-group">
              <label>Middle Name / Initial</label>
              <input value={vals.middleName} onChange={e => sv('middleName', e.target.value)} disabled={locked} />
            </div>
            <div className="form-group">
              <label><span style={{ color: '#dc2626' }}>* </span>Last Name</label>
              <input value={vals.lastName} onChange={e => sv('lastName', e.target.value)} disabled={locked} />
              {errors.lastName && <div className="field-error">{errors.lastName}</div>}
            </div>
          </div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Relationship</label>
              <input
                value={showRelDrop ? relSearch : vals.relationship}
                placeholder="Select or search..."
                disabled={locked}
                onFocus={() => { setShowRelDrop(true); setRelSearch(''); }}
                onChange={e => setRelSearch(e.target.value)}
                onBlur={() => setTimeout(() => setShowRelDrop(false), 150)}
              />
              {showRelDrop && !locked && (
                <div className="org-type-dropdown">
                  {filteredRels.map(r => (
                    <div key={r} className="org-type-option" onMouseDown={() => { sv('relationship', r); setShowRelDrop(false); }}>
                      {r}
                    </div>
                  ))}
                  {filteredRels.length === 0 && <div className="org-type-option" style={{ color: '#9ca3af' }}>No matches</div>}
                </div>
              )}
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label><span style={{ color: '#dc2626' }}>* </span>Insured Type</label>
              <input
                value={showInsuredDrop ? insuredSearch : vals.insuredType}
                placeholder="Select or search..."
                disabled={locked}
                onFocus={() => { setShowInsuredDrop(true); setInsuredSearch(''); }}
                onChange={e => setInsuredSearch(e.target.value)}
                onBlur={() => setTimeout(() => setShowInsuredDrop(false), 150)}
              />
              {showInsuredDrop && !locked && (
                <div className="org-type-dropdown">
                  {filteredInsuredTypes.map(t => (
                    <div key={t} className="org-type-option" onMouseDown={() => { sv('insuredType', t); setShowInsuredDrop(false); }}>
                      {t}
                    </div>
                  ))}
                  {filteredInsuredTypes.length === 0 && <div className="org-type-option" style={{ color: '#9ca3af' }}>No matches</div>}
                </div>
              )}
            </div>
          </div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <div className="form-group">
              <label><span style={{ color: '#dc2626' }}>* </span>Telephone Number</label>
              <input value={vals.telephone} onChange={e => sv('telephone', formatPhone(e.target.value))} placeholder="(###) ###-####" disabled={locked} />
              {errors.telephone && <div className="field-error">{errors.telephone}</div>}
            </div>
            <div className="form-group">
              <label>Alternative Telephone Number</label>
              <input value={vals.altTelephone} onChange={e => sv('altTelephone', formatPhone(e.target.value))} placeholder="(###) ###-####" disabled={locked} />
              {errors.altTelephone && <div className="field-error">{errors.altTelephone}</div>}
            </div>
          </div>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <div className="form-group">
              <label>Email ID</label>
              <input value={vals.email} onChange={e => sv('email', e.target.value)} disabled={locked} />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label>DBA Name</label>
              <input value={vals.dbaName} onChange={e => sv('dbaName', e.target.value)} disabled={locked} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          {!locked && <button className="btn btn-primary" onClick={() => { if (validate()) onSave(vals); }}>Save</button>}
        </div>
      </div>
    </div>
  );
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Additional Organization Modal ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
// Source: GetOrganizationType_HB (IE_Common_CS)
const ORG_TYPES_LIST = ['Association', 'Corporation', 'LLC', 'Partnership', 'Trust', 'Other'];

function OrgModal({ title, initial, onSave, onClose, locked }: {
  title: string;
  initial: Omit<AdditionalOrgItem, 'id'>;
  onSave: (v: Omit<AdditionalOrgItem, 'id'>) => void;
  onClose: () => void;
  locked?: boolean;
}) {
  const [vals, setVals] = useState({ ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orgSearch, setOrgSearch] = useState('');
  const [showOrgDrop, setShowOrgDrop] = useState(false);

  function sv(k: keyof typeof vals, v: string) {
    setVals(x => ({ ...x, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k as string]; return n; });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!vals.orgName.trim()) errs.orgName = 'Organization Name is required';
    if (!vals.orgType) errs.orgType = 'Organization Type is required';
    if (!vals.contactFirstName.trim()) errs.contactFirstName = 'Contact First Name is required';
    if (!vals.contactLastName.trim()) errs.contactLastName = 'Contact Last Name is required';
    if (!vals.telephone.trim()) errs.telephone = 'Telephone Number is required';
    else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(vals.telephone)) errs.telephone = 'Format: (###) ###-####';
    if (vals.altTelephone && !/^\(\d{3}\) \d{3}-\d{4}$/.test(vals.altTelephone)) errs.altTelephone = 'Format: (###) ###-####';
    if (vals.extension && !/^\d{1,6}$/.test(vals.extension)) errs.extension = 'Must be 1ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“6 digits';
    if (vals.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) errs.email = 'Invalid email format';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const filteredOrgTypes = ORG_TYPES_LIST.filter(t => !orgSearch || t.toLowerCase().includes(orgSearch.toLowerCase()));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{title}<button className="modal-close" onClick={onClose}>&#215;</button></div>
        <div className="modal-body">
          {Object.keys(errors).length > 0 && (
            <div className="validation-message">Please correct the highlighted errors before saving.</div>
          )}
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label><span style={{ color: '#dc2626' }}>* </span>Organization Name</label>
              <input value={vals.orgName} onChange={e => sv('orgName', e.target.value)} disabled={locked} />
              {errors.orgName && <div className="field-error">{errors.orgName}</div>}
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label><span style={{ color: '#dc2626' }}>* </span>Organization Type</label>
              <input
                value={showOrgDrop ? orgSearch : vals.orgType}
                placeholder="Select or search..."
                disabled={locked}
                onFocus={() => { setShowOrgDrop(true); setOrgSearch(''); }}
                onChange={e => setOrgSearch(e.target.value)}
                onBlur={() => setTimeout(() => setShowOrgDrop(false), 150)}
              />
              {showOrgDrop && !locked && (
                <div className="org-type-dropdown">
                  {filteredOrgTypes.map(t => (
                    <div key={t} className="org-type-option" onMouseDown={() => { sv('orgType', t); setShowOrgDrop(false); }}>
                      {t}
                    </div>
                  ))}
                  {filteredOrgTypes.length === 0 && <div className="org-type-option" style={{ color: '#9ca3af' }}>No matches</div>}
                </div>
              )}
              {errors.orgType && <div className="field-error">{errors.orgType}</div>}
            </div>
          </div>

          <div style={{ fontWeight: 600, fontSize: 12, color: '#374151', marginBottom: 8 }}>Contact Person</div>
          <div className="form-grid-3" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label><span style={{ color: '#dc2626' }}>* </span>First Name</label>
              <input value={vals.contactFirstName} onChange={e => sv('contactFirstName', e.target.value)} disabled={locked} />
              {errors.contactFirstName && <div className="field-error">{errors.contactFirstName}</div>}
            </div>
            <div className="form-group">
              <label>Middle Name</label>
              <input value={vals.contactMiddleName} onChange={e => sv('contactMiddleName', e.target.value)} disabled={locked} />
            </div>
            <div className="form-group">
              <label><span style={{ color: '#dc2626' }}>* </span>Last Name</label>
              <input value={vals.contactLastName} onChange={e => sv('contactLastName', e.target.value)} disabled={locked} />
              {errors.contactLastName && <div className="field-error">{errors.contactLastName}</div>}
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label><span style={{ color: '#dc2626' }}>* </span>Telephone Number</label>
              <input value={vals.telephone} onChange={e => sv('telephone', formatPhone(e.target.value))} placeholder="(###) ###-####" disabled={locked} />
              {errors.telephone && <div className="field-error">{errors.telephone}</div>}
            </div>
            <div className="form-group">
              <label>Extension</label>
              <input value={vals.extension} onChange={e => sv('extension', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="1ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“6 digits" disabled={locked} />
              {errors.extension && <div className="field-error">{errors.extension}</div>}
            </div>
            <div className="form-group">
              <label>Alternative Telephone Number</label>
              <input value={vals.altTelephone} onChange={e => sv('altTelephone', formatPhone(e.target.value))} placeholder="(###) ###-####" disabled={locked} />
              {errors.altTelephone && <div className="field-error">{errors.altTelephone}</div>}
            </div>
            <div className="form-group">
              <label>Email ID</label>
              <input value={vals.email} onChange={e => sv('email', e.target.value)} disabled={locked} />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          {!locked && <button className="btn btn-primary" onClick={() => { if (validate()) onSave(vals); }}>Save</button>}
        </div>
      </div>
    </div>
  );
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Step 0: Policy Information ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
function StepPolicyInfo({
  form, set,
  additionalInsureds, setAdditionalInsureds,
  additionalOrgs, setAdditionalOrgs,
  intermediaryOptions, producerOptions,
  isLoggedInUserProducer,
  isRenewalQuote = false,
  errors = {},
  setErrors = () => {},
}: {
  form: FormState;
  set: (k: keyof FormState, v: any) => void;
  additionalInsureds: AdditionalInsuredItem[];
  setAdditionalInsureds: React.Dispatch<React.SetStateAction<AdditionalInsuredItem[]>>;
  additionalOrgs: AdditionalOrgItem[];
  setAdditionalOrgs: React.Dispatch<React.SetStateAction<AdditionalOrgItem[]>>;
  intermediaryOptions: DropdownOption[];
  producerOptions: DropdownOption[];
  isLoggedInUserProducer: boolean;
  isRenewalQuote?: boolean;
  errors?: Record<string, string>;
  setErrors?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const INSURED_PAGE_SIZE = 10;
  const ORG_PAGE_SIZE = 10;
  const locked = form.lockSubmission;
  const showAdditionalNamedInsured = form.policyInsuranceType === '1' || form.policyInsuranceType === '2';
  const addVisible =
    form.screenCode === 'ENDORSEMENTINDIVIDUAL' ||
    form.screenCode === 'ENDORSEMENTBUSINESS'
      ? !form.isHBProducer
      : form.isHBProducer && form.isQuickQuote
        ? true
        : String(form.hexCatStatus).toUpperCase() === 'APPROVED';
  const addDisabled = locked;
  const canUseRowActions = addVisible && !locked;
  const canEditManualRow = (item: { isManual?: boolean }) => item.isManual === true && canUseRowActions;

  // Renewal quote field disable logic: for non-producers, most policy fields are read-only
  const disableRenewalFields = isRenewalQuote && !isLoggedInUserProducer;
  const [isManualAddress, setIsManualAddress] = useState(true);
  const [showAddressModeConfirm, setShowAddressModeConfirm] = useState(false);
  const [addressSearchClearToken, setAddressSearchClearToken] = useState(0);
  // Primary Named Insured vs Primary Organization visibility (OutSystems parity):
  // InsuranceType="2" AND (Individual OR Sole Proprietorship) -> Named Insured fields;
  // otherwise -> Organization fields.
  const isPersonType = form.policyInsuranceType === '2' && PERSON_INSURED_TYPES.has(form.insuredType);
  const stateOptions = STATE_OPTIONS_BY_COUNTRY[form.country] ?? [];
  const intermediaryNames = intermediaryOptions.map(option => option.name);
  const producerNames = producerOptions.map(option => option.name);

  function handlePrimaryInsuredTypeChange(value: string) {
    set('insuredType', value);
  }

  function handleBrokerageFirmChange(value: string) {
    const selected = intermediaryOptions.find(option => option.name === value);
    set('brokerageFirm', value);
    set('brokerageFirmId', selected?.id ?? null);
    set('producerName', '');
    set('producerId', null);
    if (selected?.id) setErrors(e => ({ ...e, brokerageFirmId: '' }));
  }

  function handleProducerChange(value: string) {
    const selected = producerOptions.find(option => option.name === value);
    set('producerName', value);
    set('producerId', selected?.id ?? null);
    if (selected?.id) setErrors(e => ({ ...e, producerId: '' }));
  }
  function handleCountryChange(value: string) {
    const nextStates = STATE_OPTIONS_BY_COUNTRY[value] ?? [];
    set('country', value);
    if (!nextStates.includes(form.state)) {
      set('state', '');
    }
    if (value) setErrors(e => ({ ...e, country: '' }));
  }

  function clearMailingAddress() {
    set('addressLine1', '');
    set('addressLine2', '');
    set('country', '');
    set('state', '');
    set('city', '');
    set('county', '');
    set('zip', '');
    set('latitude', '');
    set('longitude', '');
  }

  function handleManualAddressToggle(checked: boolean) {
    if (checked) {
      setIsManualAddress(true);
      return;
    }
    setShowAddressModeConfirm(true);
  }

  function continueGoogleAddressMode() {
    clearMailingAddress();
    setAddressSearchClearToken(v => v + 1);
    setIsManualAddress(false);
    setShowAddressModeConfirm(false);
  }

  const [insuredModal, setInsuredModal] = useState<{ mode: 'add' | 'edit'; item?: AdditionalInsuredItem } | null>(null);
  const [insuredDeleteId, setInsuredDeleteId] = useState<number | null>(null);
  const [insuredSort, setInsuredSort] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(null);
  const [insuredPage, setInsuredPage] = useState(1);

  const [orgModal, setOrgModal] = useState<{ mode: 'add' | 'edit'; item?: AdditionalOrgItem } | null>(null);
  const [orgDeleteId, setOrgDeleteId] = useState<number | null>(null);
  const [orgSort, setOrgSort] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(null);
  const [orgPage, setOrgPage] = useState(1);

  const sortedInsureds = insuredSort ? sortItems(additionalInsureds, insuredSort.col, insuredSort.dir) : additionalInsureds;
  const insuredTotalPages = Math.max(1, Math.ceil(sortedInsureds.length / INSURED_PAGE_SIZE));
  const insuredPageRows = sortedInsureds.slice((insuredPage - 1) * INSURED_PAGE_SIZE, insuredPage * INSURED_PAGE_SIZE);

  const sortedOrgs = orgSort ? sortItems(additionalOrgs, orgSort.col, orgSort.dir) : additionalOrgs;
  const orgTotalPages = Math.max(1, Math.ceil(sortedOrgs.length / ORG_PAGE_SIZE));
  const orgPageRows = sortedOrgs.slice((orgPage - 1) * ORG_PAGE_SIZE, orgPage * ORG_PAGE_SIZE);

  function toggleInsuredSort(col: string) {
    setInsuredSort(s => !s || s.col !== col ? { col, dir: 'asc' } : s.dir === 'asc' ? { col, dir: 'desc' } : null);
    setInsuredPage(1);
  }
  function toggleOrgSort(col: string) {
    setOrgSort(s => !s || s.col !== col ? { col, dir: 'asc' } : s.dir === 'asc' ? { col, dir: 'desc' } : null);
    setOrgPage(1);
  }

  // Policy Info field rules (OutSystems parity):
  // Editability is Producer-only across all three fields — a Client Admin (non-producer)
  // login sees these locked; only a Producer login can edit them (subject to the other
  // conditions below). "Required" is unaffected — it stays keyed off role/quick-quote as spec'd.
  // Effective Date — editable only for a producer, and only when not locked / HexCat not Approved.
  const isEffectiveDateEditable = form.isHBProducer && !form.lockSubmission && String(form.hexCatStatus).toUpperCase() !== 'APPROVED';
  // Policy Term — mandatory for every role except a producer; editable only for a producer (not locked).
  const isPolicyTermRequired = !form.isHBProducer;
  const isPolicyTermEditable = form.isHBProducer && !form.lockSubmission;
  // Expiration Date — mandatory unless (producer AND not a quick quote); editable only for
  // a producer, on a Short-Term policy, not locked.
  const isExpirationDateRequired = !form.isHBProducer || form.isQuickQuote;
  const isExpirationDateEditable = form.policyTerm === 'Short-Term' && !form.lockSubmission && form.isHBProducer;
  // Type of Primary Insured — mandatory for every role except a producer; editable when
  // (quick quote, OR is a producer) and not locked — flipped to Producer-only editability,
  // same convention as Effective Date/Policy Term/Expiration Date above.
  const isPrimaryInsuredTypeRequired = !form.isHBProducer;
  const isPrimaryInsuredTypeEditable = (form.isQuickQuote || form.isHBProducer) && !form.lockSubmission;
  // Brokerage Firm / Producer Name — same editability shape as Type of Primary Insured.
  const isBrokerageFirmEditable = (form.isQuickQuote || form.isHBProducer) && !form.lockSubmission;
  const isProducerNameEditable = (form.isQuickQuote || form.isHBProducer) && !form.lockSubmission;

  // Primary Named Insured / Organization fields (OutSystems parity).
  const isEnableForRenewal = form.screenCode === 'RENEWALINDIVIDUAL' || form.screenCode === 'RENEWALBUSINESS';
  const hexCatApproved = String(form.hexCatStatus).toUpperCase() === 'APPROVED';
  // First/Middle/Last Name, Organisation Name, Doing Business As all share this shape —
  // same "producer-only editable" flip applied to Type of Primary Insured/Brokerage/Producer.
  const nameFieldsEditable = isEnableForRenewal ||
    ((form.isQuickQuote || form.isHBProducer) && !form.lockSubmission && !hexCatApproved);
  const isFirstNameRequired = !form.isHBProducer || form.isQuickQuote;
  const isLastNameRequired = !form.isHBProducer || form.isQuickQuote;
  const isOrganisationNameRequired = !form.isHBProducer || form.isQuickQuote;
  // Are you 65 or older? — literal (no flip; the source formula already branches directly
  // on isHBProducer rather than "not producer", so there's nothing to invert).
  const isAge65NotEditable =
    (!isEnableForRenewal && ((form.isQuickQuote ? false : form.isHBProducer) || form.lockSubmission)) || hexCatApproved;
  const isAge65Editable = !isAge65NotEditable;

  // Mailing Address — these branch explicitly per role in the source (If(isHBProducer, A, B)),
  // so there's no simple negation to flip; implemented literally.
  const manualEntryRoleBranch = form.isHBProducer ? (form.isQuickQuote || hexCatApproved) : !hexCatApproved;
  const isGoogleAddressSearchEditable = !isManualAddress && (form.isHBProducer ? form.isQuickQuote : hexCatApproved) && !form.lockSubmission;
  const isEnterAddressManuallyEditable = manualEntryRoleBranch && !form.lockSubmission;
  const isAddressLine1Required = !form.isHBProducer;
  const isManualAddressFieldsEditable = isManualAddress && manualEntryRoleBranch && !form.lockSubmission;

  // Contact Information (Telephone/Extension/Alt Phone/Email) — literal, same shape family.
  const isContactInfoEditable = (form.isHBProducer ? (form.isQuickQuote || hexCatApproved) : hexCatApproved) && !form.lockSubmission;

  return (
    <div>
      <div className="wizard-section">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div className="wizard-section-subtitle">Policy Details</div>
            <div className="form-grid">
              <div>
                <Field label="Effective Date" required><Input value={form.effectiveDate} onChange={v => { set('effectiveDate', v); if (v) setErrors(e => ({ ...e, effectiveDate: '' })); }} disabled={!isEffectiveDateEditable} /></Field>
                {errors.effectiveDate && <div className="field-error">{errors.effectiveDate}</div>}
              </div>
              <div>
                <Field label="Policy Term" required={isPolicyTermRequired}><FSelect value={form.policyTerm} onChange={v => { set('policyTerm', v); if (v) setErrors(e => ({ ...e, policyTerm: '' })); }} options={['Annual', 'Short-Term']} disabled={!isPolicyTermEditable} /></Field>
                {errors.policyTerm && <div className="field-error">{errors.policyTerm}</div>}
              </div>
              <Field label="Expiration Date" required={isExpirationDateRequired}><Input value={form.expirationDate} onChange={v => set('expirationDate', v)} disabled={!isExpirationDateEditable} /></Field>
              <Field label="Quote Creation Date"><Input value={todayFormatted()} disabled /></Field>
            </div>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <div>
                <Field label="Type of Primary Insured" required={isPrimaryInsuredTypeRequired}><FSelect value={form.insuredType} onChange={v => { handlePrimaryInsuredTypeChange(v); if (v) setErrors(e => ({ ...e, insuredType: '' })); }} options={PRIMARY_INSURED_TYPES} disabled={!isPrimaryInsuredTypeEditable} /></Field>
                {errors.insuredType && <div className="field-error">{errors.insuredType}</div>}
              </div>
            </div>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <div>
                <Field label="Brokerage Firm" required><FSelect value={form.brokerageFirm} onChange={handleBrokerageFirmChange} options={intermediaryNames} disabled={!isBrokerageFirmEditable} /></Field>
                {errors.brokerageFirmId && <div className="field-error">{errors.brokerageFirmId}</div>}
              </div>
              <div>
                <Field label="Producer Name" required><FSelect value={form.producerName} onChange={handleProducerChange} options={producerNames} disabled={producerNames.length === 0 || !isProducerNameEditable} /></Field>
                {errors.producerId && <div className="field-error">{errors.producerId}</div>}
              </div>
            </div>
          </div>

          <div>
            <div className="wizard-section-subtitle">{isPersonType ? 'Primary Named Insured' : 'Primary Organization'}</div>
            {isPersonType ? (
              <>
                <div className="form-grid-3">
                  <div>
                    <Field label="First Name" required={isFirstNameRequired}><Input value={form.firstName} onChange={v => { set('firstName', v); if (v) setErrors(e => ({ ...e, firstName: '' })); }} placeholder="First Name" disabled={!nameFieldsEditable} /></Field>
                    {errors.firstName && <div className="field-error">{errors.firstName}</div>}
                  </div>
                  <Field label="Middle Name / Initial"><Input value={form.middleName} onChange={v => set('middleName', v)} placeholder="Middle Name / Initial" disabled={!nameFieldsEditable} /></Field>
                  <div>
                    <Field label="Last Name" required={isLastNameRequired}><Input value={form.lastName} onChange={v => { set('lastName', v); if (v) setErrors(e => ({ ...e, lastName: '' })); }} placeholder="Last Name" disabled={!nameFieldsEditable} /></Field>
                    {errors.lastName && <div className="field-error">{errors.lastName}</div>}
                  </div>
                </div>
                <div className="form-grid" style={{ marginTop: 12 }}>
                  <div>
                    <Field label="Are you 65 or older ?" required><FSelect value={form.age65OrOlder} onChange={v => { set('age65OrOlder', v); if (v) setErrors(e => ({ ...e, age65OrOlder: '' })); }} options={['Yes', 'No']} disabled={!isAge65Editable} /></Field>
                    {errors.age65OrOlder && <div className="field-error">{errors.age65OrOlder}</div>}
                  </div>
                </div>
              </>
            ) : (
              <div className="form-grid">
                <div>
                  <Field label="Organization Name" required={isOrganisationNameRequired}><Input value={form.organizationName} onChange={v => { set('organizationName', v); if (v) setErrors(e => ({ ...e, organizationName: '' })); }} disabled={!nameFieldsEditable} /></Field>
                  {errors.organizationName && <div className="field-error">{errors.organizationName}</div>}
                </div>
                <Field label="Doing Business As"><Input value={form.doingBusinessAs} onChange={v => set('doingBusinessAs', v)} disabled={!nameFieldsEditable} /></Field>
              </div>
            )}

            <div className="source-contact-panel">
              <div className="wizard-section-subtitle source-panel-title">Mailing Address</div>
              <div className="form-group form-full source-google-search">
                <label>Google Address Search</label>
                <GoogleAddressAutocomplete onSelect={f => {
                  set('addressLine1', f.addressLine1);
                  set('addressLine2', f.addressLine2 ?? '');
                  set('city', f.city);
                  set('state', f.state);
                  set('county', f.county);
                  set('zip', f.zip);
                  set('country', f.country);
                  set('latitude', f.latitude);
                  set('longitude', f.longitude);
                }} disabled={!isGoogleAddressSearchEditable} clearToken={addressSearchClearToken} />
              </div>
              <label className="check-row source-manual-check">
                <input type="checkbox" checked={isManualAddress} onChange={e => handleManualAddressToggle(e.target.checked)} disabled={!isEnterAddressManuallyEditable} /> Enter Address Manually
              </label>
              <div className="source-address-grid source-address-two">
                <Field label="Address Line 1" required={isAddressLine1Required}><Input value={form.addressLine1} onChange={v => set('addressLine1', v)} placeholder="Address Line 1" disabled={!isManualAddressFieldsEditable} /></Field>
                <Field label={<span>Address Line 2 <span className="source-info-icon">(i)</span></span>}><Input value={form.addressLine2} onChange={v => set('addressLine2', v)} disabled={!isManualAddressFieldsEditable} /></Field>
              </div>
              <div className="source-address-grid source-address-three">
                <div>
                  <Field label="Country" required><FSelect value={form.country} onChange={handleCountryChange} options={['United States', 'Canada']} disabled={!isManualAddressFieldsEditable} /></Field>
                  {errors.country && <div className="field-error">{errors.country}</div>}
                </div>
                <div>
                  <Field label="State" required><FSelect value={form.state} onChange={v => { set('state', v); if (v) setErrors(e => ({ ...e, state: '' })); }} options={stateOptions} disabled={!isManualAddress || !form.country} /></Field>
                  {errors.state && <div className="field-error">{errors.state}</div>}
                </div>
                <div>
                  <Field label="City" required><Input value={form.city} onChange={v => { set('city', v); if (v) setErrors(e => ({ ...e, city: '' })); }} placeholder="City" disabled={!isManualAddress} /></Field>
                  {errors.city && <div className="field-error">{errors.city}</div>}
                </div>
              </div>
              <div className="source-address-grid source-address-two source-address-short">
                <Field label="County"><Input value={form.county} onChange={v => set('county', v)} placeholder="County" disabled={!isManualAddress || isLoggedInUserProducer} /></Field>
                <div>
                  <Field label="Zip Code" required><Input value={form.zip} onChange={v => { set('zip', v); if (v) setErrors(e => ({ ...e, zip: '' })); }} placeholder="Zip Code" disabled={!isManualAddress || isLoggedInUserProducer} /></Field>
                  {errors.zip && <div className="field-error">{errors.zip}</div>}
                </div>
              </div>
              <div className="source-address-grid source-address-two source-address-short">
                <Field label="Latitude"><Input value={form.latitude} onChange={v => set('latitude', v)} placeholder="Latitude" disabled={!isManualAddress || isLoggedInUserProducer} /></Field>
                <Field label="Longitude"><Input value={form.longitude} onChange={v => set('longitude', v)} placeholder="Longitude" disabled={!isManualAddress || isLoggedInUserProducer} /></Field>
              </div>

              <div className="wizard-section-subtitle source-contact-title">Contact Information</div>
              {isPersonType ? (
                <>
                  <div className="source-address-grid source-address-two source-phone-grid">
                    <Field label="Telephone Number">
                      <div className="phone-input-wrap">
                        <PhoneCountrySelect value={form.phoneCountry} onChange={v => set('phoneCountry', v)} disabled={!isContactInfoEditable} />
                        <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(###) ###-####" disabled={!isContactInfoEditable} />
                      </div>
                    </Field>
                    <Field label="Alternative Telephone Number">
                      <div className="phone-input-wrap">
                        <PhoneCountrySelect value={form.altPhoneCountry} onChange={v => set('altPhoneCountry', v)} disabled={!isContactInfoEditable} />
                        <input value={form.altPhone} onChange={e => set('altPhone', e.target.value)} placeholder="(###) ###-####" disabled={!isContactInfoEditable} />
                      </div>
                    </Field>
                  </div>
                  <div className="source-address-grid source-address-two source-email-grid">
                    <Field label="Email ID"><Input value={form.email} onChange={v => set('email', v)} placeholder="Email ID" disabled={!isContactInfoEditable} /></Field>
                  </div>
                </>
              ) : (
                <>
                  <div className="source-address-grid source-address-two source-phone-grid">
                    <Field label="Telephone Number">
                      <div className="phone-input-wrap">
                        <PhoneCountrySelect value={form.phoneCountry} onChange={v => set('phoneCountry', v)} disabled={!isContactInfoEditable} />
                        <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(###) ###-####" disabled={!isContactInfoEditable} />
                      </div>
                    </Field>
                    <Field label="Extension"><Input value={form.extension} onChange={v => set('extension', v)} disabled={!isContactInfoEditable} /></Field>
                  </div>
                  <div className="source-address-grid source-address-two source-phone-grid">
                    <Field label="Alternative Telephone Number">
                      <div className="phone-input-wrap">
                        <PhoneCountrySelect value={form.altPhoneCountry} onChange={v => set('altPhoneCountry', v)} disabled={!isContactInfoEditable} />
                        <input value={form.altPhone} onChange={e => set('altPhone', e.target.value)} placeholder="(###) ###-####" disabled={!isContactInfoEditable} />
                      </div>
                    </Field>
                    <Field label="Email ID"><Input value={form.email} onChange={v => set('email', v)} placeholder="Email ID" disabled={!isContactInfoEditable} /></Field>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Block 1: Additional Named Insured(s) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
      {showAdditionalNamedInsured && (
        <div className="policy-info-table-section additional-insured-section">
          <div className="section-table-header">
            <span className="section-table-header-label">Additional Named Insured(s)</span>
            {addVisible && (
              <button className="add-insured-btn" disabled={addDisabled} onClick={() => setInsuredModal({ mode: 'add' })}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle' }}><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                &nbsp;Add
              </button>
            )}
          </div>
          <table className="data-table policy-info-grid additional-insured-grid">
            <thead>
              <tr>
                <SortTh label="Name"                     col="firstName"    sortCol={insuredSort?.col ?? null} sortDir={insuredSort?.dir ?? 'asc'} onSort={() => toggleInsuredSort('firstName')} />
                <SortTh label="Relationship"             col="relationship" sortCol={insuredSort?.col ?? null} sortDir={insuredSort?.dir ?? 'asc'} onSort={() => toggleInsuredSort('relationship')} />
                <SortTh label="Telephone Number"         col="telephone"    sortCol={insuredSort?.col ?? null} sortDir={insuredSort?.dir ?? 'asc'} onSort={() => toggleInsuredSort('telephone')} />
                <SortTh label="Email ID"                 col="email"        sortCol={insuredSort?.col ?? null} sortDir={insuredSort?.dir ?? 'asc'} onSort={() => toggleInsuredSort('email')} />
                <SortTh label="Alternative Telephone No" col="altTelephone" sortCol={insuredSort?.col ?? null} sortDir={insuredSort?.dir ?? 'asc'} onSort={() => toggleInsuredSort('altTelephone')} />
                <SortTh label="Insured Type"             col="insuredType"  sortCol={insuredSort?.col ?? null} sortDir={insuredSort?.dir ?? 'asc'} onSort={() => toggleInsuredSort('insuredType')} />
                <SortTh label="DBA Name"                 col="dbaName"      sortCol={insuredSort?.col ?? null} sortDir={insuredSort?.dir ?? 'asc'} onSort={() => toggleInsuredSort('dbaName')} />
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {insuredPageRows.length === 0 && (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="#d1d5db"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 8 }}>No data available</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Please add data to get started.</div>
                  </div>
                </td></tr>
              )}
              {insuredPageRows.map(ai => (
                <tr key={ai.id}>
                  <td>{[ai.firstName, ai.middleName, ai.lastName].filter(Boolean).join(' ')}</td>
                  <td>{ai.relationship || '-'}</td>
                  <td>{ai.telephone || '-'}</td>
                  <td>{ai.email || '-'}</td>
                  <td>{ai.altTelephone || '-'}</td>
                  <td>{ai.insuredType}</td>
                  <td>{ai.dbaName || '-'}</td>
                  <td>
                    <div className="policy-action-cell">
                      <button className="action-btn" title={canEditManualRow(ai) ? 'Edit' : 'Edit unavailable'} disabled={!canEditManualRow(ai)} onClick={() => setInsuredModal({ mode: 'edit', item: ai })}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                      </button>
                      <button className="action-btn action-btn-danger" title={canEditManualRow(ai) ? 'Delete' : 'Delete unavailable'} disabled={!canEditManualRow(ai)} onClick={() => setInsuredDeleteId(ai.id)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            <span>Showing {insuredPageRows.length} records from {sortedInsureds.length} Results</span>
            <div className="pagination">
              <button className="page-btn" disabled={insuredPage <= 1} onClick={() => setInsuredPage(p => p - 1)}>&#8249;</button>
              {Array.from({ length: insuredTotalPages }, (_, i) => (
                <button key={i+1} className={`page-btn${insuredPage === i+1 ? ' active' : ''}`} onClick={() => setInsuredPage(i+1)}>{i+1}</button>
              ))}
              <button className="page-btn" disabled={insuredPage >= insuredTotalPages} onClick={() => setInsuredPage(p => p + 1)}>&#8250;</button>
            </div>
          </div>
        </div>
      )}

      {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Block 2: Additional Organization(s) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
      <div className="policy-info-table-section additional-org-section">
        <div className="section-table-header">
          <span className="section-table-header-label">Additional Organization(s)</span>
          {addVisible && (
            <button className="add-insured-btn" disabled={addDisabled} onClick={() => setOrgModal({ mode: 'add' })}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle' }}><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
              &nbsp;Add
            </button>
          )}
        </div>
        <table className="data-table policy-info-grid additional-org-grid">
          <thead>
            <tr>
              <SortTh label="Org Name"                   col="orgName"          sortCol={orgSort?.col ?? null} sortDir={orgSort?.dir ?? 'asc'} onSort={() => toggleOrgSort('orgName')} />
              <SortTh label="Org Type"                   col="orgType"          sortCol={orgSort?.col ?? null} sortDir={orgSort?.dir ?? 'asc'} onSort={() => toggleOrgSort('orgType')} />
              <SortTh label="Telephone Number"           col="telephone"        sortCol={orgSort?.col ?? null} sortDir={orgSort?.dir ?? 'asc'} onSort={() => toggleOrgSort('telephone')} />
              <SortTh label="Extension"                  col="extension"        sortCol={orgSort?.col ?? null} sortDir={orgSort?.dir ?? 'asc'} onSort={() => toggleOrgSort('extension')} />
              <SortTh label="Alternative Telephone No"   col="altTelephone"     sortCol={orgSort?.col ?? null} sortDir={orgSort?.dir ?? 'asc'} onSort={() => toggleOrgSort('altTelephone')} />
              <SortTh label="Email ID"                   col="email"            sortCol={orgSort?.col ?? null} sortDir={orgSort?.dir ?? 'asc'} onSort={() => toggleOrgSort('email')} />
              <SortTh label="Contact Name"               col="contactFirstName" sortCol={orgSort?.col ?? null} sortDir={orgSort?.dir ?? 'asc'} onSort={() => toggleOrgSort('contactFirstName')} />
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orgPageRows.length === 0 && (
              <tr><td colSpan={8}>
                <div className="empty-state">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="#d1d5db"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 8 }}>No data available</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Please add data to get started.</div>
                </div>
              </td></tr>
            )}
            {orgPageRows.map(org => (
              <tr key={org.id}>
                <td>{org.orgName}</td>
                <td>{org.orgType}</td>
                <td>{org.telephone || '-'}</td>
                <td>{org.extension || '-'}</td>
                <td>
                  {org.altTelephone
                    ? <a href={`tel:${org.altTelephone.replace(/\D/g, '')}`} style={{ color: '#1a3b6b', textDecoration: 'none' }}>{org.altTelephone}</a>
                    : '-'}
                </td>
                <td>{org.email || '-'}</td>
                <td>{[org.contactFirstName, org.contactMiddleName, org.contactLastName].filter(Boolean).join(' ') || '-'}</td>
                <td>
                  <div className="policy-action-cell">
                    <button className="action-btn" title={canEditManualRow(org) ? 'Edit' : 'Edit unavailable'} disabled={!canEditManualRow(org)} onClick={() => setOrgModal({ mode: 'edit', item: org })}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                    <button className="action-btn action-btn-danger" title={canEditManualRow(org) ? 'Delete' : 'Delete unavailable'} disabled={!canEditManualRow(org)} onClick={() => setOrgDeleteId(org.id)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          <span>Showing {orgPageRows.length} records from {sortedOrgs.length} Results</span>
          <div className="pagination">
            <button className="page-btn" disabled={orgPage <= 1} onClick={() => setOrgPage(p => p - 1)}>&#8249;</button>
            {Array.from({ length: orgTotalPages }, (_, i) => (
              <button key={i+1} className={`page-btn${orgPage === i+1 ? ' active' : ''}`} onClick={() => setOrgPage(i+1)}>{i+1}</button>
            ))}
            <button className="page-btn" disabled={orgPage >= orgTotalPages} onClick={() => setOrgPage(p => p + 1)}>&#8250;</button>
          </div>
        </div>
      </div>

      {showAddressModeConfirm && (
        <div className="address-confirm-overlay">
          <div className="address-confirm-dialog" role="dialog" aria-modal="true">
            <div className="address-confirm-icon">!</div>
            <div className="address-confirm-message">Unchecking this option will remove the address you entered. Do you want to continue?</div>
            <div className="address-confirm-actions">
              <button className="address-confirm-btn address-confirm-cancel" onClick={() => setShowAddressModeConfirm(false)}>Cancel</button>
              <button className="address-confirm-btn address-confirm-continue" onClick={continueGoogleAddressMode}>Continue</button>
            </div>
          </div>
        </div>
      )}
      {insuredModal && (
        <NameInsuredModal
          title={insuredModal.mode === 'add' ? 'Add Additional Named Insured' : 'Edit Additional Named Insured'}
          initial={insuredModal.item ?? { firstName: '', middleName: '', lastName: '', relationship: 'Spouse', telephone: '', altTelephone: '', email: '', insuredType: 'Individual', dbaName: '' }}
          onSave={v => {
            if (insuredModal.mode === 'add') {
              setAdditionalInsureds(prev => [...prev, { id: Date.now(), ...v, isManual: true }]);
            } else {
              setAdditionalInsureds(prev => prev.map(x => x.id === insuredModal.item!.id ? { id: insuredModal.item!.id, ...v } : x));
            }
            setInsuredModal(null);
          }}
          onClose={() => setInsuredModal(null)}
          locked={locked}
        />
      )}
      {orgModal && (
        <OrgModal
          title={orgModal.mode === 'add' ? 'Add Additional Organization' : 'Edit Additional Organization'}
          initial={orgModal.item ?? { orgName: '', orgType: '', telephone: '', extension: '', altTelephone: '', email: '', contactFirstName: '', contactMiddleName: '', contactLastName: '' }}
          onSave={v => {
            if (orgModal.mode === 'add') {
              setAdditionalOrgs(prev => [...prev, { id: Date.now(), ...v, isManual: true }]);
            } else {
              setAdditionalOrgs(prev => prev.map(x => x.id === orgModal.item!.id ? { id: orgModal.item!.id, ...v } : x));
            }
            setOrgModal(null);
          }}
          onClose={() => setOrgModal(null)}
          locked={locked}
        />
      )}
      {!locked && insuredDeleteId !== null && <DeleteConfirmModal onConfirm={() => { setAdditionalInsureds(prev => prev.filter(x => x.id !== insuredDeleteId)); setInsuredDeleteId(null); }} onCancel={() => setInsuredDeleteId(null)} />}
      {!locked && orgDeleteId !== null && <DeleteConfirmModal onConfirm={() => { setAdditionalOrgs(prev => prev.filter(x => x.id !== orgDeleteId)); setOrgDeleteId(null); }} onCancel={() => setOrgDeleteId(null)} />}
    </div>
  );
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Step 1: Location ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
function StepLocation({ form, set, locations, setLocations }: {
  form: FormState;
  set: (k: keyof FormState, v: any) => void;
  locations: LocationItem[];
  setLocations: React.Dispatch<React.SetStateAction<LocationItem[]>>;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const excludedScreen = ['ENDORSEMENTINDIVIDUAL', 'ENDORSEMENTBUSINESS', 'RENEWALINDIVIDUAL', 'RENEWALBUSINESS'].includes(String(form.screenCode).toUpperCase());
  const approved = String(form.hexCatStatus).toUpperCase() === 'APPROVED';
  const checkboxEnabled = form.isHBProducer
    ? form.isQuickQuote && !approved && !form.lockSubmission && !excludedScreen
    : (!form.isDataLocationDisabled || form.isAddressDataFetched) && !approved && !form.lockSubmission && !excludedScreen;
  const canEditLocation = checkboxEnabled;
  const canAddLocation = locations.length === 0 && checkboxEnabled && !form.locationSameAsMailing;

  function mailingLocation(): LocationItem {
    return {
      id: Date.now(),
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2,
      country: form.country || 'United States',
      state: form.state,
      city: form.city,
      county: form.county,
      zip: form.zip,
      latitude: form.latitude,
      longitude: form.longitude,
    };
  }

  function handleSameAsMailing(checked: boolean) {
    if (!checkboxEnabled) return;
    set('locationSameAsMailing', checked);
    setEditId(null);
    setDeleteId(null);
    setShowAdd(false);
    if (checked) {
      setLocations([mailingLocation()]);
    } else {
      setLocations([]);
    }
  }

  function addLocation(loc: Omit<LocationItem, 'id'>) {
    setLocations([{ id: Date.now(), ...loc }]);
    setShowAdd(false);
  }
  function editLocation(id: number, loc: Omit<LocationItem, 'id'>) {
    if (!canEditLocation) return;
    setLocations(prev => prev.map(l => l.id === id ? { id, ...loc } : l));
    setEditId(null);
  }
  function deleteLocation() {
    if (!canEditLocation) { setDeleteId(null); return; }
    setLocations(prev => prev.filter(l => l.id !== deleteId));
    set('locationSameAsMailing', false);
    setDeleteId(null);
  }

  const editingLoc = canEditLocation ? locations.find(l => l.id === editId) : undefined;

  return (
    <div className="risk-location-screen">
      <div className="risk-location-header">
        <label className="check-row">
          <input type="checkbox" checked={form.locationSameAsMailing}
            disabled={!checkboxEnabled}
            onChange={e => handleSameAsMailing(e.target.checked)} />
          Location Address same as Mailing Address
        </label>
        <button className="add-btn" disabled={!canAddLocation} onClick={() => canAddLocation && setShowAdd(true)}>&#43; Add Location</button>
      </div>

      {locations.length === 0 && (
        <div className="risk-location-empty">
          <div className="risk-location-empty-title">No Data Available</div>
        </div>
      )}

      {locations.map((loc, idx) => (
        <div key={loc.id} className="location-card risk-location-card">
          <div className="risk-location-card-title">Location - {idx + 1}</div>
          <LocationPhotoPanel loc={loc} compact />

          <div className="risk-location-fields">
            <div className="risk-location-field risk-location-field-full"><div className="loc-field-label">Address Line 1</div><div className="loc-field-val">{loc.addressLine1 || '-'}</div></div>
            <div className="risk-location-field risk-location-field-full"><div className="loc-field-label">Address Line 2</div><div className="loc-field-val">{loc.addressLine2 || '-'}</div></div>
            <div className="risk-location-field"><div className="loc-field-label">Country</div><div className="loc-field-val">{loc.country || '-'}</div></div>
            <div className="risk-location-field"><div className="loc-field-label">State</div><div className="loc-field-val">{loc.state || '-'}</div></div>
            <div className="risk-location-field"><div className="loc-field-label">City</div><div className="loc-field-val">{loc.city || '-'}</div></div>
            <div className="risk-location-field"><div className="loc-field-label">County</div><div className="loc-field-val">{loc.county || '-'}</div></div>
            <div className="risk-location-field"><div className="loc-field-label">Zip Code</div><div className="loc-field-val">{loc.zip || '-'}</div></div>
            <div className="risk-location-field"><div className="loc-field-label">Latitude</div><div className="loc-field-val">{loc.latitude || '-'}</div></div>
            <div className="risk-location-field"><div className="loc-field-label">Longitude</div><div className="loc-field-val">{loc.longitude || '-'}</div></div>
          </div>

          <LocationMapPanel loc={loc} compact />

          <div className="location-card-actions">
            <button className="btn-icon" title="Edit" disabled={!canEditLocation} onClick={() => canEditLocation && setEditId(loc.id)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button className="btn-icon" title="Delete" disabled={!canEditLocation} style={{ color: canEditLocation ? '#dc2626' : undefined }} onClick={() => canEditLocation && setDeleteId(loc.id)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </div>
      ))}

      {showAdd && canAddLocation && (
        <LocationModal
          title="Add Location"
          initial={{ addressLine1: '', addressLine2: '', country: 'United States', state: '', city: '', county: '', zip: '', latitude: '', longitude: '' }}
          onSave={addLocation}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editingLoc && (
        <LocationModal
          title="Add Location"
          initial={editingLoc}
          onSave={loc => editLocation(editId!, loc)}
          onClose={() => setEditId(null)}
        />
      )}
      {deleteId !== null && canEditLocation && (
        <DeleteConfirmModal onConfirm={deleteLocation} onCancel={() => setDeleteId(null)} />
      )}
    </div>
  );
}

// Step 2: Risk Information ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
function StepRiskInfo({ form, set, mortgages, setMortgages, isLoggedInUserProducer, isRenewalQuote = false }: {
  form: FormState;
  set: (k: keyof FormState, v: any) => void;
  mortgages: MortgageItem[];
  setMortgages: React.Dispatch<React.SetStateAction<MortgageItem[]>>;
  isLoggedInUserProducer: boolean;
  isRenewalQuote?: boolean;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const isNewBusiness = form.screenCode === 'NEWBUSINESSINDIVIDUAL' || form.screenCode === 'NEWBUSINESSBUSINESS';
  const isRenewal = form.screenCode === 'RENEWALINDIVIDUAL' || form.screenCode === 'RENEWALBUSINESS';
  const isEndorsement = form.screenCode === 'ENDORSEMENTINDIVIDUAL' || form.screenCode === 'ENDORSEMENTBUSINESS';
  const isBulkUploaded = form.isBulkUploaded || form.isQuickQuote;
  const isHBProducer = form.isHBProducer;

  // Show HexCat panel based on user type:
  // - HBIS Producer: Show for ENDORSEMENT or RENEWAL only
  // - Client: Show for ENDORSEMENT or RENEWAL only (HexCatStatus checks removed)
  const showHexCatPanel = isHBProducer
    ? (isRenewal || isEndorsement)
    : (isRenewal || isEndorsement);

  // Disable fields for bulk uploaded quotes or producer users (except for new business)
  const isFieldDisabled = isLoggedInUserProducer || (isBulkUploaded && !isNewBusiness);

  // Roof fields: disabled ONLY for ENDORSEMENT quotes (applies to both client and producer)
  const roofFieldsDisabled = isEndorsement;

  // Location Flood Information fields enable logic:
  // Part 1: User type check
  const userTypeCheck = isHBProducer
    ? (form.isQuickQuote && form.hexCatStatus !== 'APPROVED')
    : (form.hexCatStatus === 'APPROVED' || form.hexCatStatus === 'NOT APPROVED');

  // Location Flood fields enabled if all conditions are true:
  const locationFloodFieldsEnabled =
    userTypeCheck &&
    !(isEndorsement || isRenewal) &&
    !form.lockSubmission;

  // Mortgage Information ADD button enabled logic:
  const mortgageAddButtonEnabled = (
    isHBProducer
      ? (form.hexCatStatus === 'APPROVED' || form.isQuickQuote || isEndorsement || isRenewal)
      : (form.hexCatStatus === 'APPROVED' || isEndorsement || isRenewal)
  ) && !form.lockSubmission;

  // Risk Information field rules (OutSystems parity) — literal, these already branch
  // explicitly per role (If(isHBISProducer, A, B)) so there's no simple negation to flip.
  const hexCatUpper = String(form.hexCatStatus).toUpperCase();
  const hexCatApproved = hexCatUpper === 'APPROVED';
  const hexCatNotApproved = hexCatUpper === 'NOT APPROVED';
  // Disabled once a real (non-blank, non-"None") flood zone is already known.
  const isDisableFloodElevationField = form.floodZone !== '' && form.floodZone !== 'None';
  const isBuildingFloodElevationRequired = form.floodZone !== 'None' && !form.isHBProducer;
  const isBuildingFloodElevationEditable =
    (form.isHBProducer ? (form.isQuickQuote && !hexCatApproved) : (hexCatApproved || hexCatNotApproved))
    && !form.lockSubmission
    && !isDisableFloodElevationField;
  // Building Type / Building Description share the same shape.
  const isBuildingTypeAndDescriptionRequired =
    !form.isHBProducer && (form.isQuickQuote && (form.hexCatStatus === 'APPROVED' && form.floodZone !== 'None'));
  const isBuildingTypeAndDescriptionEditable =
    (form.isHBProducer ? (form.isQuickQuote && !hexCatApproved) : (hexCatApproved || hexCatNotApproved))
    && !form.lockSubmission;
  // Roof Year / Roof Construction Type — mandatory only once HexCat is Approved; never editable.
  const isRoofFieldRequired = form.hexCatStatus === 'APPROVED';

  function addMortgage(m: Omit<MortgageItem, 'id'>) {
    setMortgages(prev => [...prev, { id: Date.now(), ...m }]);
    setShowAdd(false);
  }
  function saveMortgage(id: number, m: Omit<MortgageItem, 'id'>) {
    setMortgages(prev => prev.map(x => x.id === id ? { id, ...m } : x));
    setEditId(null);
    setViewId(null);
  }
  function deleteMortgage() {
    setMortgages(prev => prev.filter(x => x.id !== deleteId));
    setDeleteId(null);
  }

  const editingM = mortgages.find(m => m.id === editId);
  const viewingM = mortgages.find(m => m.id === viewId);

  const hexcatFields = [
    ['Year Built', '-'],
    ['Construction Type', '-'],
    ['Foundation Type', '-'],
    ['Number of Stories', '-'],
    ['Square Footage (sq ft)', '-'],
    ['Residence Type', '-'],
    ['Roof Age', '-'],
    ['Roof Architectural Type', '-'],
    ['Roof Covering / Material', '-'],
    ['Presence of Basement', '-'],
    ['HexCat Status', form.hexCatStatus || '-'],
    ['Status Time Stamp', form.hexCatTimestamp || '-'],
    ['Approval Counter', '-'],
    ['Non Approval Counter', form.nonApprovalCounter ? String(form.nonApprovalCounter) : '-'],
    ['Approval Expiration Date', '-'],
  ];

  return (
    <div className="risk-info-screen">
      <div className="risk-info-panel">
        <div className="risk-info-left">
          <div className="risk-info-section-title">Location Flood Information</div>
          <div className="risk-info-field-stack">
            <Field label="Building Flood Elevation" required={isBuildingFloodElevationRequired}>
              <FSelect value={form.buildingFloodElevation} onChange={v => set('buildingFloodElevation', v)} options={HB_BUILDING_FLOOD_ELEVATION_OPTIONS} placeholder="Select" disabled={!isBuildingFloodElevationEditable} />
            </Field>
            <Field label="Building Type" required={isBuildingTypeAndDescriptionRequired}>
              <FSelect value={form.buildingType} onChange={v => set('buildingType', v)} options={HB_BUILDING_TYPE_OPTIONS} placeholder="Select" disabled={!isBuildingTypeAndDescriptionEditable} />
            </Field>
            <Field label="Building Description" required={isBuildingTypeAndDescriptionRequired}>
              <FSelect value={form.buildingDescription} onChange={v => set('buildingDescription', v)} options={HB_BUILDING_DESCRIPTION_OPTIONS} placeholder="Select" disabled={!isBuildingTypeAndDescriptionEditable} />
            </Field>
          </div>

          <div className="risk-info-section-title risk-info-roof-title">Roof Characteristics</div>
          <div className="risk-info-field-stack">
            <Field label="Roof Year" required={isRoofFieldRequired}><Input value={form.roofYear} onChange={v => set('roofYear', v)} disabled={roofFieldsDisabled} /></Field>
            <Field label="Roof Construction Type" required={isRoofFieldRequired}>
              <FSelect value={form.roofConstructionType} onChange={v => set('roofConstructionType', v)} options={HB_ROOF_CONSTRUCTION_TYPE_OPTIONS} placeholder="Select" disabled={roofFieldsDisabled} />

            </Field>
          </div>
        </div>

        {showHexCatPanel && (
          <div className="risk-info-right">
            <div className="hexcat-panel-title">HexCat Provided Risk Information Location</div>
            <div className="risk-info-hex-top">
              <Field label="Hex Zone ID Lower Resolution" required>
                <Input value={form.hexZoneLR} onChange={v => set('hexZoneLR', v)} disabled />
              </Field>
              <Field label="Hex Zone ID Higher Resolution" required>
                <Input value={form.hexZoneHR} onChange={v => set('hexZoneHR', v)} disabled />
              </Field>
              <Field label="Flood Zone" required>
                <FSelect value={form.floodZone} onChange={v => set('floodZone', v)} options={FLOOD_ZONE_OPTIONS} disabled />
              </Field>
            </div>
            <div className="risk-info-hex-grid">
              {hexcatFields.map(([label, value]) => (
                <div className="risk-info-readonly" key={label}>
                  <div className="risk-info-readonly-label">{label}</div>
                  <div className="risk-info-readonly-value">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="risk-info-mortgage-title">
        Mortgage Information
        <button className="add-btn" onClick={() => setShowAdd(true)} disabled={!mortgageAddButtonEnabled} style={{ opacity: mortgageAddButtonEnabled ? 1 : 0.5, cursor: mortgageAddButtonEnabled ? 'pointer' : 'not-allowed' }}>&#43; ADD</button>
      </div>
      <table className="mini-table risk-info-mortgage-table">
        <thead>
          <tr>
            <th>Mortgage Name</th><th>Loan Type</th><th>Address</th>
            <th>Telephone Number</th><th>Email ID</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {mortgages.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: 16, fontSize: 12 }}>No Data Available</td></tr>
          )}
          {mortgages.map(m => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>{m.loanType}</td>
              <td className="mortgage-address-cell">{mortgageAddressDisplay(m)}</td>
              <td>{mortgagePhoneDisplay(m)}</td>
              <td>{m.email}</td>
              <td>
                <div className="policy-action-cell">
                  <button
                    className="action-btn mortgage-view-action"
                    title={form.lockSubmission ? "Locked - Cannot view" : "View"}
                    onClick={() => !form.lockSubmission && setViewId(m.id)}
                    disabled={form.lockSubmission}
                    style={{
                      opacity: form.lockSubmission ? 0.3 : 1,
                      cursor: form.lockSubmission ? 'not-allowed' : 'pointer',
                      filter: form.lockSubmission ? 'grayscale(100%)' : 'none',
                      pointerEvents: form.lockSubmission ? 'none' : 'auto'
                    }}
                  >
                    &#128065;
                  </button>
                  <button
                    className="action-btn"
                    title={form.lockSubmission ? "Locked - Cannot delete" : "Delete"}
                    style={{
                      color: form.lockSubmission ? '#a8a8a8' : '#dc2626',
                      opacity: form.lockSubmission ? 0.3 : 1,
                      cursor: form.lockSubmission ? 'not-allowed' : 'pointer',
                      filter: form.lockSubmission ? 'grayscale(100%)' : 'none',
                      pointerEvents: form.lockSubmission ? 'none' : 'auto'
                    }}
                    onClick={() => !form.lockSubmission && setDeleteId(m.id)}
                    disabled={form.lockSubmission}
                  >
                    &#128465;
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showAdd && <MortgageModal mode="add" initial={EMPTY_MORTGAGE} onSave={addMortgage} onClose={() => setShowAdd(false)} />}
      {editingM && <MortgageModal mode="edit" initial={editingM} onSave={m => saveMortgage(editId!, m)} onClose={() => setEditId(null)} />}
      {viewingM && <MortgageModal mode="view" initial={viewingM} onSave={m => saveMortgage(viewId!, m)} onClose={() => setViewId(null)} onEdit={() => { setEditId(viewId); setViewId(null); }} />}
      {deleteId !== null && <DeleteConfirmModal onConfirm={deleteMortgage} onCancel={() => setDeleteId(null)} />}
    </div>
  );
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Step 3: Limits & Coverages ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
function StepLimits({ form, set, isLoggedInUserProducer }: { form: FormState; set: (k: keyof FormState, v: any) => void; isLoggedInUserProducer: boolean }) {
  // Source: quotes-review-limits-premium-summary-scrape.md (OutSystems observed values)
  const sinkholeOpts = ['Yes', 'Non-Transferred'];
  const noYesOpts = ['No', 'Yes'];

  const isNewBusiness = form.screenCode === 'NEWBUSINESSINDIVIDUAL' || form.screenCode === 'NEWBUSINESSBUSINESS';
  const isRenewal = form.screenCode === 'RENEWALINDIVIDUAL' || form.screenCode === 'RENEWALBUSINESS';
  const isEndorsement = form.screenCode === 'ENDORSEMENTINDIVIDUAL' || form.screenCode === 'ENDORSEMENTBUSINESS';
  const isBulkUploaded = form.isBulkUploaded;
  const isBusinessInsured = form.insuredType === 'Business';

  // Premium panel visibility:
  // Show if: Client user (NOT producer)
  // OR Producer user AND created new business quote (not bulk uploaded)
  // Hide for: Producer user AND bulk uploaded quote
  const showPremiumPanel = !isLoggedInUserProducer || (isLoggedInUserProducer && isNewBusiness && !isBulkUploaded);

  // Auto-calculate dependent limits when dwelling limit changes (only for non-bulk-uploaded quotes)
  useEffect(() => {
    if (!isBulkUploaded && form.dwellingLimit) {
      const dwellingVal = parseFloat(form.dwellingLimit.replace(/,/g, '')) || 0;
      if (dwellingVal > 0) {
        set('appurtenantLimit', Math.round(dwellingVal * 0.10).toString());
        set('personalAssetsLimit', Math.round(dwellingVal * 0.65).toString());
        set('occupancyDisruptionLimit', Math.round(dwellingVal * 0.25).toString());
      }
    }
  }, [form.dwellingLimit, set, isBulkUploaded]);

  // For bulk-uploaded quotes: disable all fields
  // For others: Enable for: new business, OR (HBIS producer + quick quote + hexcat not approved + submission not locked + not endorsement)
  const isFieldEnabled =
    !isBulkUploaded &&
    (isNewBusiness ||
      ((form.isHBProducer && form.isQuickQuote && form.hexCatStatus !== 'APPROVED') &&
        !form.lockSubmission &&
        !isEndorsement));

  // Dwelling Asset Limit: For bulk-uploaded, disable. Otherwise: new business, OR renewal, OR endorsement with specific policy conditions
  const isDwellingEnabled =
    !isBulkUploaded &&
    (isNewBusiness ||
      isRenewal ||
      (isEndorsement &&
        !form.isHBProducer &&
        form.isPolicyPaid &&
        !form.isPBEDone));

  // Prior Policy Period Premium: For bulk-uploaded, disable. Otherwise: new business OR (HBIS producer + submission not locked + not endorsement)
  const isPriorPremiumEnabled =
    !isBulkUploaded &&
    (isNewBusiness ||
      (form.isHBProducer &&
        !form.lockSubmission &&
        !isEndorsement));

  return (
    <div>
      <div className="form-grid-3">
        <Field label="Dwelling Asset Limit" required><Input value={form.dwellingLimit} onChange={v => set('dwellingLimit', v)} disabled={!isDwellingEnabled} /></Field>
        <Field label="Appurtenant Structure Assets Limit"><Input value={form.appurtenantLimit} onChange={v => set('appurtenantLimit', v)} disabled /></Field>
        <Field label="Personal Assets (Other than Fixed Assets) Limit"><Input value={form.personalAssetsLimit} onChange={v => set('personalAssetsLimit', v)} disabled /></Field>
        <Field label="Dwelling Occupancy Disruption Limit"><Input value={form.occupancyDisruptionLimit} onChange={v => set('occupancyDisruptionLimit', v)} disabled /></Field>
        <Field label="Total Insured Values"><Input value={formatNumberValue(totalInsuredValue(form))} disabled /></Field>
      </div>
      <div className="form-grid-3" style={{ marginTop: 14 }}>
        <Field label="Physical Damage Deductible" required><FSelect value={form.deductible} onChange={v => set('deductible', v)} options={['2,500','5,000','10,000','25,000']} disabled={!isFieldEnabled} /></Field>
        <Field label="Coverage Level"><FSelect value={form.coverageLevel} onChange={v => set('coverageLevel', v)} options={['Basic','Standard','Preferred']} disabled /></Field>
        <Field label="Amount of Liability Coverage" required><FSelect value={form.liabilityAmount} onChange={v => set('liabilityAmount', v)} options={['100,000','300,000','500,000']} disabled={!isFieldEnabled} /></Field>
        <Field label="Excess Scheduled Blanket Covered Personal Liabilities" required><FSelect value={form.excessBlanketLiabilities} onChange={v => set('excessBlanketLiabilities', v)} options={['Not Applicable','500,000']} disabled={!isFieldEnabled} /></Field>
        <Field label="Sinkhole and Catastrophic Ground Collapse" required><FSelect value={form.sinkhole} onChange={v => set('sinkhole', v)} options={sinkholeOpts} disabled={!isFieldEnabled} /></Field>
        <Field label="Earthquake" required><FSelect value={form.earthquake} onChange={v => set('earthquake', v)} options={['Non-Transferred','25,000','50,000','100,000']} disabled={!isFieldEnabled} /></Field>
        <Field label="Flood" required><FSelect value={form.flood} onChange={v => set('flood', v)} options={['Non-Transferred','10,000','25,000','50,000']} disabled={!isFieldEnabled} /></Field>
        <Field label="Wind & Hail" required><FSelect value={form.windHail} onChange={v => set('windHail', v)} options={['Included','Non-Transferred']} disabled={!isFieldEnabled} /></Field>
        <Field label="WildFire" required><FSelect value={form.wildfire} onChange={v => set('wildfire', v)} options={['Included','Non-Transferred']} disabled={!isFieldEnabled} /></Field>
        <Field label="Residential Worker No-fault Medical" required><FSelect value={form.resWorkerMedical} onChange={v => set('resWorkerMedical', v)} options={noYesOpts} disabled={!isFieldEnabled} /></Field>
        <Field label="Small Scale Farming Endorsement"><FSelect value={form.farmingEndorsement} onChange={v => set('farmingEndorsement', v)} options={noYesOpts} disabled={!isFieldEnabled} /></Field>
        <Field label="Landlord Endorsement" required><FSelect value={form.landlordEndorsement} onChange={v => set('landlordEndorsement', v)} options={noYesOpts} disabled={!isFieldEnabled} /></Field>
        <Field label="Home Office Endorsement" required><FSelect value={form.homeOfficeEndorsement} onChange={v => set('homeOfficeEndorsement', v)} options={noYesOpts} disabled={!isFieldEnabled} /></Field>
      </div>
      {showPremiumPanel && (
        <>
          <div className="wizard-section-subtitle" style={{ marginTop: 20 }}>Premium</div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div className="form-grid-3">
              {isBulkUploaded || !isNewBusiness ? (
                <>
                  <Field label="Prior Policy Period Premium" required><Input value={form.priorPolicyPremium} onChange={v => set('priorPolicyPremium', v)} disabled={isBulkUploaded || !isPriorPremiumEnabled} /></Field>
                  <Field label="Basic Coverage level Calculation Premium"><Input value={form.basePremium} onChange={v => set('basePremium', v)} disabled={isBulkUploaded} /></Field>
                  <Field label="Rate Modification"><Input value={form.rateModification} onChange={v => set('rateModification', v)} disabled={isBulkUploaded} /></Field>
                </>
              ) : (
                <Field label="Prior Policy Period Premium" required><Input value={form.priorPolicyPremium} onChange={v => set('priorPolicyPremium', v)} disabled={!isPriorPremiumEnabled} /></Field>
              )}
            </div>
            {!isBulkUploaded && isBusinessInsured && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, padding: '12px 16px', borderRadius: 6, lineHeight: 1.5, minWidth: 300 }}>
                Note: Please select the Save button to save your changes and then select the Close button to close the quote. You will be notified once the quote is approved.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Step 4: Plans Overview ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
const DEDUCTIBLE_OPTIONS = ['2,500', '5,000', '10,000', '25,000'];
const LIABILITY_OPTIONS = ['100,000', '300,000', '500,000'];
const TRANSFER_OPTIONS = ['Included', 'Non-Transferred'];
const SINKHOLE_OPTIONS = ['Yes', 'Non-Transferred'];
const EXCESS_OPTIONS = ['Not Applicable', '500,000'];
const EARTHQUAKE_OPTIONS = ['Non-Transferred', '25,000', '50,000', '100,000'];
const FLOOD_OPTIONS = ['Non-Transferred', '10,000', '25,000', '50,000'];
const YES_NO_OPTIONS = ['No', 'Yes'];

type AmountKey = keyof Pick<PlanAmounts, 'wildfire' | 'windHail' | 'sinkhole' | 'excessLiability' | 'earthquake' | 'flood' | 'resWorker' | 'farming' | 'landlord' | 'homeOffice'>;

type CoverageRow = {
  label: string;
  field: keyof Pick<FormState, 'wildfire' | 'windHail' | 'sinkhole' | 'excessBlanketLiabilities' | 'earthquake' | 'flood' | 'resWorkerMedical' | 'farmingEndorsement' | 'landlordEndorsement' | 'homeOfficeEndorsement'>;
  options: string[];
  amountKey: AmountKey;
};

const BASE_OPTION_ROWS: CoverageRow[] = [
  { label: 'Wildfire', field: 'wildfire', options: TRANSFER_OPTIONS, amountKey: 'wildfire' },
  { label: 'Wind & Hail', field: 'windHail', options: TRANSFER_OPTIONS, amountKey: 'windHail' },
  { label: 'Sinkhole and Catastrophic Ground Collapse', field: 'sinkhole', options: SINKHOLE_OPTIONS, amountKey: 'sinkhole' },
];

const OPTIONAL_COVERAGE_ROWS: CoverageRow[] = [
  { label: 'Excess Scheduled Blanket Covered Personal Liabilities', field: 'excessBlanketLiabilities', options: EXCESS_OPTIONS, amountKey: 'excessLiability' },
  { label: 'Earthquake', field: 'earthquake', options: EARTHQUAKE_OPTIONS, amountKey: 'earthquake' },
  { label: 'Flood', field: 'flood', options: FLOOD_OPTIONS, amountKey: 'flood' },
  { label: 'Residential Worker No-fault', field: 'resWorkerMedical', options: YES_NO_OPTIONS, amountKey: 'resWorker' },
  { label: 'Small Scale Farming Endorsement', field: 'farmingEndorsement', options: YES_NO_OPTIONS, amountKey: 'farming' },
  { label: 'Landlord Endorsement', field: 'landlordEndorsement', options: YES_NO_OPTIONS, amountKey: 'landlord' },
  { label: 'Home Office Endorsement', field: 'homeOfficeEndorsement', options: YES_NO_OPTIONS, amountKey: 'homeOffice' },
];

function StepPlans({ form, set }: { form: FormState; set: (k: keyof FormState, v: any) => void }) {
  const scenarioForm = applyPlanScenarioDefaults(form);
  const flow = getFlowKind(scenarioForm);
  const quoteEditable = !scenarioForm.lockSubmission && flow !== 'policy';
  const isProducer = booleanValue(scenarioForm.isHBProducer);
  const selected = selectedPlanId(valueOrFallback(scenarioForm.coverageLevel, scenarioForm.selectedPlan));
  const computedTotal = formatNumberValue(totalInsuredValue(scenarioForm));
  const fallbackPlans = calculatePlanAmounts(scenarioForm);
  const [backendPlans, setBackendPlans] = useState<PlanAmounts[] | null>(null);
  const planComparisonSignature = JSON.stringify({
    screenCode: scenarioForm.screenCode,
    policyType: scenarioForm.policyType,
    dwellingLimit: scenarioForm.dwellingLimit,
    appurtenantLimit: scenarioForm.appurtenantLimit,
    personalAssetsLimit: scenarioForm.personalAssetsLimit,
    occupancyDisruptionLimit: scenarioForm.occupancyDisruptionLimit,
    totalInsuredValues: computedTotal,
    deductible: scenarioForm.deductible,
    liabilityAmount: scenarioForm.liabilityAmount,
    excessBlanketLiabilities: scenarioForm.excessBlanketLiabilities,
    sinkhole: scenarioForm.sinkhole,
    earthquake: scenarioForm.earthquake,
    flood: scenarioForm.flood,
    windHail: scenarioForm.windHail,
    wildfire: scenarioForm.wildfire,
    resWorkerMedical: scenarioForm.resWorkerMedical,
    farmingEndorsement: scenarioForm.farmingEndorsement,
    landlordEndorsement: scenarioForm.landlordEndorsement,
    homeOfficeEndorsement: scenarioForm.homeOfficeEndorsement,
    priorPolicyPremium: scenarioForm.priorPolicyPremium,
    rateModification: scenarioForm.rateModification,
    selectedPlan: scenarioForm.selectedPlan,
    coverageLevel: scenarioForm.coverageLevel,
    policyFee: scenarioForm.policyFee,
    lockSubmission: scenarioForm.lockSubmission,
    isHBProducer: scenarioForm.isHBProducer,
    isQuickQuote: scenarioForm.isQuickQuote,
  });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setBackendPlans(null);

    async function loadPlanComparison() {
      try {
        const data = await quotesPoliciesApi.getPlanComparison({
          ...scenarioForm,
          totalInsuredValues: computedTotal,
        });
        const nextPlans = normalizeBackendPlanAmounts(data.plans);
        if (!cancelled && nextPlans) setBackendPlans(nextPlans);
      } catch (err) {
        if (!cancelled && (err as { name?: string }).name !== 'AbortError') {
          setBackendPlans(null);
          console.warn('Plan comparison backend unavailable; using local calculation fallback.', err);
        }
      }
    }

    loadPlanComparison();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [planComparisonSignature]);

  const plans = backendPlans ?? fallbackPlans;

  // Auto-apply the real backend-rated premium for the currently selected plan as soon as
  // the rater responds — previously basePremium only updated when the user clicked a plan
  // card in "Plans Overview" (selectPlan below), so a quote nobody manually re-selected a
  // plan for (e.g. a bulk-uploaded row) kept showing whatever static default was seeded.
  useEffect(() => {
    if (!backendPlans) return;
    const current = backendPlans.find(p => p.id === selected) ?? backendPlans[0];
    if (!current) return;
    const nextPremium = current.basePremium.toFixed(2);
    if (nextPremium !== scenarioForm.basePremium) set('basePremium', nextPremium);
    const nextFee = formatNumberValue(current.policyFee);
    if (nextFee !== scenarioForm.policyFee) set('policyFee', nextFee);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendPlans, selected]);

  // Dwelling Asset Limit: new business, OR renewal, OR endorsement with specific policy
  // conditions (not HBIS producer, policy paid, PBE not done) — mirrors StepLimitsCoverages.
  const canEditDwelling = quoteEditable &&
    (flow === 'newBusiness' ||
      flow === 'renewal' ||
      (flow === 'endorsement' && !isProducer && booleanValue(scenarioForm.isPolicyPaid) && !booleanValue(scenarioForm.isPBEDone)));
  const canEditDeductibleLiability = quoteEditable && (flow === 'newBusiness' || flow === 'renewal');
  // Base Premium Options / Optional Coverages: editable whenever the submission isn't locked.
  const canEditCoverageOptions = quoteEditable;
  const canEditPolicyFee = quoteEditable && (flow === 'renewal' || (flow === 'newBusiness' && isProducer));
  const canSelectPlan = quoteEditable && (flow === 'newBusiness' || flow === 'renewal');
  const showDwellingRequired = flow !== 'policy';

  function setLimit(key: keyof Pick<FormState, 'dwellingLimit' | 'appurtenantLimit' | 'personalAssetsLimit' | 'occupancyDisruptionLimit' | 'totalInsuredValues'>, value: string) {
    set(key, value);
    if (key !== 'totalInsuredValues') {
      set('totalInsuredValues', formatNumberValue(totalInsuredValue({ ...scenarioForm, [key]: value })));
    }
  }

  function selectPlan(plan: PlanAmounts) {
    if (!canSelectPlan) return;
    set('selectedPlan', plan.id);
    set('coverageLevel', plan.id);
    set('basePremium', plan.basePremium.toFixed(2));
    set('policyFee', formatNumberValue(plan.policyFee));
  }
  function coverageSelect(row: CoverageRow) {
    return (
      <div className="plan-coverage-control">
        <span>{row.label}</span>
        <FSelect
          value={normalizedOption(String(scenarioForm[row.field] || ''), row.options[0])}
          onChange={v => set(row.field as keyof FormState, v)}
          options={row.options}
          disabled={!canEditCoverageOptions}
        />
      </div>
    );
  }

  function renderCoverageRow(row: CoverageRow) {
    return (
      <tr key={row.amountKey}>
        <td className="row-option">{coverageSelect(row)}</td>
        {plans.map(plan => <td key={plan.id}>{formatMoney(Number(plan[row.amountKey]))}</td>)}
      </tr>
    );
  }

  return (
    <div className="plans-overview-screen">
      <div className="form-grid-3 plans-limit-grid">
        <Field label="Dwelling Asset Limit" required={showDwellingRequired}><Input value={scenarioForm.dwellingLimit} onChange={v => setLimit('dwellingLimit', v)} disabled={!canEditDwelling} /></Field>
        <Field label="Appurtenant Structure Assets Limit"><Input value={scenarioForm.appurtenantLimit} onChange={v => setLimit('appurtenantLimit', v)} disabled /></Field>
        <Field label="Personal Assets (Other than Fixed Assets) Limit"><Input value={scenarioForm.personalAssetsLimit} onChange={v => setLimit('personalAssetsLimit', v)} disabled /></Field>
        <Field label="Dwelling Occupancy Disruption Limit"><Input value={scenarioForm.occupancyDisruptionLimit} onChange={v => setLimit('occupancyDisruptionLimit', v)} disabled /></Field>
        <Field label="Total Insured Values"><Input value={computedTotal} disabled /></Field>
        <Field label="Physical Damage Deductible" required><FSelect value={normalizedOption(scenarioForm.deductible, '5,000')} onChange={v => set('deductible', v)} options={DEDUCTIBLE_OPTIONS} disabled={!canEditDeductibleLiability} /></Field>
        <Field label="Amount of Liability Coverage" required><FSelect value={normalizedOption(scenarioForm.liabilityAmount, '300,000')} onChange={v => set('liabilityAmount', v)} options={LIABILITY_OPTIONS} disabled={!canEditDeductibleLiability} /></Field>
      </div>

      <div className="wizard-section-subtitle">Plan Comparison Chart</div>
      <div className="register-card plan-comparison-card">
        <table className="plan-table plan-comparison-table">
          <thead>
            <tr>
              <th className="plan-label-col"></th>
              {plans.map((plan, index) => (
                <th key={plan.id}>
                  <div className="plan-header-cell">
                    <span>{plan.name}</span>
                    {index < plans.length - 1 && <small>or</small>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="row-label">Base Premium</td>
              {plans.map(plan => <td key={plan.id}>{formatMoney(plan.basePremium)}</td>)}
            </tr>
            <tr className="plan-section-row"><td className="row-label">Base Premium Options</td><td /><td /><td /></tr>
            {BASE_OPTION_ROWS.map(renderCoverageRow)}
            <tr className="plan-section-row"><td className="row-label">Optional Coverages</td><td /><td /><td /></tr>
            {OPTIONAL_COVERAGE_ROWS.map(renderCoverageRow)}
            <tr>
              <td className="row-label">
                <div className="policy-fee-control">
                  <span>Policy Fee</span>
                  <Input value={valueOrFallback(scenarioForm.policyFee, '195')} onChange={v => set('policyFee', v)} disabled={!canEditPolicyFee} />
                </div>
              </td>
              {plans.map(plan => <td key={plan.id}>{formatMoney(plan.policyFee)}</td>)}
            </tr>
            <tr className="plan-total-row">
              <td className="row-label">Total Premium <small>Without Taxes</small></td>
              {plans.map(plan => <td key={plan.id}><div className="plan-total">USD {formatMoney(plan.total)}</div></td>)}
            </tr>
            <tr className="plan-select-row">
              <td className="row-label">Select</td>
              {plans.map(plan => (
                <td key={plan.id}>
                  <button
                    type="button"
                    className={`plan-select-btn ${selected === plan.id ? 'selected' : ''}`}
                    onClick={() => selectPlan(plan)}
                    disabled={!canSelectPlan}
                    aria-pressed={selected === plan.id}
                  >
                    <span className="plan-radio" aria-hidden="true" />
                    Select
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StepUWSpecific({ form, isRenewal }: { form?: FormState; isRenewal?: boolean }) {
  return (
    <div className="uw-specific-screen">
      <div className="wizard-section-subtitle">UW Specific Change</div>
      <div className="register-card uw-specific-card">
        <table className="policy-info-table">
          <tbody>
            {isRenewal ? (
              <>
                <tr><td>Change Type</td><td>Renewal underwriting review</td></tr>
                <tr><td>Status</td><td>Pending review</td></tr>
                {form?.quoteNumber && <tr><td>Quote Number</td><td>{form.quoteNumber}</td></tr>}
                {form?.policyNumber && <tr><td>Policy Number</td><td>{form.policyNumber}</td></tr>}
                {form?.effectiveDate && <tr><td>Effective Date</td><td>{form.effectiveDate}</td></tr>}
                {form?.expirationDate && <tr><td>Expiration Date</td><td>{form.expirationDate}</td></tr>}
                {form?.lob && <tr><td>Line of Business</td><td>{form.lob}</td></tr>}
                {form?.subProduct && <tr><td>Sub Product</td><td>{form.subProduct}</td></tr>}
              </>
            ) : (
              <>
                <tr><td>Change Type</td><td>Underwriting review</td></tr>
                <tr><td>Status</td><td>Pending review</td></tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StepQuoteReview({ form, onEdit }: { form: FormState; onEdit: () => void }) {
  const scenarioForm = applyPlanScenarioDefaults(form);
  const flow = getFlowKind(scenarioForm);
  const isPolicyFlow = flow === 'policy';
  const isQuoteFlow = !isPolicyFlow;
  const isBusiness = !PERSON_INSURED_TYPES.has(scenarioForm.insuredType);
  const planRows = calculatePlanAmounts(scenarioForm);
  const selectedPlan = planRows.find(p => p.id === selectedPlanId(scenarioForm.selectedPlan)) || planRows[0];
  const reviewPremium = flow === 'policy' ? 0 : selectedPlan.total;
  const reviewBasePremium = selectedPlan.basePremium;
  const reviewTotalInsuredValues = formatNumberValue(totalInsuredValue(scenarioForm));
  const fullName = [scenarioForm.firstName, scenarioForm.middleName, scenarioForm.lastName].filter(Boolean).join(' ').trim();
  const address = [scenarioForm.addressLine1, scenarioForm.addressLine2, scenarioForm.city, scenarioForm.state, scenarioForm.county, scenarioForm.zip].filter(Boolean).join(', ');
  // Endorsement: real diff against the prior policy (GET .../endorsement-changes) — only
  // shown when at least one field actually changed. Renewal comparison isn't wired to
  // real data yet — kept as a placeholder, always shown, unchanged.
  const insuredTypeSegment = String(scenarioForm.insuredType).toLowerCase() === 'business' ? 'business' : 'individual';
  const [endorsementChanges, setEndorsementChanges] = useState<[string, string, string, string][]>([]);
  useEffect(() => {
    if (flow !== 'endorsement' || !scenarioForm.policyNumber) { setEndorsementChanges([]); return; }
    let cancelled = false;
    quotesPoliciesApi.getEndorsementChanges(insuredTypeSegment, scenarioForm.policyNumber)
      .then(changes => {
        if (!cancelled) setEndorsementChanges(changes.map(c => [c.panel, c.field, c.priorValue ?? '-', c.updatedValue ?? '-']));
      })
      .catch(() => { if (!cancelled) setEndorsementChanges([]); });
    return () => { cancelled = true; };
  }, [flow, insuredTypeSegment, scenarioForm.policyNumber]);

  const compareRows = flow === 'endorsement'
    ? endorsementChanges
    : flow === 'renewal'
    ? [
        ['Business Information', 'Doing Business As', 'Abcerrere One', displayValue(scenarioForm.doingBusinessAs, displayValue(scenarioForm.organizationName, 'sadsad'))],
        ['Business Information', 'Organization Name', 'Abcerrere One', displayValue(scenarioForm.organizationName, displayValue(scenarioForm.doingBusinessAs, 'sadsad'))],
        ['Insured Details', 'Age More Than 65', 'No', displayValue(scenarioForm.age65OrOlder, 'Yes')],
        ['Policy Information', 'Effective Date', '01-16-2026', displayValue(scenarioForm.effectiveDate, '01-11-2027')],
        ['Policy Information', 'Expiration Date', '01-10-2027', displayValue(scenarioForm.expirationDate, '01-11-2028')],
        ['Property Information', 'Building Type', 'NO BASEMENT/ENCLOSURE', '-'],
        ['Property Information', 'Number Of Stories', '0', '-'],
        ['Property Information', 'Square Footage', '0', '-'],
      ]
    : [];
  const showCompareGrid = flow === 'renewal' || (flow === 'endorsement' && compareRows.length > 0);
  const policyInfoCells = [
    ['Quote No.', displayValue(scenarioForm.quoteNumber, isPolicyFlow ? '' : scenarioForm.policyNumber)],
    ['Line of Business', displayValue(scenarioForm.lob, '')],
    ['Effective Date', displayValue(scenarioForm.effectiveDate, isPolicyFlow ? '01-01-1900' : '-')],
    ['Expiration Date', displayValue(scenarioForm.expirationDate, isPolicyFlow ? '01-01-1900' : '-')],
    ['Policy Term', displayValue(scenarioForm.policyTerm, '')],
  ];
  const insuredCells = isBusiness
    ? [
        ['Organization Name', displayValue(scenarioForm.organizationName, '')],
        ['Doing Business As', displayValue(scenarioForm.doingBusinessAs, '-')],
        ['Address', displayValue(address, ''), 'wide'],
        ['Email ID', displayValue(scenarioForm.email, ''), 'wide'],
      ]
    : [
        ['Insured Name', displayValue(fullName, '')],
        ['Telephone No.', displayValue(scenarioForm.phone, '')],
        ['Address', displayValue(address, ''), 'wide'],
        ['Email ID', displayValue(scenarioForm.email, ''), 'wide'],
      ];
  const summaryCells = [
    ['Dwelling Asset Limit (DAL)', displayValue(scenarioForm.dwellingLimit, '0')],
    ['Appurtenant Structure Assets Limit', displayValue(scenarioForm.appurtenantLimit, '0')],
    ['Personal Assets (Other than Fixed Assets) Limit', displayValue(scenarioForm.personalAssetsLimit, '0')],
    ['Dwelling Occupancy Disruption Limit', displayValue(scenarioForm.occupancyDisruptionLimit, '0')],
    ['Total Insured Values', reviewTotalInsuredValues],
    ['Physical Damage Deductible', displayValue(scenarioForm.deductible, '0')],
    ['Amount of Liability Coverage', displayValue(scenarioForm.liabilityAmount, '0')],
    ['Coverage Level', selectedPlan.id],
    ['Base Premium', reviewBasePremium.toFixed(2)],
    ['Wildfire', displayValue(scenarioForm.wildfire, '')],
    ['Wind & Hail', displayValue(scenarioForm.windHail, '')],
    ['Sinkhole and Catastrophic Ground Collapse', displayValue(scenarioForm.sinkhole, '')],
    ['Excess Scheduled Blanket Covered Personal Liabilities', displayValue(scenarioForm.excessBlanketLiabilities, '0')],
    ['Earthquake', displayValue(scenarioForm.earthquake, '0')],
    ['Flood', displayValue(scenarioForm.flood, '0')],
    ['Residential Worker No-Fault', displayValue(scenarioForm.resWorkerMedical, '')],
    ['Small Scale Farming Endorsement', displayValue(scenarioForm.farmingEndorsement, '')],
    ['Landlord Endorsement', displayValue(scenarioForm.landlordEndorsement, '')],
    ['Home Office Endorsement', displayValue(scenarioForm.homeOfficeEndorsement, '')],
    ['Policy Fee', displayValue(scenarioForm.policyFee, '195')],
  ];

  function renderFieldCell(item: string[]) {
    const [label, value, span] = item;
    return (
      <div key={label} className={`quote-review-field${span === 'wide' ? ' wide' : ''}`}>
        <div className="quote-review-label">{label}</div>
        <div className="quote-review-value">{value}</div>
      </div>
    );
  }

  return (
    <div className="quote-review-screen">
      <div className="quote-review-title-row">
        <h2>Quote Review</h2>
        <div className="quote-review-kpis">
          <span>Est. Risk Premium <strong>USD {formatWholeMoney(reviewPremium)}</strong></span>
          <span>Est. Coverage Premium <strong>USD {formatWholeMoney(reviewPremium)}</strong></span>
        </div>
      </div>

      {showCompareGrid && (
        <div className="finalize-section quote-review-compare">
          <div className="wizard-section-subtitle">Review / Compare Updated Information</div>
          <table className="mini-table">
            <thead><tr><th>Panel</th><th>Field</th><th>Prior Value</th><th>Updated Value</th></tr></thead>
            <tbody>
              {compareRows.map(([panel, field, prior, updated]) => <tr key={`${panel}-${field}`}><td>{panel}</td><td>{field}</td><td>{prior}</td><td>{updated}</td></tr>)}
            </tbody>
          </table>
        </div>
      )}

      <div className="quote-review-card-grid">
        <section className="quote-review-card">
          <div className="quote-review-card-title">
            <span>Policy Information</span>
            {isQuoteFlow && <button type="button" className="quote-review-edit" title="Edit Policy Information" onClick={onEdit}>&#9998;</button>}
          </div>
          <div className="quote-review-info-grid">{policyInfoCells.map(renderFieldCell)}</div>
        </section>
        <section className="quote-review-card">
          <div className="quote-review-card-title">
            <span>Insured Detail</span>
            {isQuoteFlow && <button type="button" className="quote-review-edit" title="Edit Insured Detail" onClick={onEdit}>&#9998;</button>}
          </div>
          <div className="quote-review-info-grid">{insuredCells.map(renderFieldCell)}</div>
        </section>
      </div>

      <div className="quote-review-summary-title">Limit &amp; Premium Summary</div>
      <section className="quote-review-summary-card">
        <div className="quote-review-summary-grid">{summaryCells.map(renderFieldCell)}</div>
      </section>
    </div>
  );
}

// ---------- helpers ----------
// HB product only has Annual and Monthly (GetPaymentFrequencyList_HB returns exactly 2 entries)
const FREQ_LABEL_TO_DB: Record<string, string> = {
  'Annual': 'Annual', 'Monthly': 'Monthly',
  'ANNUAL': 'Annual', 'MONTHLY': 'Monthly',
  // legacy â€” map removed values to nearest valid HB option
  'Semi-Annual': 'Annual', 'Quarterly': 'Annual',
  'SEMI-ANNUAL': 'Annual', 'QUARTERLY': 'Annual',
};
const PARTY_LABEL: Record<string, string> = {
  'Insured': 'Insured', 'Mortgagee': 'Mortgagee',
  'INSURED': 'Insured', 'MORTGAGEE': 'Mortgagee',
};

// ─── Quote document (Document ▾ → Download / Share / Preview Quote) ──────────
// Renders the quote as a self-contained printable HTML document. Download uses the
// browser print dialog (Save as PDF); Share emails this same HTML via the backend.
function buildQuoteDocumentHtml(rawForm: FormState): string {
  const form = applyPlanScenarioDefaults(rawForm);
  const planRows = calculatePlanAmounts(form);
  const plan = planRows.find(p => p.id === selectedPlanId(form.selectedPlan)) || planRows[0];
  const planTotal = plan.total;
  const policyFee = numberValue(valueOrFallback(form.policyFee, '195'));
  const coveragePremium = planTotal - policyFee;
  const tax = STATE_TAX[form.state] || { sl: 0, stamp: 0, fire: 0 };
  const surplusTax = planTotal * (tax.sl || 0);
  const fireTax = planTotal * (tax.fire || 0);
  const totalTax = surplusTax + fireTax;
  const stampingFee = tax.flatStamp ? (tax.stamp || 0) : planTotal * (tax.stamp || 0);
  const totalPremium = coveragePremium + totalTax + policyFee + stampingFee;

  const usd = (n: number) => `USD ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const insured = form.insuredType === 'Business' && form.organizationName
    ? form.organizationName
    : [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ');
  const address = [form.addressLine1, form.addressLine2, form.city, form.state, form.zip].filter(Boolean).join(', ');
  const quoteNumber = form.quoteNumber || form.policyNumber || '';

  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px;color:#6b7280;">${esc(label)}</td><td style="padding:6px 12px;text-align:right;font-weight:600;">${value}</td></tr>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Quote ${esc(quoteNumber)}</title></head>
<body style="font-family:Segoe UI,Arial,sans-serif;color:#111827;margin:0;padding:32px;background:#fff;">
  <div style="max-width:720px;margin:0 auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1a3b6b;padding-bottom:12px;">
      <div style="font-size:20px;font-weight:700;color:#1a3b6b;">HUDSON BAILEY <span style="font-weight:400;">InsureEdge</span></div>
      <div style="text-align:right;font-size:13px;color:#6b7280;">Quote<br/><strong style="color:#111827;font-size:15px;">${esc(quoteNumber)}</strong></div>
    </div>
    <h2 style="font-size:16px;margin:20px 0 4px;">Insurance Quote Summary</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;">
      ${row('Named Insured', esc(insured))}
      ${row('Property Address', esc(address))}
      ${row('Line of Business', esc(`${form.lob} : ${form.subProduct}`))}
      ${row('Effective Date', esc(form.effectiveDate))}
      ${row('Expiration Date', esc(form.expirationDate))}
      ${row('Selected Plan', esc(plan.name))}
      ${row('Deductible', esc(form.deductible))}
      ${row('Liability Amount', esc(form.liabilityAmount))}
    </table>
    <h2 style="font-size:16px;margin:24px 0 4px;">Premium Summary</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;background:#f9fafb;border-radius:8px;">
      ${row('Coverage Premium', usd(coveragePremium))}
      ${row(`Surplus Lines Tax (${((tax.sl || 0) * 100).toFixed(2)}%)`, usd(surplusTax))}
      ${row(`Fire Premium Tax (${((tax.fire || 0) * 100).toFixed(2)}%)`, usd(fireTax))}
      ${row('Stamping Fee', usd(stampingFee))}
      ${row('Policy Fee', usd(policyFee))}
      <tr><td style="padding:10px 12px;font-weight:700;border-top:2px solid #1a3b6b;">Total Premium</td>
          <td style="padding:10px 12px;text-align:right;font-weight:700;border-top:2px solid #1a3b6b;color:#1a3b6b;">${usd(totalPremium)}</td></tr>
    </table>
    <p style="font-size:11px;color:#6b7280;margin-top:28px;line-height:1.5;">
      This quote is an estimate based on the information provided and is subject to underwriting review.
      It does not bind coverage. Taxes and fees are estimated using ${esc(form.state)} surplus lines rates.
    </p>
  </div>
</body></html>`;
}

// Finalize Quote Summary card — shows just the current value normally; when `prior` is
// given (endorsement flow, prior premium loaded) it expands to show Previous Amount /
// Change in Amount / Updated Amount, matching the reference Summary panel.
function SummaryStatCard({ label, value, prior, valueClass, icon, iconColor }: {
  label: string; value: number; prior?: number; valueClass?: string; icon: string; iconColor: string;
}) {
  const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (prior == null) {
    return (
      <div className="summary-stat">
        <div className="summary-stat-label">{label}</div>
        <div className={`summary-stat-value${valueClass ? ` ${valueClass}` : ''}`}>{money(value)}</div>
        <span className="summary-stat-icon" style={{ color: iconColor }} dangerouslySetInnerHTML={{ __html: icon }} />
      </div>
    );
  }
  const change = value - prior;
  const changeClass = change < 0 ? 'decrease' : change > 0 ? 'increase' : '';
  return (
    <div className="summary-stat summary-stat-compare">
      <div className="summary-stat-label">{label}</div>
      <span className="summary-stat-icon" style={{ color: iconColor }} dangerouslySetInnerHTML={{ __html: icon }} />
      <div className="summary-stat-row">
        <span className="summary-stat-row-label">Previous Amount</span>
        <span className="summary-stat-row-value">USD {money(prior)}</span>
      </div>
      <div className="summary-stat-row">
        <span className="summary-stat-row-label">Change in Amount</span>
        <span className={`summary-stat-row-value change ${changeClass}`}>{change >= 0 ? '+' : '-'}USD {money(Math.abs(change))}</span>
      </div>
      <div className="summary-stat-row">
        <span className="summary-stat-row-label">Updated Amount</span>
        <span className={`summary-stat-row-value updated${valueClass ? ` ${valueClass}` : ''}`}>USD {money(value)}</span>
      </div>
    </div>
  );
}

// -- Step 6: Finalize Quote
function StepFinalize({
  form, set, submissionId, flow, onIssue, onIssueEndorsement, onDecline, onEdit, onPolicySummary, finalizeErrors,
}: {
  form: FormState;
  set: (k: keyof FormState, v: any) => void;
  submissionId: string;
  flow: FlowKind;
  onBind: () => Promise<void>;
  onIssue: () => Promise<{ policyNumber?: string; message?: string } | void>;
  onIssueEndorsement: () => Promise<{ policyNumber?: string; message?: string } | void>;
  onDecline: (reason: string) => Promise<void>;
  // Pencil icons (Summary + Commission Details) navigate back to Policy Information (PRD §2)
  onEdit: () => void;
  // Success popup: countdown expiry / "Policy Summary" button redirect target
  onPolicySummary: () => void;
  // Save & Next required-field errors, shown inline under the dropdowns (PRD §4/§5)
  finalizeErrors: { frequency?: string; party?: string };
}) {
  // â”€â”€ Premium calculations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const scenarioForm = applyPlanScenarioDefaults(form);
  const planRows = calculatePlanAmounts(scenarioForm);
  const selectedPlan = planRows.find(p => p.id === selectedPlanId(scenarioForm.selectedPlan)) || planRows[0];
  const planTotal = selectedPlan.total;
  const POLICY_FEE = numberValue(valueOrFallback(scenarioForm.policyFee, '195'));
  const coveragePremium = planTotal - POLICY_FEE;
  const tax = STATE_TAX[form.state] || { sl: 0, stamp: 0, fire: 0, flatStamp: false };
  const surplusTax = planTotal * (tax.sl || 0);
  const fireTax = planTotal * (tax.fire || 0);
  const totalTax = surplusTax + fireTax;
  const stampingFee = tax.flatStamp ? (tax.stamp || 0) : planTotal * (tax.stamp || 0);
  const totalFees = POLICY_FEE + stampingFee;
  const totalPremium = coveragePremium + totalTax + totalFees;

  // â”€â”€ Data loaded from DB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [commissionPct, setCommissionPct] = useState(12);
  type InstallmentRow = { id: number; amountDue: number; dueDate: string; isPaid: boolean; status: string; surplusLineTax: number; fireTax: number; coveragePremium: number; totalTax: number; installmentFee: number; };
  const [installments, setInstallments] = useState<InstallmentRow[]>([]);

  // Load existing payment plan + commission from DB on mount (PRD: GetPolicyDetails + GetCommissiondetails)
  useEffect(() => {
    if (!submissionId) return;
    // Load commission percentage
    quotesPoliciesApi.getCommission(submissionId)
      .then(d => { if (d?.commissionPercentage) setCommissionPct(d.commissionPercentage || 12); })
      .catch(() => {});
    // Load payment plan and installments
    api.get(`/submissions/${submissionId}/payment-plan`).then(r => r.data).catch(() => null)
      .then(d => {
        if (d?.paymentPlan) {
          const pp = d.paymentPlan;
          if (pp.paymentFrequency) set('paymentFrequency', FREQ_LABEL_TO_DB[pp.paymentFrequency] || pp.paymentFrequency);
          if (pp.responsibleParty) set('responsibleParty', PARTY_LABEL[pp.responsibleParty] || pp.responsibleParty);
          if (pp.modeOfPayment) set('modeOfPayment', pp.modeOfPayment);
          if (pp.isPaymentRequiredToBind != null) set('paymentRequiredToBind', Boolean(pp.isPaymentRequiredToBind));
        }
        if (d?.installments?.length) setInstallments(d.installments);
      })
      .catch(() => {});
  }, [submissionId]);

  const annualCommission = coveragePremium * (commissionPct / 100);

  // Installment count per PRD: Annual=1, Semi-Annual=2, Quarterly=4, Monthly=12
  function installmentCount(freq: string) {
    const f = (freq || '').toLowerCase();
    if (f.includes('semi')) return 2;
    if (f.includes('quarter')) return 4;
    if (f.includes('month')) return 12;
    return 1;
  }
  const numInstallments = installmentCount(form.paymentFrequency);
  const installmentCommission = annualCommission / numInstallments;

  // Mode of payment: 'CreditCard' or 'ACH' (PRD: AccountingType_RadioGroupOnChange â†’ ModeOfPaymentStructLocal)
  const modeOfPayment = form.modeOfPayment || 'CreditCard';

  const [isIssueLoading, setIsIssueLoading] = useState(false);
  // Pay Now (PRD §7): enabled only for Responsible Party = Insured; commission gate applies.
  const [isPayLoading, setIsPayLoading] = useState(false);
  const [isPaymentProcessed, setIsPaymentProcessed] = useState(false);
  const [isDeclineLoading, setIsDeclineLoading] = useState(false);
  const [showDeclinePopup, setShowDeclinePopup] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  // IsSuccessPopup (PRD §11): success confirmation with the generated policy number
  const [issueSuccess, setIssueSuccess] = useState<{ policyNumber: string; message: string } | null>(null);
  // Validation error shown near Issue/PayNow buttons (PRD Â§11 commission gate + Â§15 ValidatePaymentPlan)
  const [issueError, setIssueError] = useState('');

  async function handlePayNow() {
    // PRD §7: backend business rule — commission schedule must be configured (exact message).
    if (commissionPct <= 0) {
      setIssueError("A commission schedule and valid percentage is not configured for this Intermediary. Please contact Hudson Bailey to add the states to the Intermediary's licensing schedule or transfer the policy to a licensed intermediary/producer.");
      return;
    }
    if (isPaymentProcessed) { setIssueError('Payment has already been processed for this policy.'); return; }
    setIssueError('');
    setIsPayLoading(true);
    try {
      const planSaved = await savePaymentPlan(form.paymentFrequency, form.responsibleParty, modeOfPayment);
      if (!planSaved) { setIsPayLoading(false); return; }
      // PRD §13: Payment SA (Tranzpay) + CallNewWindow JS — open external payment gateway
      window.open(`/close-window?ref=${submissionId}`, '_blank', 'width=800,height=600,scrollbars=yes');
      setIsPaymentProcessed(true);
    } catch (_) {}
    setIsPayLoading(false);
  }

  async function savePaymentPlan(freq: string, party: string, mode: string): Promise<boolean> {
    try {
      await api.post(`/submissions/${submissionId}/payment-plan`, {
        paymentFrequency: freq, responsibleParty: party,
        // PRD §8: both indicators are system-computed, never user input — fees are always
        // fully paid in the first installment; Insured pays to bind, Mortgagee doesn't.
        feesFullyPaidFirstInstallment: true,
        paymentRequiredToBind: party === 'Insured',
        modeOfPayment: mode,
        coveragePremium, totalTax, stampingFee, policyFee: POLICY_FEE,
        surplusLinesTax: surplusTax, firePremiumTax: fireTax, slRate: tax.sl || 0, fireRate: tax.fire || 0,
      });
      // Reload installment schedule after saving
      const d = await api.get(`/submissions/${submissionId}/payment-plan`).then(r => r.data).catch(() => null);
      if (d?.installments) setInstallments(d.installments);
      return true;
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      // Surface whatever the server said: our {error}, ASP.NET ProblemDetails, or a network failure.
      const detail = data?.error
        || (data?.errors && Object.values(data.errors).flat().join(' '))
        || data?.title
        || err?.message
        || 'Unknown error';
      setIssueError(`Failed to save payment plan${status ? ` (HTTP ${status})` : ''}: ${detail}`);
      return false;
    }
  }

  async function handlePaymentFrequencyChange(v: string) {
    set('paymentFrequency', v);
    await savePaymentPlan(v, form.responsibleParty, modeOfPayment);
  }

  async function handleResponsiblePartyChange(v: string) {
    set('responsibleParty', v);
    await savePaymentPlan(form.paymentFrequency, v, modeOfPayment);
  }

  // 11-second countdown per PRD BR-06; at zero the system redirects to Policy Summary.
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (issueSuccess) onPolicySummary();
      return;
    }
    const t = window.setTimeout(() => setCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const isEndorsementFlow = flow === 'endorsement';

  // Summary's "Previous Amount" column: the prior policy's own Coverage Premium/Taxes/
  // Fees/Total, computed by running the SAME calculatePlanAmounts()/STATE_TAX formula
  // used above against the prior policy's raw inputs (GET .../endorsement-prior-premium).
  const insuredTypeSegment = String(scenarioForm.insuredType).toLowerCase() === 'business' ? 'business' : 'individual';
  const [priorPremiumForm, setPriorPremiumForm] = useState<Partial<FormState> | null>(null);
  useEffect(() => {
    if (!isEndorsementFlow || !scenarioForm.policyNumber) { setPriorPremiumForm(null); return; }
    let cancelled = false;
    quotesPoliciesApi.getEndorsementPriorPremiumForm(insuredTypeSegment, scenarioForm.policyNumber)
      .then(res => { if (!cancelled) setPriorPremiumForm(res.form); })
      .catch(() => { if (!cancelled) setPriorPremiumForm(null); });
    return () => { cancelled = true; };
  }, [isEndorsementFlow, insuredTypeSegment, scenarioForm.policyNumber]);

  const priorPremium = useMemo(() => {
    if (!priorPremiumForm) return null;
    const priorScenarioForm = applyPlanScenarioDefaults({ ...defaultForm, ...priorPremiumForm } as FormState);
    const priorPlanRows = calculatePlanAmounts(priorScenarioForm);
    const priorSelectedPlan = priorPlanRows.find(p => p.id === selectedPlanId(priorScenarioForm.selectedPlan)) || priorPlanRows[0];
    const priorPlanTotal = priorSelectedPlan.total;
    const priorPolicyFee = numberValue(valueOrFallback(priorScenarioForm.policyFee, '195'));
    const priorCoveragePremium = priorPlanTotal - priorPolicyFee;
    const priorTax = STATE_TAX[priorScenarioForm.state] || { sl: 0, stamp: 0, fire: 0, flatStamp: false };
    const priorSurplusTax = priorPlanTotal * (priorTax.sl || 0);
    const priorFireTax = priorPlanTotal * (priorTax.fire || 0);
    const priorTotalTax = priorSurplusTax + priorFireTax;
    const priorStampingFee = priorTax.flatStamp ? (priorTax.stamp || 0) : priorPlanTotal * (priorTax.stamp || 0);
    const priorTotalFees = priorPolicyFee + priorStampingFee;
    const priorTotalPremium = priorCoveragePremium + priorTotalTax + priorTotalFees;
    return { coveragePremium: priorCoveragePremium, totalTax: priorTotalTax, totalFees: priorTotalFees, totalPremium: priorTotalPremium };
  }, [priorPremiumForm]);

  async function handleIssue() {
    if (form.lockSubmission) return;
    // PRD Â§11 + Â§25: commission gate â€” ListFilter checks commission configured
    if (commissionPct <= 0) { setIssueError('Commission is not configured. Policy cannot be issued.'); return; }
    // PRD Â§15 ValidatePaymentPlan: PaymentFrequency required
    if (!form.paymentFrequency) { setIssueError('Payment Frequency is required before issuing.'); return; }
    // PRD Â§15 ValidatePaymentPlan: ResponsibleParty required
    if (!form.responsibleParty) { setIssueError('Responsible Party is required before issuing.'); return; }
    setIssueError('');
    setIsIssueLoading(true);
    // Persist the payment plan first: the DB row may not exist yet when the form
    // still shows its defaults (saves only fire on dropdown change).
    const planSaved = await savePaymentPlan(form.paymentFrequency, form.responsibleParty, modeOfPayment);
    if (!planSaved) { setIsIssueLoading(false); return; }
    // IssueOnClick → IssuePolicyHB_BL → IsSuccessPopup → StartCountdown → OnStatusChange
    try {
      const result = await onIssue();
      setIssueSuccess({
        policyNumber: (result && result.policyNumber) || '',
        message: (result && result.message) || 'Policy has been issued successfully.',
      });
      setCountdown(11);
    } catch (err: any) {
      setIssueError(err?.response?.data?.error || 'Failed to issue policy. Please try again.');
    }
    setIsIssueLoading(false);
  }

  // Endorsement flow: IssueEndorsementOnClick â†’ StartCountdown_EndorsementIssue
  async function handleIssueEndorsement() {
    if (form.lockSubmission) return;
    // PRD Â§11 + Â§25: commission gate
    if (commissionPct <= 0) { setIssueError('Commission is not configured. Endorsement cannot be issued.'); return; }
    // PRD Â§15 ValidatePaymentPlan: PaymentFrequency required
    if (!form.paymentFrequency) { setIssueError('Payment Frequency is required before issuing.'); return; }
    // PRD Â§15 ValidatePaymentPlan: ResponsibleParty required
    if (!form.responsibleParty) { setIssueError('Responsible Party is required before issuing.'); return; }
    setIssueError('');
    setIsIssueLoading(true);
    const planSaved = await savePaymentPlan(form.paymentFrequency, form.responsibleParty, modeOfPayment);
    if (!planSaved) { setIsIssueLoading(false); return; }
    try {
      const result = await onIssueEndorsement();
      setIssueSuccess({
        policyNumber: (result && result.policyNumber) || '',
        message: (result && result.message) || 'Endorsement has been issued successfully.',
      });
      setCountdown(11);
    } catch (err: any) {
      setIssueError(err?.response?.data?.error || 'Failed to issue endorsement. Please try again.');
    }
    setIsIssueLoading(false);
  }

  async function handleDeclineConfirm() {
    setIsDeclineLoading(true);
    try { await onDecline(declineReason); } catch (_) {}
    setIsDeclineLoading(false);
    setShowDeclinePopup(false);
  }

  // PRD §5: Responsible Party drives which action is offered — Insured → Pay Now,
  // Mortgagee → Issue (header + inline), blank → neither active.
  const isInsuredParty = form.responsibleParty === 'Insured';
  const isMortgageeParty = (form.responsibleParty || '').toUpperCase().includes('MORTGAGE');
  // Installment Details collapsible (PRD §4: Monthly only, −/+ toggle)
  const [installmentDetailsOpen, setInstallmentDetailsOpen] = useState(true);

  const currentStatus = form.recordStatus;
  const isBound = currentStatus === 'Bound';
  const isActive = currentStatus === 'Active';
  const isDeclined = currentStatus === 'Declined';
  // PRD Â§27: no BindOnClick exists in OutSystems â€” new business issues directly via IssueOnClick
  const canIssue = !isEndorsementFlow && !form.lockSubmission && !isActive && !isDeclined;
  // Endorsement flow: skip Bind, issue directly via IssueEndorsementOnClick
  const canIssueEndorsement = isEndorsementFlow && !form.lockSubmission && !isActive && !isDeclined;

  return (
    <div>
      {/* IsSuccessPopup + StartCountdown (PRD BR-06): green check, policy number, mm:ss
          countdown, then auto-redirect to the Policy Summary screen. */}
      {countdown !== null && countdown > 0 && (
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: 'center', padding: '28px 36px', maxWidth: 380 }}>
            <div style={{
              width: 52, height: 52, margin: '0 auto 16px', borderRadius: '50%',
              background: '#ecfdf5', border: '2px solid #6ee7b7', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#059669', fontSize: 24,
            }}>&#10003;</div>
            <div style={{ fontSize: 14, color: '#111827', marginBottom: 10 }}>
              Your policy <strong>{issueSuccess?.policyNumber || ''}</strong>&nbsp; has been issued successfully.
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
              After <strong style={{ color: '#111827' }}>00:{String(countdown).padStart(2, '0')}</strong> seconds, the system will re-direct you to the Policy Summary screen.
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
              You can retrieve the New Business Policy package from the Documents folder, after selecting the View Policy button, to give to your insured.
            </div>
            <button className="btn btn-outline-blue" style={{ fontSize: 13 }} onClick={onPolicySummary}>Policy Summary</button>
          </div>
        </div>
      )}

      {/* Decline popup */}
      {showDeclinePopup && (
        <div className="modal-overlay" onClick={() => setShowDeclinePopup(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              Decline Quote
              <button className="modal-close" onClick={() => setShowDeclinePopup(false)}>&#215;</button>
            </div>
            <div style={{ padding: '16px 0' }}>
              <Field label="Reason for Declining">
                <Input value={declineReason} onChange={setDeclineReason} placeholder="Enter reason..." />
              </Field>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowDeclinePopup(false)}>Cancel</button>
              <button className="btn" style={{ background: '#dc2626', color: '#fff' }} disabled={isDeclineLoading} onClick={handleDeclineConfirm}>
                {isDeclineLoading ? 'Declining...' : 'Decline Quote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="finalize-section">
        <div className="finalize-section-title">
          Summary
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* PRD §2: pencil navigates back to Policy Information */}
            <button className="btn-icon" title="Edit" onClick={onEdit}>&#9998;</button>
            {/* Keep Issue visible for eligible new-business states, matching the original
                widget. Mortgagee remains the only direct-issue payment path. */}
            {canIssue && (
              <button
                className="btn btn-outline-blue"
                style={{ fontSize: 12 }}
                disabled={isIssueLoading || !isMortgageeParty}
                title={isMortgageeParty ? 'Issue policy' : 'Issue is available when Responsible Party is Mortgagee. Use Pay Now when Responsible Party is Insured.'}
                onClick={handleIssue}
              >
                {isIssueLoading ? 'Issuing...' : 'Issue'}
              </button>
            )}
            {/* Available regardless of Responsible Party — issues the endorsement,
                activates it as the policy's new record, and cancels the prior policy. */}
            {canIssueEndorsement && (
              <button className="btn btn-outline-blue" style={{ fontSize: 12 }} disabled={isIssueLoading} onClick={handleIssueEndorsement}>
                {isIssueLoading ? 'Issuing...' : 'Issue Endorsement'}
              </button>
            )}
          </div>
        </div>
        <div className={priorPremium ? 'summary-stats summary-stats-compare' : 'summary-stats'}>
          <SummaryStatCard label="Coverage Premium" value={coveragePremium} prior={priorPremium?.coveragePremium} valueClass="primary" icon="&#128203;" iconColor="#1a3b6b" />
          <SummaryStatCard label="Taxes" value={totalTax} prior={priorPremium?.totalTax} valueClass="tax" icon="&#128181;" iconColor="#d97706" />
          <SummaryStatCard label="Fees" value={totalFees} prior={priorPremium?.totalFees} icon="&#128196;" iconColor="#6b7280" />
          <SummaryStatCard label="Total Premium" value={totalPremium} prior={priorPremium?.totalPremium} valueClass="primary" icon="&#128202;" iconColor="#1a3b6b" />
        </div>
        {priorPremium && (() => {
          const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const premiumChange = totalPremium - priorPremium.totalPremium;
          return (
            <div className="summary-recon-strip">
              <div className="summary-recon-item">
                <span className="summary-recon-label">Updated Amount</span>
                <span className="summary-recon-value">USD {money(totalPremium)}</span>
              </div>
              <span className="summary-recon-op">&minus;</span>
              <div className="summary-recon-item">
                <span className="summary-recon-label">Previous Amount</span>
                <span className="summary-recon-value">USD {money(priorPremium.totalPremium)}</span>
              </div>
              <span className="summary-recon-op">=</span>
              <div className="summary-recon-item">
                <span className="summary-recon-label">Change in Premium</span>
                <span className="summary-recon-value">{premiumChange >= 0 ? '+' : '-'}USD {money(Math.abs(premiumChange))}</span>
              </div>
            </div>
          );
        })()}
        {/* Validation errors + status badges (Issue button itself lives in the header above) */}
        {issueError && (
          <div style={{ color: '#dc2626', fontSize: 12, marginTop: 8, textAlign: 'right' }}>{issueError}</div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
          {(isBound || isActive) && (
            <span style={{ background: isActive ? '#dcfce7' : '#dbeafe', color: isActive ? '#15803d' : '#1d4ed8', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
              {isEndorsementFlow && isActive ? 'Endorsement Issued' : currentStatus}
            </span>
          )}
          {isDeclined && (
            <span style={{ background: '#fee2e2', color: '#dc2626', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>Declined</span>
          )}
        </div>
      </div>

      {/* Payment Plans (PRD Â§12 SaveOnClick + Â§13 PayNowOnClick â†’ Tranzpay CallNewWindow) */}
      <div className="finalize-section">
        <div className="finalize-section-title">
          Payment Plans
          {/* PRD §5: Pay Now visible for Insured/blank (disabled until Insured), hidden for Mortgagee */}
          {!isMortgageeParty && (
            <button className="btn btn-outline" style={{ fontSize: 11 }}
              disabled={isPayLoading || !isInsuredParty} onClick={handlePayNow}>
              {isPayLoading ? 'Opening...' : 'Pay Now'}
            </button>
          )}
        </div>
        {/* Reference layout: two dropdowns, then Number of Installments / Installment Fee as
            plain read-only text (not boxed inputs), all on one row. */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 1fr 1fr', gap: 16, alignItems: 'start' }}>
          <Field label="Payment Frequency" required>
            <FSelect value={form.paymentFrequency || ''} onChange={handlePaymentFrequencyChange}
              options={['Annual', 'Monthly']} placeholder="Select..." />
            {finalizeErrors.frequency && (
              <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{finalizeErrors.frequency}</div>
            )}
          </Field>
          <Field label="Responsible Party" required>
            <FSelect value={form.responsibleParty || ''} onChange={handleResponsiblePartyChange}
              options={['Insured', 'Mortgagee']} placeholder="Select.." />
            {finalizeErrors.party && (
              <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{finalizeErrors.party}</div>
            )}
          </Field>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Number of Installments</div>
            <div style={{ fontSize: 13, color: '#111827' }}>{String(numInstallments).padStart(2, '0')}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Installment Fee</div>
            {/* PRD §2: USD 0.00 Annual, USD 10.00 per installment Monthly */}
            <div style={{ fontSize: 13, color: '#111827' }}>USD {(numInstallments === 12 ? 10 : 0).toFixed(2)}</div>
          </div>
        </div>

        {/* PRD §8: both radio groups are ALWAYS disabled — system-computed indicators, not inputs.
            Fees fully paid = always Yes; Payment required to Bind = Yes for Insured, No otherwise. */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#111827' }}>Are Fees fully paid in first installment?</span>
            <label className="radio-item" style={{ color: '#9ca3af' }}>
              <input type="radio" name="feesFirstInstall" style={{ accentColor: '#1a3b6b' }} disabled checked /> Yes
            </label>
            <label className="radio-item" style={{ color: '#9ca3af' }}>
              <input type="radio" name="feesFirstInstall" style={{ accentColor: '#1a3b6b' }} disabled checked={false} readOnly /> No
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#111827' }}>Is Payment required to Bind</span>
            <label className="radio-item" style={{ color: '#9ca3af' }}>
              <input type="radio" name="payReqToBind" style={{ accentColor: '#1a3b6b' }} disabled checked={isInsuredParty} readOnly /> Yes
            </label>
            <label className="radio-item" style={{ color: '#9ca3af' }}>
              <input type="radio" name="payReqToBind" style={{ accentColor: '#1a3b6b' }} disabled checked={!isInsuredParty} readOnly /> No
            </label>
          </div>
        </div>
      </div>

      {/* Installment Details (PRD §4: Monthly only, collapsible via −/+) */}
      {numInstallments === 12 && installments.length > 0 && (
        <div className="finalize-section">
          <div className="finalize-section-title">
            Installment Details
            <button className="btn-icon" style={{ fontSize: 15, fontWeight: 700 }}
              onClick={() => setInstallmentDetailsOpen(v => !v)}>
              {installmentDetailsOpen ? '−' : '+'}
            </button>
          </div>
          {installmentDetailsOpen && (
            <table className="mini-table">
              <thead>
                <tr><th>Installment Due Date</th><th>Installment Fee (USD)</th><th>Installment Amount (USD)</th><th>Amount Due (USD)</th></tr>
              </thead>
              <tbody>
                {installments.map(inst => (
                  <tr key={inst.id}>
                    <td>{inst.dueDate}</td>
                    <td>{(inst.installmentFee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td>{(inst.amountDue - (inst.installmentFee || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td>{inst.amountDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 600, borderTop: '2px solid #e5e7eb' }}>
                  <td style={{ textAlign: 'right' }}>Total</td>
                  <td>{installments.reduce((s, r) => s + (r.installmentFee || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{installments.reduce((s, r) => s + r.amountDue - (r.installmentFee || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td>{installments.reduce((s, r) => s + r.amountDue, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Taxes ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â state-driven from tax matrix */}
      <div className="finalize-section">
        <div className="finalize-section-title">Taxes</div>
        <table className="mini-table">
          <thead>
            <tr><th>Installment Due Date</th><th>Tax</th><th>State</th><th>Percentage</th><th>Premium</th><th>Installment Tax</th></tr>
          </thead>
          <tbody>
            {(() => {
              // OutSystems math (verified against the reference UI): coverage premium splits
              // equally across installments, ALL fees land in the first installment's base,
              // and each installment's tax = rate × that installment's base. Annual = one block.
              const usd = (n: number) => `USD ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
              const round2 = (n: number) => Math.round(n * 100) / 100;
              const buildBases = (count: number): number[] => {
                if (count <= 1) return [round2(planTotal)];
                const rest = Math.floor((coveragePremium / count) * 100) / 100;
                const first = round2(coveragePremium - rest * (count - 1) + totalFees);
                return [first, ...Array(count - 1).fill(rest)];
              };
              const premiumParts = buildBases(numInstallments);
              const slParts = premiumParts.map(b => round2(b * (tax.sl || 0)));
              const fireParts = premiumParts.map(b => round2(b * (tax.fire || 0)));
              const dates = numInstallments === 12 && installments.length === 12
                ? installments.map(i => i.dueDate)
                : Array.from({ length: numInstallments }, () => form.effectiveDate);
              return dates.map((date, i) => (
                <Fragment key={i}>
                  <tr>
                    <td>{date}</td><td>Surplus Lines</td><td>{form.state}</td>
                    <td>{(tax.sl * 100).toFixed(2)}%</td>
                    <td>{usd(premiumParts[i])}</td><td>{usd(slParts[i])}</td>
                  </tr>
                  <tr>
                    <td>{date}</td><td>Fire Premium</td><td>{form.state}</td>
                    <td>{(tax.fire * 100).toFixed(2)}%</td>
                    <td>{usd(premiumParts[i])}</td><td>{usd(fireParts[i])}</td>
                  </tr>
                  <tr style={{ fontWeight: 600 }}>
                    <td colSpan={5} style={{ textAlign: 'right' }}>Total Tax</td>
                    <td>{usd(slParts[i] + fireParts[i])}</td>
                  </tr>
                </Fragment>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {/* Fees */}
      <div className="finalize-section">
        <div className="finalize-section-title">Fees</div>
        <div className="fee-row">
          <span className="fee-label">Policy Fee</span>
          <span style={{ textAlign: 'right' }}>Total Fee<br /><strong>USD {POLICY_FEE.toFixed(2)}</strong></span>
        </div>
        <div className="fee-row">
          <span className="fee-label">Stamping Fee</span>
          <span style={{ textAlign: 'right' }}>Total Fee<br /><strong>USD {stampingFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
        </div>
        <div className="fee-row fee-total">
          <span></span>
          <span style={{ textAlign: 'right' }}>Total Fee<br /><strong>USD {totalFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
        </div>
      </div>

      {/* Commission Details */}
      <div className="finalize-section">
        <div className="finalize-section-title">Commission Details</div>
        <table className="mini-table">
          <thead>
            <tr><th>Brokerage</th><th>Producer Name</th><th>Percentage</th><th>Installment Commission</th><th>Annual Commission</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>{form.brokerageFirm}</td>
              <td>{form.producerName || '-'}</td>
              <td>{commissionPct.toFixed(2)}%</td>
              <td>USD {installmentCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              <td>USD {annualCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, gap: 24, fontSize: 12 }}>
          <span>Total Installment Commission: <strong>USD {installmentCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
          <span>Total Annual Commission: <strong>USD {annualCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <span style={{ fontSize: 12, color: '#374151' }}>Lock Submission:</span>
          <label className="toggle">
            <input type="checkbox" checked={form.lockSubmission} onChange={e => set('lockSubmission', e.target.checked)} />
            <span className="toggle-slider" />
          </label>
          {/* PRD §2: Commission Details pencil also navigates to Policy Information */}
          <button className="btn-icon" title="Edit" onClick={onEdit}>&#9998;</button>
        </div>
      </div>
    </div>
  );
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Step 7: Documents ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
type DocumentPersona = 'clientAdmin' | 'producer';
type QuoteDocKey = 'transactionType' | 'documentType' | 'documentName' | 'version' | 'createdOn';
type OptionalQuoteDocKey = 'transactionType' | 'version' | 'createdOn';
type ClientDocKey = 'documentName' | 'uploadedOn' | 'source';

type QuotePolicyDocument = {
  id: string;
  transactionType: string;
  documentType: string;
  documentName: string;
  version: string;
  createdOn: string;
};

type ClientDocument = {
  id: string;
  documentName: string;
  uploadedOn: string;
  source: 'System' | 'Uploaded';
  fileObject?: File;   // present only before backend upload completes
  backendId?: number;  // set after successful backend upload
  staticUrl?: string;  // for system documents served as static assets
};

type EmailAttachment = {
  id: string;
  documentName: string;
  source: 'System' | 'Uploaded' | 'QuotePolicy' | 'EmailUpload';
};

type EmailUserOption = {
  label: string;
  email: string;
  role?: string;
  initials?: string;
};

const CURRENT_USER_EMAIL = 'Devtest@damcogroup.com';
const PRODUCER_EMAIL = 'Devtest@damcogroup.com';

const EMAIL_TYPE_OPTIONS = [
  'Ad Hoc',
  'Quote Document',
  'Quote Proposal',
  'Policy Document',
  'Renewal Notice',
  'Endorsement Notice',
];

const EMAILED_BY_OPTIONS: EmailUserOption[] = [
  { label: 'Current User', email: CURRENT_USER_EMAIL, role: 'Current User', initials: 'HC' },
  { label: 'Client Admin', email: CURRENT_USER_EMAIL, role: 'Client Admin', initials: 'HC' },
  { label: 'Producer', email: PRODUCER_EMAIL, role: 'Producer', initials: 'SD' },
  { label: 'Underwriter', email: 'underwriter@yopmail.com', role: 'Underwriter', initials: 'UW' },
];

const FALLBACK_EMAIL_USERS: EmailUserOption[] = [
  { label: 'Hudson Client Admin', email: CURRENT_USER_EMAIL, role: 'Client Admin', initials: 'HC' },
  { label: 'Sunrise Da Producer', email: PRODUCER_EMAIL, role: 'Producer', initials: 'SD' },
  { label: 'Underwriter', email: 'underwriter@yopmail.com', role: 'Underwriter', initials: 'UW' },
];

function emailTokensFromValue(value: string) {
  const source = value.replace(/[<>]/g, ' ').trim();
  if (!source) return [];
  const rawTokens = source.split(/[\s,;]+/).map(item => item.trim()).filter(Boolean);
  const extractedEmails = source.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  const hasDisplayNameTokens = extractedEmails.length > 0 && rawTokens.some(token => !token.includes('@'));
  const tokens = hasDisplayNameTokens ? extractedEmails : rawTokens;
  return uniqueEmailTokens(tokens.map(token => token.replace(/^["']+|["']+$/g, '').trim().toLowerCase()).filter(Boolean));
}

function uniqueEmailTokens(tokens: string[]) {
  const seen = new Set<string>();
  const next: string[] = [];
  tokens.forEach(token => {
    const key = token.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    next.push(key);
  });
  return next;
}

function emailValueFromTokens(tokens: string[]) {
  return uniqueEmailTokens(tokens).join(', ');
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
}

function uniqueEmailOptions(options: EmailUserOption[]) {
  const seen = new Set<string>();
  return options.filter(option => {
    const email = option.email.trim().toLowerCase();
    if (!email || seen.has(email)) return false;
    seen.add(email);
    return true;
  }).map(option => ({ ...option, email: option.email.trim().toLowerCase(), initials: option.initials || initialsFromName(option.label) }));
}

function usersToEmailOptions(users: UserSelectDto[]) {
  return uniqueEmailOptions(users
    .filter(user => user.email && isValidEmailValue(user.email))
    .map(user => ({
      label: user.fullName || user.email,
      email: user.email,
      role: 'User',
      initials: user.initials || initialsFromName(user.fullName || user.email),
    })));
}

function EmailAddressInput({ value, onChange, placeholder = 'Enter Email ID', multiple = true }: {
  value: string;
  onChange: (value: string) => void;
  options?: EmailUserOption[];
  placeholder?: string;
  multiple?: boolean;
}) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = emailTokensFromValue(value);
  const selectedLookup = new Set(selected.map(email => email.toLowerCase()));

  function commit(raw: string) {
    const tokens = emailTokensFromValue(raw).filter(email => !selectedLookup.has(email.toLowerCase()));
    if (tokens.length === 0) { setDraft(''); return; }
    const next = multiple ? [...selected, ...tokens] : [tokens[tokens.length - 1]];
    onChange(emailValueFromTokens(next));
    setDraft('');
  }

  function remove(email: string) {
    onChange(emailValueFromTokens(selected.filter(item => item !== email)));
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if ((event.key === 'Enter' || event.key === 'Tab' || event.key === ',' || event.key === ';') && draft.trim()) {
      event.preventDefault();
      commit(draft);
      return;
    }
    if (event.key === 'Backspace' && !draft && selected.length > 0) {
      remove(selected[selected.length - 1]);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text');
    if (/[\s,;]/.test(pasted) && pasted.includes('@')) {
      event.preventDefault();
      commit(`${draft} ${pasted}`);
    }
  }

  return (
    <div className="email-address-control">
      <div className="email-address-widget" onClick={() => inputRef.current?.focus()}>
        {selected.map(email => (
          <span key={email} className={`email-address-chip${isValidEmailValue(email) ? '' : ' invalid'}`} title={email}>
            <span>{email}</span>
            <button type="button" onClick={event => { event.stopPropagation(); remove(email); }} aria-label={`Remove ${email}`}>&#215;</button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={selected.length === 0 ? placeholder : ''}
        />
      </div>
    </div>
  );
}

type QuoteDocColumnDef = {
  key: QuoteDocKey;
  label: string;
  locked: boolean;
  sortable: boolean;
  filterable: boolean;
  minWidth: number;
};

const QUOTE_DOC_COLUMNS: Record<QuoteDocKey, QuoteDocColumnDef> = {
  transactionType: { key: 'transactionType', label: 'Transaction Type', locked: false, sortable: true, filterable: true, minWidth: 220 },
  documentType: { key: 'documentType', label: 'Document Type', locked: true, sortable: true, filterable: true, minWidth: 180 },
  documentName: { key: 'documentName', label: 'Document Name', locked: true, sortable: true, filterable: true, minWidth: 260 },
  version: { key: 'version', label: 'Version', locked: false, sortable: false, filterable: false, minWidth: 100 },
  createdOn: { key: 'createdOn', label: 'Created On', locked: false, sortable: true, filterable: true, minWidth: 170 },
};

const DEFAULT_QUOTE_DOC_VISIBILITY: Record<OptionalQuoteDocKey, boolean> = {
  transactionType: true,
  version: true,
  createdOn: true,
};

const SYSTEM_CLIENT_DOCUMENT: ClientDocument = {
  id: 'system-hb-superperils-form',
  documentName: "Homeowner's SuperPerils Policy Form.pdf",
  uploadedOn: '-',
  source: 'System',
  staticUrl: '/api/static-documents/hb-superperils-form.pdf',
};

const UPLOAD_EXTENSIONS = ['xls', 'xlsx', 'pdf', 'doc', 'docx', 'jpg', 'jpeg', 'mp4'];
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MIN_UPLOAD_BYTES = 10 * 1024;

function getDocumentPersona(form: FormState, queryRole: string | null): DocumentPersona {
  const query = String(queryRole || '').toLowerCase();
  if (query.includes('producer')) return 'producer';
  if (query.includes('admin')) return 'clientAdmin';
  return booleanValue(form.isHBProducer) ? 'producer' : 'clientAdmin';
}

function quoteDocColumnOrder(persona: DocumentPersona) {
  const producerOrder: QuoteDocKey[] = ['documentType', 'documentName', 'transactionType', 'version', 'createdOn'];
  const adminOrder: QuoteDocKey[] = ['transactionType', 'documentType', 'documentName', 'version', 'createdOn'];
  return persona === 'producer' ? producerOrder : adminOrder;
}

function quoteTransactionType(flow: FlowKind) {
  if (flow === 'endorsement') return 'Endorsement';
  if (flow === 'renewal') return 'Renewal';
  return 'New Business';
}

function documentTimestamp(seedDate: string, hour: string) {
  const date = displayValue(seedDate, '06-30-2026');
  return `${date} ${hour}`;
}

function quoteDocumentsForScenario(form: FormState, flow: FlowKind): QuotePolicyDocument[] {
  const status = String(form.recordStatus || '').toLowerCase();
  const effective = displayValue(form.effectiveDate, '06-30-2026');

  if (flow !== 'policy') {
    if (!['approved', 'bound', 'issued', 'active', 'submitted'].includes(status)) return [];
    const transactionType = quoteTransactionType(flow);
    return [{
      id: `${flow}-quote-proposal`,
      transactionType,
      documentType: flow === 'endorsement' ? 'docx' : 'pdf',
      documentName: flow === 'endorsement' ? 'UW Specific Change Endorsement.docx' : 'Quote Proposal Package.pdf',
      version: '1',
      createdOn: documentTimestamp(effective, '10:15'),
    }];
  }

  const baseDocs: QuotePolicyDocument[] = [
    {
      id: 'policy-package-v1',
      transactionType: 'New Business',
      documentType: 'pdf',
      documentName: 'New Business Policy Package.pdf',
      version: '1',
      createdOn: documentTimestamp(effective, '09:30'),
    },
    {
      id: 'policy-quote-proposal',
      transactionType: 'New Business',
      documentType: 'pdf',
      documentName: 'Quote Proposal Package.pdf',
      version: '1',
      createdOn: documentTimestamp(effective, '09:20'),
    },
  ];

  if (status.includes('cancel')) {
    return [
      ...baseDocs,
      {
        id: 'policy-endorsement-docx',
        transactionType: 'Endorsement',
        documentType: 'docx',
        documentName: 'UW Specific Change Endorsement.docx',
        version: '1',
        createdOn: documentTimestamp(effective, '11:10'),
      },
      {
        id: 'policy-cancellation-notice',
        transactionType: 'Cancellation',
        documentType: 'pdf',
        documentName: 'Notice of Cancellation.pdf',
        version: '1',
        createdOn: documentTimestamp(displayValue(form.expirationDate, effective), '16:45'),
      },
      {
        id: 'policy-package-v2',
        transactionType: 'New Business',
        documentType: 'pdf',
        documentName: 'New Business Policy Package.pdf',
        version: '2',
        createdOn: documentTimestamp(displayValue(form.expirationDate, effective), '16:46'),
      },
    ];
  }

  return baseDocs;
}

function docDateSortValue(value: string) {
  const match = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/.exec(value);
  if (!match) return Date.parse(value) || 0;
  const [, mm, dd, yyyy, hh, min] = match;
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min)).getTime();
}

function quoteDocValue(row: QuotePolicyDocument, key: string) {
  return String(row[key as QuoteDocKey] ?? '');
}

function clientDocValue(row: ClientDocument, key: string) {
  return String(row[key as ClientDocKey] ?? '');
}

function applyGridFilters<T>(rows: T[], filters: AppliedFilters, getValue: (row: T, key: string) => string) {
  return Object.entries(filters).reduce((acc, [key, filter]) => {
    return acc.filter(row => {
      const cell = getValue(row, key);
      if (filter.kind === 'value') return filter.values.includes(cell);
      const first = evalOp(filter.op1, cell, filter.val1);
      const second = evalOp(filter.op2, cell, filter.val2);
      return filter.logic === 'and' ? first && second : first || second;
    });
  }, rows);
}

function sortGridRows<T>(rows: T[], sort: SortState | null, getValue: (row: T, key: string) => string) {
  if (!sort) return rows;
  return [...rows].sort((a, b) => {
    const av = getValue(a, sort.col);
    const bv = getValue(b, sort.col);
    const result = sort.col.toLowerCase().includes('on')
      ? docDateSortValue(av) - docDateSortValue(bv)
      : av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
    return sort.dir === 'asc' ? result : -result;
  });
}

function formatUploadDate() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function DocumentColumnPanel({ visibleCols, onToggle, onClose, anchor }: {
  visibleCols: Record<OptionalQuoteDocKey, boolean>;
  onToggle: (key: OptionalQuoteDocKey) => void;
  onClose: () => void;
  anchor: { top: number; left: number };
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      const close = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) onClose();
      };
      document.addEventListener('mousedown', close);
      return () => document.removeEventListener('mousedown', close);
    }, 80);
    return () => clearTimeout(id);
  }, [onClose]);

  const optionalColumns: Array<{ key: OptionalQuoteDocKey; label: string }> = [
    { key: 'transactionType', label: 'Transaction Type' },
    { key: 'version', label: 'Version' },
    { key: 'createdOn', label: 'Created On' },
  ];

  return (
    <div ref={ref} className="col-panel" style={{ position: 'fixed', top: anchor.top, left: anchor.left, zIndex: 9999 }}>
      <div className="col-panel-title">Modify Columns Display</div>
      {['Action', 'Document Type', 'Document Name'].map(label => (
        <label key={label} className="col-panel-item col-panel-item-disabled">
          <input type="checkbox" checked disabled />
          <span>{label}</span>
        </label>
      ))}
      {optionalColumns.map(col => (
        <label key={col.key} className="col-panel-item">
          <input type="checkbox" checked={visibleCols[col.key]} onChange={() => onToggle(col.key)} />
          <span>{col.label}</span>
        </label>
      ))}
    </div>
  );
}

function DocumentGridHeader({ colKey, label, sortable, filterable, sort, filters, activeFilterCol, onSort, onFilterClick }: {
  colKey: string;
  label: string;
  sortable: boolean;
  filterable: boolean;
  sort: SortState | null;
  filters: AppliedFilters;
  activeFilterCol: string | null;
  onSort: (col: string) => void;
  onFilterClick?: (col: string, target: HTMLElement) => void;
}) {
  const hasFilter = !!filters[colKey];
  const isSorted = sort?.col === colKey;
  return (
    <th className={hasFilter ? 'th-filtered' : ''}>
      <div className="th-inner">
        <span className={sortable ? 'th-sortable' : 'th-label'} onClick={() => sortable && onSort(colKey)}>
          {label}{isSorted && <span className="sort-arrow sort-active">{sort!.dir === 'asc' ? ' ?' : ' ?'}</span>}
        </span>
        {filterable && onFilterClick && (
          <button
            type="button"
            className={`col-filter-icon${hasFilter ? ' filter-on' : ''}${activeFilterCol === colKey ? ' filter-open' : ''}`}
            onClick={event => { event.stopPropagation(); onFilterClick(colKey, event.currentTarget); }}
            title={`Filter ${label}`}
          >
            <FunnelIcon />
          </button>
        )}
      </div>
    </th>
  );
}

function DocumentIconButton({ title, children, danger, disabled, onClick }: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" className={`doc-icon-btn${danger ? ' danger' : ''}`} title={title} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

const DOCUMENT_UPLOAD_TYPE_OPTIONS = ['Underwriters Specific Change Endorsement', 'Others'];

function DocumentTypePicker({ value, onChange, disabled, autoOpen = false }: { value: string; onChange: (value: string) => void; disabled?: boolean; autoOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const visibleOptions = DOCUMENT_UPLOAD_TYPE_OPTIONS.filter(option => option.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (autoOpen && !value && !disabled) setOpen(true);
  }, [autoOpen, disabled, value]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  function choose(option: string) {
    onChange(option);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={ref} className="doc-type-picker">
      <button
        type="button"
        className={`doc-type-control${open ? ' open' : ''}${!value ? ' placeholder' : ''}`}
        disabled={disabled}
        aria-expanded={open}
        onClick={() => !disabled && setOpen(current => !current)}
      >
        <span>{value || 'Select...'}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="doc-type-menu">
          <label className="doc-type-search">
            <Search size={14} />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search..." autoFocus />
          </label>
          <div className="doc-type-options">
            {visibleOptions.map(option => (
              <button type="button" key={option} className="doc-type-option" onMouseDown={event => event.preventDefault()} onClick={() => choose(option)}>
                {option}
              </button>
            ))}
            {visibleOptions.length === 0 && <div className="doc-type-empty">No options found</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function StepDocuments({ form, flow, submissionId }: { form: FormState; flow: FlowKind; submissionId?: string }) {
  const [searchParams] = useSearchParams();
  const persona = getDocumentPersona(form, searchParams.get('persona') || searchParams.get('role'));
  const isPolicyContext = flow === 'policy';
  const [activeTab, setActiveTab] = useState<'quote' | 'client'>('quote');
  const [quoteSearch, setQuoteSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [quoteFilters, setQuoteFilters] = useState<AppliedFilters>({});
  const [quoteSort, setQuoteSort] = useState<SortState | null>({ col: 'createdOn', dir: 'desc' });
  const [clientSort, setClientSort] = useState<SortState | null>({ col: 'documentName', dir: 'asc' });
  const [visibleQuoteCols, setVisibleQuoteCols] = useState<Record<OptionalQuoteDocKey, boolean>>({ ...DEFAULT_QUOTE_DOC_VISIBILITY });
  const [filterPopup, setFilterPopup] = useState<{ col: string; anchor: { top: number; left: number } } | null>(null);
  const [columnPanelOpen, setColumnPanelOpen] = useState(false);
  const [columnPanelAnchor, setColumnPanelAnchor] = useState({ top: 0, left: 0 });
  const [uploadedDocs, setUploadedDocs] = useState<ClientDocument[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<QuotePolicyDocument[]>([]);
  const [selectedClientDocIds, setSelectedClientDocIds] = useState<string[]>([]);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadDocumentName, setUploadDocumentName] = useState('');
  const [uploadDocumentType, setUploadDocumentType] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFormError, setUploadFormError] = useState('');
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState('');
  const [showShare, setShowShare] = useState(false);
  // PRD §5.1: CancelEmailPopup — confirm before discarding draft
  const [showCancelEmailPopup, setShowCancelEmailPopup] = useState(false);
  const [emailType, setEmailType] = useState('Ad Hoc');
  const [emailedBy, setEmailedBy] = useState('Current User');
  const [emailTo, setEmailTo] = useState('');
  const [emailFrom, setEmailFrom] = useState(CURRENT_USER_EMAIL);
  const [emailCc, setEmailCc] = useState('');
  const [emailBcc, setEmailBcc] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailAttachments, setEmailAttachments] = useState<EmailAttachment[]>([]);
  const [emailDirectory, setEmailDirectory] = useState<EmailUserOption[]>([]);
  const [shareUploadError, setShareUploadError] = useState('');
  const [shareError, setShareError] = useState('');
  const [shareSent, setShareSent] = useState(false);
  // PRD §11 step 2: IsLoading — disables Send button during send processing
  const [isSending, setIsSending] = useState(false);
  const columnPanelButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shareFileInputRef = useRef<HTMLInputElement>(null);

  // Load persisted client-uploaded documents from backend on mount
  useEffect(() => {
    if (!submissionId) return;
    api.get(`/submissions/${submissionId}/documents`).then(r => r.data).catch(() => [])
      .then((docs: Array<{ id: number; documentName: string; uploadedOn: string }>) => {
        setUploadedDocs(docs.map(d => ({
          id: `backend-${d.id}`,
          documentName: d.documentName,
          uploadedOn: d.uploadedOn ? new Date(d.uploadedOn).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '',
          source: 'Uploaded' as const,
          backendId: d.id,
        })));
      })
      .catch(() => {});
  }, [submissionId]);

  // Load persisted generated documents (Quote Proposal Package, etc) from backend
  // PRD §5: GenerationDocuments_QuoteProposalPackage + GetandDownloadDocument
  useEffect(() => {
    if (!submissionId) return;
    api.get(`/submissions/${submissionId}/documents/generated`).then(r => r.data)
      .then((docs: Array<{ id: number; fileName?: string; fileType?: string; transactionType?: string; version?: string; createdOn: string }>) => {
        if (Array.isArray(docs) && docs.length > 0) {
          setGeneratedDocs(docs.map(d => ({
            id: `generated-${d.id}`,
            transactionType: d.transactionType || 'New Business',
            documentType: d.fileType || 'pdf',
            documentName: d.fileName || 'Quote Proposal Package.pdf',
            version: d.version || '1',
            createdOn: d.createdOn ? new Date(d.createdOn).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) + ' ' +
              new Date(d.createdOn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
          })));
        } else {
          setGeneratedDocs([]);
        }
      })
      .catch(() => setGeneratedDocs([]));
  }, [submissionId]);

  // Use fetched generated documents if available; otherwise fall back to scenario-based docs.
  // PRD §5: DocumentsGrid (Quote/Policy tab) displays persisted PolicyDocument rows.
  const quoteDocs = useMemo(() =>
    generatedDocs.length > 0 ? generatedDocs : quoteDocumentsForScenario(form, flow),
    [generatedDocs, form, flow]);
  const clientDocs = useMemo(() => [SYSTEM_CLIENT_DOCUMENT, ...uploadedDocs], [uploadedDocs]);
  const selectedClientDocs = useMemo(() => clientDocs.filter(row => selectedClientDocIds.includes(row.id)), [clientDocs, selectedClientDocIds]);
  const canSaveUpload = Boolean(uploadFile && !uploadError && uploadDocumentName.trim() && uploadDocumentType.trim());
  const namedInsured = PERSON_INSURED_TYPES.has(form.insuredType)
    ? [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ').trim() || 'Named Insured'
    : form.organizationName || [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ').trim() || 'Named Insured';
  const namedInsuredEmailOption = useMemo<EmailUserOption[]>(() => {
    if (!form.email || !isValidEmailValue(form.email)) return [];
    return [{ label: namedInsured, email: form.email, role: 'Named Insured', initials: initialsFromName(namedInsured) }];
  }, [form.email, namedInsured]);
  const emailUserOptions = useMemo(() => uniqueEmailOptions([...namedInsuredEmailOption, ...emailDirectory, ...FALLBACK_EMAIL_USERS]), [emailDirectory, namedInsuredEmailOption]);

  useEffect(() => {
    if (!uploadSuccessMessage) return;
    const id = window.setTimeout(() => setUploadSuccessMessage(''), 4000);
    return () => window.clearTimeout(id);
  }, [uploadSuccessMessage]);

  useEffect(() => {
    let ignore = false;
    authApi.getUsers()
      .then(users => {
        if (!ignore) setEmailDirectory(usersToEmailOptions(users));
      })
      .catch(() => {
        if (!ignore) setEmailDirectory([]);
      });
    return () => { ignore = true; };
  }, []);

  const quoteColumns = quoteDocColumnOrder(persona)
    .map(key => QUOTE_DOC_COLUMNS[key])
    .filter(col => col.locked || visibleQuoteCols[col.key as OptionalQuoteDocKey]);

  const quoteRows = useMemo(() => {
    const searched = quoteDocs.filter(row => {
      if (!quoteSearch.trim()) return true;
      const query = quoteSearch.trim().toLowerCase();
      return Object.values(row).some(value => String(value).toLowerCase().includes(query));
    });
    return sortGridRows(applyGridFilters(searched, quoteFilters, quoteDocValue), quoteSort, quoteDocValue);
  }, [quoteDocs, quoteFilters, quoteSearch, quoteSort]);

  const clientRows = useMemo(() => {
    const searched = clientDocs.filter(row => {
      if (!clientSearch.trim()) return true;
      const query = clientSearch.trim().toLowerCase();
      return row.documentName.toLowerCase().includes(query);
    });
    return sortGridRows(searched, clientSort, clientDocValue);
  }, [clientDocs, clientSearch, clientSort]);

  function handleQuoteSort(col: string) {
    setQuoteSort(current => current?.col === col && current.dir === 'asc' ? { col, dir: 'desc' } : { col, dir: 'asc' });
  }

  function handleClientSort(col: string) {
    setClientSort(current => current?.col === col && current.dir === 'asc' ? { col, dir: 'desc' } : { col, dir: 'asc' });
  }

  function openQuoteFilter(col: string, target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    setFilterPopup(current => current?.col === col ? null : { col, anchor: { top: rect.bottom + 4, left: rect.left } });
  }

  function applyQuoteFilter(col: string, filter: ColFilter | null) {
    setQuoteFilters(current => {
      const next = { ...current };
      if (filter) next[col] = filter;
      else delete next[col];
      return next;
    });
  }

  function quoteFilterOptions(col: string) {
    return [...new Set(quoteDocs.map(row => quoteDocValue(row, col)))].sort();
  }

  function toggleColumnPanel() {
    if (!columnPanelOpen && columnPanelButtonRef.current) {
      const rect = columnPanelButtonRef.current.getBoundingClientRect();
      setColumnPanelAnchor({ top: rect.bottom + 4, left: rect.left });
    }
    setColumnPanelOpen(open => !open);
  }

  function toggleClientSelection(id: string) {
    setSelectedClientDocIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }

  function emailAttachmentFromClient(doc: ClientDocument): EmailAttachment {
    return { id: doc.id, documentName: doc.documentName, source: doc.source };
  }

  function emailAttachmentFromQuote(doc: QuotePolicyDocument): EmailAttachment {
    return { id: doc.id, documentName: doc.documentName, source: 'QuotePolicy' };
  }

  function emailSubjectForAttachments(attachments: EmailAttachment[]) {
    if (attachments.length === 1) return `Documents for ${namedInsured} - ${attachments[0].documentName}`;
    return `Documents for ${namedInsured}`;
  }

  function emailSenderFor(selection: string) {
    return EMAILED_BY_OPTIONS.find(option => option.label === selection)?.email || CURRENT_USER_EMAIL;
  }

  function handleEmailedByChange(selection: string) {
    setEmailedBy(selection);
    setEmailFrom(emailSenderFor(selection));
  }

  function validateEmailField(value: string, label: string, required = false) {
    const addresses = emailTokensFromValue(value);
    if (required && addresses.length === 0) return `${label} is required.`;
    const invalid = addresses.find(address => !isValidEmailValue(address));
    return invalid ? `Enter a valid email address for ${label}: ${invalid}.` : '';
  }

  function openEmailShare(attachments: EmailAttachment[]) {
    setEmailType('Ad Hoc');
    setEmailedBy('Current User');
    setEmailTo(form.email || '');
    setEmailFrom(emailSenderFor('Current User'));
    setEmailCc('');
    setEmailBcc('');
    setEmailSubject(emailSubjectForAttachments(attachments));
    setEmailBody('');
    setEmailAttachments(attachments);
    setShareUploadError('');
    setShareError('');
    setShareSent(false);
    setShowShare(true);
  }

  function openClientShare() {
    if (selectedClientDocs.length === 0) return;
    openEmailShare(selectedClientDocs.map(emailAttachmentFromClient));
  }

  function closeShare() {
    if (shareSent) setSelectedClientDocIds([]);
    setShowShare(false);
    setShowCancelEmailPopup(false);
    setEmailType('Ad Hoc');
    setEmailedBy('Current User');
    setEmailTo('');
    setEmailFrom(emailSenderFor('Current User'));
    setEmailCc('');
    setEmailBcc('');
    setEmailSubject('');
    setEmailBody('');
    setEmailAttachments([]);
    setShareUploadError('');
    setShareError('');
    setShareSent(false);
    setIsSending(false);
    if (shareFileInputRef.current) shareFileInputRef.current.value = '';
  }

  function validateEmailAttachment(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['xls', 'xlsx', 'jpeg', 'jpg', 'png', 'pdf', 'doc', 'docx', 'pages'].includes(ext)) return 'Supported formats are Excel, JPEG, PNG, PDF, Doc and Pages.';
    if (file.size < MIN_UPLOAD_BYTES) return 'File size must be at least 10 KB.';
    if (file.size > MAX_UPLOAD_BYTES) return 'File size must be 10 MB or less.';
    return '';
  }

  function stageShareAttachment(file: File | undefined) {
    if (!file) return;
    const error = validateEmailAttachment(file);
    setShareUploadError(error);
    if (error) return;
    setEmailAttachments(current => [
      ...current,
      { id: `email-upload-${Date.now()}`, documentName: file.name, source: 'EmailUpload' },
    ]);
    if (shareFileInputRef.current) shareFileInputRef.current.value = '';
  }

  async function sendClientShare() {
    // PRD §11 step 2: IsLoading = True during send
    setIsSending(true);
    const toError = validateEmailField(emailTo, 'To', true);
    const fromError = validateEmailField(emailFrom, 'From', true);
    const ccError = validateEmailField(emailCc, 'CC');
    const bccError = validateEmailField(emailBcc, 'BCC');
    const validationError = toError || fromError || ccError || bccError;
    if (validationError) {
      setShareError(validationError);
      setIsSending(false);
      return;
    }
    if (!emailSubject || !emailSubject.trim()) {
      setShareError('Email Subject is required.');
      setIsSending(false);
      return;
    }

    console.log('Debug - emailBody value:', emailBody, 'Length:', emailBody?.length);

    if (!emailBody || emailBody.trim().length === 0) {
      setShareError('Email Body Text is required. Please type a message.');
      setIsSending(false);
      return;
    }
    if (!submissionId) {
      setShareError('Submission not found.');
      setIsSending(false);
      return;
    }

    setShareError('');
    try {
      let attachmentBase64: string | null = null;

      // For locally uploaded client documents, read the file as base64
      if (emailAttachments.length > 0) {
        const attachment = emailAttachments[0];
        const attachmentDoc = uploadedDocs.find(d => d.id === attachment.id);
        if (attachmentDoc?.fileObject) {
          // Read local file as base64
          try {
            const arrayBuffer = await attachmentDoc.fileObject.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            attachmentBase64 = btoa(String.fromCharCode(...bytes));
          } catch (e) {
            console.warn("Failed to read file as base64: " + (e instanceof Error ? e.message : 'unknown error'));
          }
        }
      }

      await api.post(`/submissions/${submissionId}/send-email`, {
        fromEmail: emailFrom.trim(),
        toEmail: emailTo.trim(),
        ccEmail: emailCc.trim() || null,
        bccEmail: emailBcc.trim() || null,
        subject: emailSubject.trim(),
        htmlBody: emailBody.trim(),
        documentName: emailAttachments.length > 0 ? emailAttachments[0].documentName : null,
        documentSource: emailAttachments.length > 0 ? emailAttachments[0].source : null,
        attachmentBase64: attachmentBase64,
      }, { timeout: 60000 }); // 60 seconds timeout for email sending
      // PRD §11 step 12: exact message is "Email Sent"; step 13: clear recipient fields
      setShareSent(true);
      setEmailTo('');
      setEmailCc('');
      setEmailBcc('');
    } catch (err: any) {
      setShareError(err?.response?.data?.error || 'Failed to send email.');
    } finally {
      setIsSending(false);
    }
  }

  function validateUpload(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!UPLOAD_EXTENSIONS.includes(ext)) return 'Supported formats are Excel, PDF, Doc, JPG, JPEG, and MP4.';
    if (file.size < MIN_UPLOAD_BYTES) return 'File size must be at least 10 KB.';
    if (file.size > MAX_UPLOAD_BYTES) return 'File size must be 10 MB or less.';
    return '';
  }

  function uploadBaseName(fileName: string) {
    return fileName.replace(/\.[^.]+$/, '');
  }

  function resetUploadRow() {
    setUploadFile(null);
    setUploadError('');
    setUploadDocumentName('');
    setUploadDocumentType('');
    setUploadDescription('');
    setUploadFormError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function stageUpload(file: File | undefined) {
    if (!file) return;
    setUploadFile(file);
    setUploadDocumentName(uploadBaseName(file.name));
    setUploadDocumentType('');
    setUploadDescription('');
    setUploadFormError('');
    setUploadError(validateUpload(file));
  }

  function closeUpload() {
    setShowUpload(false);
    resetUploadRow();
  }

  function saveUpload() {
    if (!uploadFile) {
      setUploadFormError('Browse or drop a file before saving.');
      return;
    }
    if (uploadError) return;
    if (!uploadDocumentName.trim()) {
      setUploadFormError('Enter a document name.');
      return;
    }
    if (!uploadDocumentType.trim()) {
      setUploadFormError('Select a document type.');
      return;
    }
    setUploadFormError('');
    const extensionStart = uploadFile.name.lastIndexOf('.');
    const extension = extensionStart >= 0 ? uploadFile.name.slice(extensionStart) : '';
    const typedName = uploadDocumentName.trim();
    const documentName = /\.[A-Za-z0-9]+$/.test(typedName) ? typedName : `${typedName}${extension}`;

    // Try to persist to backend; fall back to in-memory if no submissionId
    if (submissionId) {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('document_name', documentName);
      fd.append('document_type', uploadDocumentType.trim());
      api.post(`/submissions/${submissionId}/documents`, fd).then(r => r.data).catch(() => null)
        .then(doc => {
          const localId = doc ? `backend-${doc.id}` : `uploaded-${Date.now()}`;
          setUploadedDocs(current => [...current, {
            id: localId,
            documentName: doc?.documentName ?? documentName,
            uploadedOn: doc?.uploadedOn ? new Date(doc.uploadedOn).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : formatUploadDate(),
            source: 'Uploaded',
            backendId: doc?.id,
            fileObject: doc ? undefined : uploadFile,
          }]);
        })
        .catch(() => {
          setUploadedDocs(current => [...current, { id: `uploaded-${Date.now()}`, documentName, uploadedOn: formatUploadDate(), source: 'Uploaded', fileObject: uploadFile }]);
        });
    } else {
      setUploadedDocs(current => [...current, { id: `uploaded-${Date.now()}`, documentName, uploadedOn: formatUploadDate(), source: 'Uploaded', fileObject: uploadFile }]);
    }
    closeUpload();
    setActiveTab('client');
    setUploadSuccessMessage('Document uploaded successfully.');
  }

  function viewDocument(doc: ClientDocument) {
    if (doc.backendId) {
      setPreviewDoc({ url: `/api/documents/${doc.backendId}/view`, name: doc.documentName });
    } else if (doc.staticUrl) {
      setPreviewDoc({ url: doc.staticUrl, name: doc.documentName });
    } else if (doc.fileObject) {
      setPreviewDoc({ url: URL.createObjectURL(doc.fileObject), name: doc.documentName });
    }
  }

  function downloadDocument(doc: ClientDocument) {
    const href = doc.backendId
      ? `/api/documents/${doc.backendId}/download`
      : doc.staticUrl ?? null;
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.download = doc.documentName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (doc.fileObject) {
      const url = URL.createObjectURL(doc.fileObject);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.documentName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  }

  // PRD §5: Download generated quote/policy document (PolicyDocument persisted via GenerateQuoteProposalPackageAsync)
  async function viewGeneratedQuoteDocument(doc: QuotePolicyDocument) {
    if (!submissionId) return;
    try {
      const numId = doc.id.startsWith('generated-') ? doc.id.substring('generated-'.length) : doc.id;
      const bin = await api.get(`/submissions/${submissionId}/documents/generated/${numId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(bin.data);
      setPreviewDoc({ url, name: doc.documentName || 'Document' });
    } catch (err) {
      console.error('Failed to view generated document:', err);
    }
  }

  async function downloadGeneratedQuoteDocument(doc: QuotePolicyDocument) {
    if (!submissionId) return;
    try {
      // Extract numeric ID from the id field (format: "generated-{id}")
      const numId = doc.id.startsWith('generated-') ? doc.id.substring('generated-'.length) : doc.id;
      const bin = await api.get(`/submissions/${submissionId}/documents/generated/${numId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(bin.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.documentName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download generated document:', err);
    }
  }

  function renderQuoteCell(row: QuotePolicyDocument, col: QuoteDocColumnDef) {
    const value = quoteDocValue(row, col.key);
    if (col.key === 'documentName') {
      return <button type="button" className="doc-link doc-name" title={value}>{value}</button>;
    }
    if (col.key === 'documentType' && persona === 'clientAdmin') {
      return <button type="button" className="doc-link">{value}</button>;
    }
    return <span className={col.key === 'documentType' ? 'doc-type-text' : ''}>{value}</span>;
  }

  return (
    <div className="documents-screen">
      <div className="doc-tabs" role="tablist" aria-label="Documents tabs">
        <button type="button" className={`doc-tab ${activeTab === 'quote' ? 'active' : ''}`} onClick={() => setActiveTab('quote')}>Quote/Policy</button>
        <button type="button" className={`doc-tab ${activeTab === 'client' ? 'active' : ''}`} onClick={() => setActiveTab('client')}>Client Documents</button>
      </div>

      {activeTab === 'quote' && (
        <section className="documents-grid-shell">
          <div className="documents-toolbar">
            <div className="search-input-reg">
              <span className="search-icon">&#128269;</span>
              <input placeholder="Search by Keyword" value={quoteSearch} onChange={event => setQuoteSearch(event.target.value)} />
            </div>
            <div className="toolbar-spacer" />
            <span className="documents-record-count">{quoteRows.length} records</span>
          </div>
          <div className="doc-table-wrap">
            <table className="data-table documents-table">
              <thead>
                <tr>
                  <th style={{ width: 38 }}>
                    <button ref={columnPanelButtonRef} type="button" className={`col-panel-trigger doc-col-panel-trigger${columnPanelOpen ? ' col-panel-open' : ''}`} onClick={toggleColumnPanel} title="Modify Columns Display">&#9776;</button>
                  </th>
                  <th style={{ width: 104 }}>Action</th>
                  {quoteColumns.map(col => (
                    <DocumentGridHeader
                      key={col.key}
                      colKey={col.key}
                      label={col.label}
                      sortable={col.sortable}
                      filterable={col.filterable}
                      sort={quoteSort}
                      filters={quoteFilters}
                      activeFilterCol={filterPopup?.col ?? null}
                      onSort={handleQuoteSort}
                      onFilterClick={openQuoteFilter}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {quoteRows.length === 0 && <tr><td colSpan={quoteColumns.length + 2} className="no-data">No Data Available</td></tr>}
                {quoteRows.map(row => (
                  <tr key={row.id} className="data-row">
                    <td className="row-num"><FileText size={14} /></td>
                    <td>
                      <div className="action-cell">
                        <DocumentIconButton title="View" onClick={() => viewGeneratedQuoteDocument(row)}><Eye size={15} /></DocumentIconButton>
                        <DocumentIconButton title="Download" onClick={() => downloadGeneratedQuoteDocument(row)}><Download size={15} /></DocumentIconButton>
                        <DocumentIconButton title="Share" onClick={() => openEmailShare([emailAttachmentFromQuote(row)])}><Share2 size={15} /></DocumentIconButton>
                        <DocumentIconButton title="Print" onClick={() => alert('Feature in progress')}><Printer size={15} /></DocumentIconButton>
                      </div>
                    </td>
                    {quoteColumns.map(col => <td key={col.key} style={{ minWidth: col.minWidth }}>{renderQuoteCell(row, col)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'client' && (
        <section className="documents-grid-shell">
          <div className="documents-toolbar">
            <div className="search-input-reg">
              <span className="search-icon">&#128269;</span>
              <input placeholder="Search by Keyword" value={clientSearch} onChange={event => setClientSearch(event.target.value)} />
            </div>
            <div className="toolbar-spacer" />
            {!isPolicyContext && (
              <div className="doc-client-actions">
                <button type="button" className="btn btn-outline" disabled={selectedClientDocIds.length === 0} onClick={openClientShare}><Share2 size={14} />Share</button>
                <button type="button" className="btn btn-primary" onClick={() => { setUploadSuccessMessage(''); setShowUpload(true); }}><Plus size={14} />Add</button>
              </div>
            )}
          </div>
          {uploadSuccessMessage && <div className="doc-upload-success" role="status"><CheckCircle size={14} /><span>{uploadSuccessMessage}</span></div>}
          <div className="doc-table-wrap">
            <table className="data-table documents-table">
              <thead>
                <tr>
                  <th style={{ width: isPolicyContext ? 96 : 134 }}>Actions</th>
                  <DocumentGridHeader colKey="documentName" label="Document Name" sortable filterable={false} sort={clientSort} filters={{}} activeFilterCol={null} onSort={handleClientSort} />
                  <DocumentGridHeader colKey="uploadedOn" label="Uploaded On" sortable filterable={false} sort={clientSort} filters={{}} activeFilterCol={null} onSort={handleClientSort} />
                  <DocumentGridHeader colKey="source" label="Source" sortable filterable={false} sort={clientSort} filters={{}} activeFilterCol={null} onSort={handleClientSort} />
                </tr>
              </thead>
              <tbody>
                {clientRows.length === 0 && <tr><td colSpan={4} className="no-data">No Data Available</td></tr>}
                {clientRows.map(row => {
                  const selected = selectedClientDocIds.includes(row.id);
                  const systemDoc = row.source === 'System';
                  return (
                    <tr key={row.id} className="data-row">
                      <td>
                        <div className="action-cell doc-action-cell">
                          {!isPolicyContext && !systemDoc && <input className="doc-row-select" type="checkbox" checked={selected} onChange={() => toggleClientSelection(row.id)} aria-label={`Select ${row.documentName}`} />}
                          <DocumentIconButton title="View" onClick={() => viewDocument(row)}><Eye size={15} /></DocumentIconButton>
                          <DocumentIconButton title="Download" onClick={() => downloadDocument(row)}><Download size={15} /></DocumentIconButton>
                          {!isPolicyContext && <DocumentIconButton title={systemDoc ? 'System documents cannot be deleted' : 'Delete'} danger disabled={systemDoc} onClick={() => setUploadedDocs(current => current.filter(doc => doc.id !== row.id))}><Trash2 size={15} /></DocumentIconButton>}
                        </div>
                      </td>
                      <td><button type="button" className="doc-link doc-name" title={row.documentName}>{row.documentName}</button></td>
                      <td>{row.uploadedOn}</td>
                      <td><span className={`doc-source-badge doc-source-${row.source.toLowerCase()}`}>{row.source}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {filterPopup && (
        <FilterPopup
          colKey={filterPopup.col}
          colLabel={QUOTE_DOC_COLUMNS[filterPopup.col as QuoteDocKey]?.label ?? filterPopup.col}
          options={quoteFilterOptions(filterPopup.col)}
          current={quoteFilters[filterPopup.col] ?? null}
          anchor={filterPopup.anchor}
          onApply={filter => applyQuoteFilter(filterPopup.col, filter)}
          onClose={() => setFilterPopup(null)}
        />
      )}

      {columnPanelOpen && (
        <DocumentColumnPanel
          visibleCols={visibleQuoteCols}
          onToggle={key => setVisibleQuoteCols(current => ({ ...current, [key]: !current[key] }))}
          onClose={() => setColumnPanelOpen(false)}
          anchor={columnPanelAnchor}
        />
      )}

      {/* PRD §5.1: CancelEmailPopup — "Are you sure you want to delete the email?" */}
      {showShare && showCancelEmailPopup && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal" style={{ textAlign: 'center', maxWidth: 380, padding: 28 }} onClick={event => event.stopPropagation()}>
            <div style={{ fontSize: 32, marginBottom: 12, color: '#dc2626' }}>&#9888;</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Are you sure you want to delete the email?</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {/* "Delete" = confirm discard → closes both popups */}
              <button type="button" className="btn" style={{ background: '#dc2626', color: '#fff', minWidth: 96 }}
                onClick={closeShare}>Delete</button>
              {/* "Cancel" = keep draft → close only the confirmation popup */}
              <button type="button" className="btn btn-outline" style={{ minWidth: 96 }}
                onClick={() => setShowCancelEmailPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showShare && (
        <div className="modal-overlay" onClick={() => setShowCancelEmailPopup(true)}>
          <div className="modal documents-share-modal email-compose-modal" onClick={event => event.stopPropagation()}>
            <div className="email-compose-header">
              <span>New Email</span>
              {/* PRD §5.1: Cancel opens CancelEmailPopup, not immediate close */}
              <button type="button" className="email-compose-close" onClick={() => setShowCancelEmailPopup(true)} aria-label="Close new email">&#215;</button>
            </div>
            <div className="email-compose-body">
              <section className="email-compose-side email-compose-left" aria-label="Email metadata">
                <div className="email-field">
                  {/* PRD §6/§7.1: Email Type — NOT required */}
                  <label>Email Type</label>
                  <select value={emailType} onChange={event => setEmailType(event.target.value)}>
                    {EMAIL_TYPE_OPTIONS.map(option => <option key={option}>{option}</option>)}
                  </select>
                </div>
                <div className="email-field">
                  {/* PRD §6/§7.2: Emailed By — NOT required */}
                  <label>Emailed By</label>
                  <select value={emailedBy} onChange={event => handleEmailedByChange(event.target.value)}>
                    {EMAILED_BY_OPTIONS.map(option => <option key={option.label}>{option.label}</option>)}
                  </select>
                </div>
                <div className="email-field">
                  <label><span className="required">* </span>To</label>
                  <EmailAddressInput value={emailTo} onChange={setEmailTo} options={emailUserOptions} />
                </div>
                <div className="email-field">
                  <label><span className="required">* </span>From</label>
                  <input
                    type="email"
                    className="form-control"
                    value={emailFrom}
                    onChange={event => setEmailFrom(event.target.value)}
                    placeholder="Enter From email"
                  />
                </div>
                <div className="email-field">
                  <label>CC</label>
                  <EmailAddressInput value={emailCc} onChange={setEmailCc} options={emailUserOptions} />
                </div>
                <div className="email-field">
                  <label>BCC</label>
                  <EmailAddressInput value={emailBcc} onChange={setEmailBcc} options={emailUserOptions} />
                </div>
              </section>

              <section className="email-compose-main" aria-label="Email content">
                <div className="email-section-title">Email Content</div>
                <div className="email-field">
                  <label><span className="required">* </span>Email Subject</label>
                  <input value={emailSubject} onChange={event => setEmailSubject(event.target.value)} />
                </div>
                <div className="email-field email-body-field">
                  <label><span className="required">* </span>Email Body Text</label>
                  <div className="email-rich-editor">
                    <div className="email-editor-toolbar" aria-label="Email editor toolbar">
                      <select aria-label="Paragraph style" defaultValue="Paragraph"><option>Paragraph</option><option>Heading</option></select>
                      <button type="button" title="Bold"><Bold size={14} /></button>
                      <button type="button" title="Italic"><Italic size={14} /></button>
                      <button type="button" title="Underline"><Underline size={14} /></button>
                      <button type="button" title="Strikethrough"><Strikethrough size={14} /></button>
                      <button type="button" title="Subscript"><Subscript size={14} /></button>
                      <button type="button" title="Superscript"><Superscript size={14} /></button>
                      <button type="button" title="Clear formatting"><RemoveFormatting size={14} /></button>
                      <button type="button" title="Text color">A</button>
                      <button type="button" title="AI tools">AI</button>
                      <span className="email-toolbar-separator" />
                      <button type="button" title="Bulleted list"><List size={14} /></button>
                      <button type="button" title="Numbered list"><ListOrdered size={14} /></button>
                      <button type="button" title="Align left"><AlignLeft size={14} /></button>
                      <button type="button" title="Align center"><AlignCenter size={14} /></button>
                      <button type="button" title="Align right"><AlignRight size={14} /></button>
                      <button type="button" title="Code"><Code size={14} /></button>
                      <button type="button" title="Insert link"><Link2 size={14} /></button>
                      <button type="button" title="Insert image"><Image size={14} /></button>
                      <span className="email-toolbar-separator" />
                      <button type="button" title="Quote"><Quote size={14} /></button>
                      <button type="button" title="Table"><Table2 size={14} /></button>
                      <button type="button" title="Horizontal line"><Minus size={14} /></button>
                      <button type="button" title="Undo"><Undo2 size={14} /></button>
                      <button type="button" title="Redo"><Redo2 size={14} /></button>
                    </div>
                    <textarea
                      value={emailBody}
                      onChange={event => setEmailBody(event.target.value)}
                      placeholder="Type Your Message Here"
                      style={{ width: '100%', minHeight: '200px', padding: '8px', borderTop: '1px solid #ccc', fontFamily: 'inherit', fontSize: '14px', resize: 'vertical' }}
                    />
                  </div>
                </div>
              </section>

              <section className="email-compose-side email-compose-right" aria-label="Email attachments">
                <div className="email-section-title">Upload Document</div>
                <div
                  className={`email-upload-zone${shareUploadError ? ' upload-error' : ''}`}
                  onDragOver={event => event.preventDefault()}
                  onDrop={event => { event.preventDefault(); stageShareAttachment(event.dataTransfer.files[0]); }}
                >
                  <input ref={shareFileInputRef} className="hidden-file-input" type="file" accept=".xls,.xlsx,.jpeg,.jpg,.png,.pdf,.doc,.docx,.pages" onChange={event => stageShareAttachment(event.target.files?.[0])} />
                  <div className="email-upload-title">Drag and Drop File Here or Select a File</div>
                  <div className="email-upload-sub">Supported formats are Excel, JPEG, PNG, PDF, Doc and Pages</div>
                  <div className="email-upload-sub">Files size: 10 KB - 10 MB</div>
                  <button type="button" className="documents-browse-btn" onClick={() => shareFileInputRef.current?.click()}><FolderOpen size={14} />Browse File</button>
                </div>
                {shareUploadError && <div className="email-upload-error" role="alert">{shareUploadError}</div>}
                <div className="email-attach-divider" />
                {/* PRD §9: Attached Documents List with "Clear All" action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="email-section-title" style={{ marginBottom: 0 }}>Attached Documents List</div>
                  {emailAttachments.length > 0 && (
                    <button type="button" style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
                      onClick={() => setEmailAttachments([])}>Clear All</button>
                  )}
                </div>
                <div className="email-attachments-list">
                  {emailAttachments.length === 0 && <div className="email-attachment-empty">No attached documents</div>}
                  {emailAttachments.map(doc => (
                    <div className="email-attachment-row" key={doc.id}>
                      <Paperclip size={15} />
                      <span title={doc.documentName}>{doc.documentName}</span>
                      <button type="button" title="Preview" onClick={() => {
                        const src = clientDocs.find(d => d.id === doc.id);
                        if (src) viewDocument(src);
                      }}><Eye size={14} /></button>
                      <button type="button" title="Remove" onClick={() => setEmailAttachments(current => current.filter(item => item.id !== doc.id))}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            {(shareError || shareSent) && (
              <div className="email-compose-status">
                {shareError && <div className="doc-share-error" role="alert">{shareError}</div>}
                {shareSent && <div className="doc-share-success" role="status">Email Sent</div>}
              </div>
            )}
            <div className="email-compose-footer">
              <button type="button" className="btn btn-outline" onClick={closeShare}>{shareSent ? 'Close' : 'Cancel'}</button>
              <button type="button" className="btn btn-primary" disabled={shareSent || isSending} onClick={sendClientShare}>{isSending ? 'Sending...' : 'Send'}</button>
            </div>
          </div>
        </div>
      )}
      {/* Inline document previewer — ReactiveWebPreviewer equivalent */}
      {previewDoc && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setPreviewDoc(null)}>
          <div className="modal" style={{ width: '85vw', maxWidth: 1100, height: '85vh', display: 'flex', flexDirection: 'column', padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewDoc.name}</span>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, color: '#6b7280' }} onClick={() => setPreviewDoc(null)} aria-label="Close preview">&#215;</button>
            </div>
            <iframe
              src={previewDoc.url}
              title={previewDoc.name}
              style={{ flex: 1, border: 'none', width: '100%' }}
            />
          </div>
        </div>
      )}
      {showUpload && (
        <div className="modal-overlay" onClick={closeUpload}>
          <div className="modal documents-upload-modal" onClick={event => event.stopPropagation()}>
            <div className="documents-upload-header">
              <span>Attach Document</span>
              <button type="button" className="documents-upload-close" onClick={closeUpload} aria-label="Close attach document">&#215;</button>
            </div>
            <div className="documents-upload-body">
              <div
                className={`documents-upload-dropzone${uploadError ? ' upload-error' : ''}`}
                onDragOver={event => event.preventDefault()}
                onDrop={event => { event.preventDefault(); stageUpload(event.dataTransfer.files[0]); }}
              >
                <input ref={fileInputRef} className="hidden-file-input" type="file" accept=".xls,.xlsx,.pdf,.doc,.docx,.jpg,.jpeg,.mp4" onChange={event => stageUpload(event.target.files?.[0])} />
                <div className="upload-title">Drag and Drop File Here or Select a File</div>
                <div className="upload-sub">Supported formats are Excel, PDF, Doc, JPG, JPEG, and MP4.</div>
                <div className="upload-sub">Files size: 10 KB - 10 MB</div>
                <button type="button" className="documents-browse-btn" onClick={() => fileInputRef.current?.click()}><FolderOpen size={14} />Browse File</button>
              </div>
              {uploadFile && (
                <>
                  <div className="documents-upload-divider" />
                  <div className="documents-upload-list-title">Attached Documents List</div>
                  <div className="documents-upload-row">
                    <div className="documents-upload-clip" aria-hidden="true"><Paperclip size={18} /></div>
                    <Field label="Document Name" required><Input value={uploadDocumentName} onChange={setUploadDocumentName} /></Field>
                    <Field label="Document Type" required><DocumentTypePicker value={uploadDocumentType} onChange={setUploadDocumentType} autoOpen /></Field>
                    <Field label="Description"><Input value={uploadDescription} onChange={setUploadDescription} /></Field>
                    <button type="button" className="documents-upload-remove" onClick={resetUploadRow} aria-label="Remove attached document"><XCircle size={16} /></button>
                  </div>
                </>
              )}
              {uploadError && <div className="doc-upload-error" role="alert">{uploadError}</div>}
              {uploadFormError && <div className="doc-upload-error" role="alert">{uploadFormError}</div>}
            </div>
            <div className="documents-upload-footer">
              <button type="button" className="btn btn-outline" onClick={closeUpload}>Close</button>
              <button type="button" className="btn btn-primary" aria-disabled={!canSaveUpload} onClick={saveUpload}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const STEP_TITLES: Record<number, string> = {
  0: 'Policy Information',
  1: 'Risk Location',
  2: 'Risk Information',
  3: 'Limits & Coverages',
  4: 'Plans Overview',
  5: 'Quote Review',
  6: 'Finalize Quote',
  7: 'Documents',
  8: 'UW Specific Change',
};

function normalizedStep(raw: string | null) {
  const parsed = Number(raw);
  return [0, 1, 2, 3, 4, 5, 6, 7, 8].includes(parsed) ? parsed : 0;
}

function stepsForFlow(flow: FlowKind) {
  if (flow === 'endorsement') return [0, 1, 2, 4, 5, 6, 7];
  if (flow === 'renewal') return [0, 1, 2, 4, 8, 5, 6, 7];
  return [0, 1, 2, 3, 4, 5, 6, 7];
}

function withRecordIdentity(form: FormState, recordId?: string): FormState {
  const id = String(recordId || '').trim();
  if (!id) return form;
  const next = { ...form };
  const flow = getFlowKind(next);
  if (flow === 'policy') {
    if (!String(next.policyNumber || '').trim()) next.policyNumber = id;
    return next;
  }
  const quoteNumber = String(next.quoteNumber || '').trim();
  if (!quoteNumber || (quoteNumber === defaultForm.quoteNumber && id !== defaultForm.quoteNumber)) {
    next.quoteNumber = id;
  }
  return next;
}

export default function NewSubmission() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const readOnly = searchParams.get('readOnly') === '1';
  const [notFound, setNotFound] = useState(false);
  const [step, setStepState] = useState(normalizedStep(searchParams.get('step')));
  // Not local state — `id` is the reactive route param. handleCreate() below POSTs a new
  // submission and navigates to /submissions/{newId} without remounting this component, so
  // freezing this in useState(id || '') at first mount (when id was still undefined on the
  // /new route) left every subsequent save calling PUT /api/submissions/ with no id (405).
  const submissionId = id || '';
  const [form, setForm] = useState<FormState>(defaultForm);
  const [landingForm, setLandingForm] = useState<NewSubmissionLandingForm>(DEFAULT_LANDING_FORM);
  // Start empty, not seeded with fake placeholder data (DEFAULT_LOCATION/DEFAULT_MORTGAGE/
  // SAMPLE_ADDITIONAL_INSUREDS/SAMPLE_ADDITIONAL_ORGS below are fictional records —
  // saveSubmission() persists whatever's in these arrays unconditionally, so seeding them
  // meant every submission that reached Save (including bulk-uploaded ones, which never
  // collect this data at all) silently wrote fake mortgagee/insured/org rows to the DB).
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [mortgages, setMortgages] = useState<MortgageItem[]>([]);
  const [additionalInsureds, setAdditionalInsureds] = useState<AdditionalInsuredItem[]>([]);
  const [additionalOrgs, setAdditionalOrgs] = useState<AdditionalOrgItem[]>([]);
  const [intermediaryOptions, setIntermediaryOptions] = useState<DropdownOption[]>([]);
  const [landingProducerOptions, setLandingProducerOptions] = useState<DropdownOption[]>([]);
  const [producerOptions, setProducerOptions] = useState<DropdownOption[]>([]);
  const [showCancelMenu, setShowCancelMenu] = useState(false);
  const [showDocumentMenu, setShowDocumentMenu] = useState(false);
  const [isLoggedInUserProducer, setIsLoggedInUserProducer] = useState(false);
  const [isRenewalQuote, setIsRenewalQuote] = useState(false);
  // Step-level validation errors with format: "Provide [Field Label] to continue"
  const [step0Errors, setStep0Errors] = useState<Record<string, string>>({});
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});
  const [step3Errors, setStep3Errors] = useState<Record<string, string>>({});
  const [step4Errors, setStep4Errors] = useState<Record<string, string>>({});
  // Finalize Quote required-field errors, rendered inline under the dropdowns (PRD §4/§5)
  const [finalizeErrors, setFinalizeErrors] = useState<{ frequency?: string; party?: string }>({});
  // Document ▾ actions: Preview opens the quote document; Download opens it and
  // triggers the browser print dialog (Save as PDF); Share emails it via the backend.
  const [showShareQuote, setShowShareQuote] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareState, setShareState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [shareError, setShareError] = useState('');

  // Document Generation PRD §4.4 (DownloadQuoteOnClick): generate the Quote Proposal
  // Package via Plumsail server-side, then deliver the merged PDF to the browser.
  const [docGenBusy, setDocGenBusy] = useState(false);
  const [docGenError, setDocGenError] = useState('');

  // Original CancelOnClick2: only assigns LoadingDownload = False — the popup closes but
  // the generation flow keeps running and still delivers the file when it completes.
  function cancelQuoteDocument() {
    setDocGenBusy(false);
  }

  async function openQuoteDocument(download: boolean) {
    setDocGenError('');
    // PRD §7 rule 1: Payment Frequency must be valid before generation proceeds.
    if (!form.paymentFrequency) { setDocGenError('Provide Payment Frequency to continue'); return; }
    if (!submissionId) return;
    setDocGenBusy(true); // LoadingDownload flag — drives the "being generated" popup
    try {
      const res = await api.post(`/submissions/${submissionId}/documents/generate-quote-package`, undefined, { timeout: 120000 }).then(r => r.data);
      const bin = await api.get(`/submissions/${submissionId}/documents/generated/${res.documentId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(bin.data);
      if (download) {
        const a = document.createElement('a');
        a.href = url; a.download = res.fileName || 'Quote Proposal Package.pdf';
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
      } else {
        window.open(url, '_blank');
      }
    } catch (err: any) {
      // Plumsail generation can take longer than the request round-trip tolerates (a slow
      // poll can push this past a minute); the backend keeps working and persists the file
      // even if this request itself times out or drops. Before surfacing an error, check
      // whether a document actually landed — avoids a false "failed" when it didn't.
      try {
        const list = await api.get(`/submissions/${submissionId}/documents/generated`).then(r => r.data);
        const latest = Array.isArray(list) && list.length > 0 ? list[0] : null;
        if (latest) {
          const bin = await api.get(`/submissions/${submissionId}/documents/generated/${latest.id}`, { responseType: 'blob' });
          const url = URL.createObjectURL(bin.data);
          if (download) {
            const a = document.createElement('a');
            a.href = url; a.download = latest.fileName || 'Quote Proposal Package.pdf';
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
          } else {
            window.open(url, '_blank');
          }
          setDocGenBusy(false);
          return;
        }
      } catch {
        // fall through to the error message below
      }
      setDocGenError(err?.response?.data?.error || 'Document generation failed. Please try again.');
    }
    setDocGenBusy(false);
  }

  async function sendShareQuote() {
    if (!shareEmail.trim()) { setShareError('Enter a recipient email.'); return; }
    setShareState('sending'); setShareError('');
    try {
      await api.post(`/submissions/${submissionId}/share-quote`, {
        toEmail: shareEmail.trim(),
        subject: `Insurance Quote ${scenarioForm.quoteNumber || submissionId}`,
        html: buildQuoteDocumentHtml(scenarioForm),
      });
      setShareState('sent');
    } catch (err: any) {
      setShareState('error');
      setShareError(err?.response?.data?.error || 'Failed to send email.');
    }
  }
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [creatingSubmission, setCreatingSubmission] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const landingInsuredType = String(searchParams.get('insuredType') || '').toLowerCase() === 'business' ? 'Business' : 'Individual';
  const landingBackPath = `/quotes-policies/${landingInsuredType.toLowerCase()}/nb-quotes`;
  const showLanding = !id && String(searchParams.get('landing')) === '1';

  useEffect(() => {
    const urlStep = normalizedStep(searchParams.get('step'));
    if (urlStep !== step) setStepState(urlStep);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    async function loadIntermediaries() {
      try {
        const rows = await distributionApi.intermediaries.list();
        if (cancelled) return;
        const options = (rows as Record<string, unknown>[])
          .map(toIntermediaryOption)
          .filter((option): option is DropdownOption => option !== null);
        setIntermediaryOptions(options);

        if (options.length > 0) {
          // Only re-resolve a brokerage firm the record/user already has (by id or name) —
          // never silently pick options[0] when the field is genuinely blank. That
          // auto-select used to fill "Intermediary"/"Producer Name" with the first
          // fetched row on every brand-new submission before the user chose anything.
          setLandingForm(prev => {
            const selected = prev.brokerageFirmId != null
              ? options.find(option => option.id === prev.brokerageFirmId)
              : options.find(option => option.name === prev.brokerageFirm);
            return selected ? { ...prev, brokerageFirm: selected.name, brokerageFirmId: selected.id } : prev;
          });
          setForm(prev => {
            const selected = prev.brokerageFirmId != null
              ? options.find(option => option.id === prev.brokerageFirmId)
              : options.find(option => option.name === prev.brokerageFirm);
            return selected ? { ...prev, brokerageFirm: selected.name, brokerageFirmId: selected.id } : prev;
          });
        }
      } catch (err) {
        console.error('Failed to load intermediary options', err);
      }
    }

    loadIntermediaries();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadMyProducerInfo() {
      try {
        const result = await authApi.getMyProducer();
        if (cancelled) return;
        const { producer, intermediary } = result;
        if (producer && intermediary) {
          setIsLoggedInUserProducer(true);
          const brokerageFirmName = intermediary.intermediary_name;
          const producerFullName = `${producer.first_name} ${producer.last_name}`.trim();

          // Update landing form
          setLandingForm(prev => ({
            ...prev,
            intermediaryType: 'Brokerage',
            brokerageFirm: brokerageFirmName,
            brokerageFirmId: intermediary.id,
            producerName: producerFullName,
            producerId: producer.id,
          }));

          // Auto-populate the main form for step 0 ONLY after intermediary options are loaded
          // so the dropdown values match the options available
          if (intermediaryOptions.length > 0) {
            setForm(prev => ({
              ...prev,
              brokerageFirm: brokerageFirmName,
              brokerageFirmId: intermediary.id,
              producerName: producerFullName,
              producerId: producer.id,
              isHBProducer: true,
            }));
          } else {
            setForm(prev => ({ ...prev, isHBProducer: true }));
          }
        } else {
          setIsLoggedInUserProducer(false);
          setForm(prev => ({ ...prev, isHBProducer: false }));
        }
      } catch (err) {
        console.error('Failed to load logged-in user producer info', err);
        setIsLoggedInUserProducer(false);
      }
    }
    // Only run after intermediaryOptions are loaded
    if (intermediaryOptions.length > 0) {
      loadMyProducerInfo();
    }
    return () => { cancelled = true; };
  }, [intermediaryOptions]);

  useEffect(() => {
    let cancelled = false;
    async function loadLandingProducers() {
      const iid = landingForm.brokerageFirmId ?? intermediaryOptions.find(i => i.name === landingForm.brokerageFirm)?.id;
      if (!iid) {
        setLandingProducerOptions([]);
        setLandingForm(prev => ({ ...prev, producerName: '', producerId: null }));
        return;
      }
      try {
        const rows = await distributionApi.producers.listByIntermediary(iid);
        if (cancelled) return;
        const options = (rows as Record<string, unknown>[])
          .map(toProducerOption)
          .filter((option): option is DropdownOption => option !== null);
        setLandingProducerOptions(options);

        setLandingForm(prev => {
          let selected = prev.producerId != null
            ? options.find(option => option.id === prev.producerId)
            : null;
          // If no exact ID match, try case-insensitive name match
          if (!selected && prev.producerName) {
            const lowerName = prev.producerName.toLowerCase().trim();
            selected = options.find(option => option.name.toLowerCase().trim() === lowerName);
          }
          return selected ? { ...prev, producerName: selected.name, producerId: selected.id } : prev;
        });
      } catch (err) {
        console.error('Failed to load landing producer options', err);
        setLandingProducerOptions([]);
      }
    }
    loadLandingProducers();
    return () => { cancelled = true; };
  }, [landingForm.brokerageFirm, landingForm.brokerageFirmId, intermediaryOptions]);

  useEffect(() => {
    let cancelled = false;
    async function loadProducers() {
      const iid = form.brokerageFirmId ?? intermediaryOptions.find(i => i.name === form.brokerageFirm)?.id;
      if (!iid) {
        setProducerOptions([]);
        setForm(prev => ({ ...prev, producerName: '', producerId: null }));
        return;
      }
      try {
        const rows = await distributionApi.producers.listByIntermediary(iid);
        if (cancelled) return;
        const options = (rows as Record<string, unknown>[])
          .map(toProducerOption)
          .filter((option): option is DropdownOption => option !== null);
        setProducerOptions(options);

        setForm(prev => {
          let selected = prev.producerId != null
            ? options.find(option => option.id === prev.producerId)
            : null;
          // If no exact ID match, try case-insensitive name match
          if (!selected && prev.producerName) {
            const lowerName = prev.producerName.toLowerCase().trim();
            selected = options.find(option => option.name.toLowerCase().trim() === lowerName);
          }
          return selected ? { ...prev, producerName: selected.name, producerId: selected.id } : prev;
        });
      } catch (err) {
        console.error('Failed to load producer options', err);
        setProducerOptions([]);
      }
    }
    loadProducers();
    return () => { cancelled = true; };
  }, [form.brokerageFirm, form.brokerageFirmId, intermediaryOptions]);

  useEffect(() => {
    if (form.effectiveDate && !form.expirationDate) {
      setForm(prev => ({ ...prev, expirationDate: addOneYear(form.effectiveDate) }));
    }
  }, [form.effectiveDate]);

  useEffect(() => {
    let cancelled = false;
    async function loadSubmission() {
      if (!id) {
        setForm(applyPlanScenarioDefaults(defaultForm));
        setLandingForm(DEFAULT_LANDING_FORM);
        return;
      }
      try {
        const submission = await quotesPoliciesApi.getSubmission(id);
        if (cancelled) return;
        console.log('Submission loaded:', { id: submission.id, dataJson: submission.dataJson?.substring?.(0, 100) });
        const data: any = { id: submission.id, status: submission.status, ...JSON.parse(submission.dataJson || '{}') };
        console.log('Parsed submission data:', { hasForm: !!data.form, formKeys: data.form ? Object.keys(data.form) : [] });

        // Detect renewal quotes
        const isRenewal = data.isRenewal === true || data.isRenewal === 'true';
        setIsRenewalQuote(isRenewal);

        // Merge form data - renewal policies may not have a form property, so create merged from data
        let formData = data.form || data;
        const merged = {
          ...defaultForm,
          ...withoutNullishValues<FormState>(formData),
          recordStatus: data.status ?? formData?.recordStatus ?? defaultForm.recordStatus,
          lockSubmission: readOnly || isReadOnlySubmission(data),
        } as FormState;

        // For renewals, fetch and merge prior policy data
        if (isRenewal && data.renewalOfPolicyId) {
          try {
            const priorPolicySubmission = await quotesPoliciesApi.getSubmission(String(data.renewalOfPolicyId));
            if (cancelled || !priorPolicySubmission) throw new Error('Prior policy not found');

            const priorData = { ...JSON.parse(priorPolicySubmission.dataJson || '{}') };
            const priorFormData = priorData.form || priorData;

            // Merge prior policy fields into renewal - don't override existing renewal data
            const priorFields = withoutNullishValues<Partial<FormState>>(priorFormData);
            for (const [key, value] of Object.entries(priorFields)) {
              const currentVal = (merged as any)[key];
              // Only merge if current value is empty/default
              if (currentVal === '' || currentVal === null || currentVal === undefined || currentVal === 'No') {
                (merged as any)[key] = value;
              }
            }
          } catch (err) {
            console.error('Failed to fetch prior policy data for renewal', err);
          }
        }

        // For renewals, set screenCode so getFlowKind detects it properly
        if (isRenewal) {
          const insuredType = String(merged.insuredType || 'Individual').toUpperCase();
          merged.screenCode = `RENEWAL${insuredType}`;
          merged.policyType = 'RENEWAL';
          (merged as any).isRenewal = true;
        }

        if (data.form || isRenewal) {

          // Auto-detect bulk-uploaded submissions by checking isQuickQuote flag (handle both boolean and string)
          const isQuickQuote = (merged.isQuickQuote as any) === true || String(merged.isQuickQuote) === 'true';
          if (!merged.isBulkUploaded && isQuickQuote) {
            merged.isBulkUploaded = true;
          }
          const coercedForm = coerceFormBooleans(merged);
          setForm(withRecordIdentity(applyPlanScenarioDefaults(coercedForm), data.id ?? id));
        }
        if (Array.isArray(data.locations)) setLocations(data.locations);
        if (Array.isArray(data.mortgages)) setMortgages(data.mortgages);
        if (Array.isArray(data.additionalInsureds)) setAdditionalInsureds(data.additionalInsureds);
        if (Array.isArray(data.additionalOrgs)) setAdditionalOrgs(data.additionalOrgs);
        // GetHBISLimitsandCoverages: the Limits & Coverages screen's data comes from the
        // DB with the OutSystems empty-value defaults applied. Only fields the draft left
        // blank are overlaid, so in-progress wizard edits are never clobbered.
        try {
          const lc = await quotesPoliciesApi.getLimitsAndCoverages(data.id ?? id);
          if (!cancelled && lc) {
            const draftForm = data.form ?? {};
            const lcFieldMap: Partial<Record<keyof FormState, string>> = {
              coverageLevel: lc.coverageLevel,
              liabilityAmount: lc.liabilityCoverage,
              excessBlanketLiabilities: lc.excessBlanketPL,
              sinkhole: lc.sinkholeCatastrophicGroundCollapse,
              earthquake: lc.earthquake,
              flood: lc.flood,
              windHail: lc.windHail,
              wildfire: lc.wildFire,
              resWorkerMedical: lc.residentWorkerNFM,
              farmingEndorsement: lc.smallScaleFarmingEndorsement,
              landlordEndorsement: lc.landlordEndorsement,
              homeOfficeEndorsement: lc.homeOfficeEndorsement,
              priorPolicyPremium: lc.priorPolicyPeriodPremium,
              policyFee: lc.policyFee != null ? String(lc.policyFee) : undefined,
            };
            setForm(prev => {
              const next = { ...prev };
              for (const [key, value] of Object.entries(lcFieldMap)) {
                const draftValue = draftForm[key];
                if (value != null && value !== '' && (draftValue == null || draftValue === '')) {
                  (next as any)[key] = value;
                }
              }
              return next;
            });
          }
        } catch (err) {
          console.error('Failed to load limits and coverages', err);
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          // Previously only surfaced for readOnly, so an edit-mode 404 (e.g. navigating
          // with a quote number instead of the real Submission id) silently fell through to
          // the blank default form — the next Save then minted a brand-new Submission row at
          // that id, orphaning the real draft. Surface it the same way in both modes.
          setNotFound(true);
        } else {
          console.error('Failed to load submission', err);
        }
      }
    }
    loadSubmission();
    return () => { cancelled = true; };
  }, [id]);

  async function handleCreate() {
    setCreateError(null);
    setCreatingSubmission(true);

    const draftForm: FormState = applyPlanScenarioDefaults({
      ...defaultForm,
      insuredType: landingInsuredType,
      screenCode: `NEWBUSINESS${landingInsuredType.toUpperCase()}`,
      writingCompany: defaultForm.writingCompany,
      brokerageFirm: landingForm.brokerageFirm,
      brokerageFirmId: landingForm.brokerageFirmId,
      producerName: landingForm.producerName,
      producerId: landingForm.producerId,
      effectiveDate: landingForm.effectiveDate,
      lob: landingForm.lob,
      subProduct: landingForm.subProduct,
      country: landingForm.country,
      state: landingForm.primaryState,
      policyType: 'NEWBUSINESS',
      quoteNumber: '',
      policyNumber: '',
      recordStatus: 'Draft',
      isQuickQuote: landingForm.typeOfQuote === 'Quick',
    });
    draftForm.quoteNumber = '';
    draftForm.policyNumber = '';

    try {
      const payload = JSON.stringify({
        form: draftForm,
        locations,
        mortgages,
        additionalInsureds,
        additionalOrgs,
      });
      const submission = await quotesPoliciesApi.createSubmission({ dataJson: payload });
      navigate(`/quotes-policies/submissions/${submission.id}?step=0`);
    } catch (err: any) {
      console.error('Failed to create submission', err);
      const serverMessage = err?.response?.data?.error || err?.message || 'Unable to create submission. Please try again.';
      setCreateError(typeof serverMessage === 'string' ? serverMessage : 'Unable to create submission. Please try again.');
    } finally {
      setCreatingSubmission(false);
    }
  }

  function withoutNullishValues<T extends Record<string, any>>(obj: T | undefined): Partial<T> {
    if (!obj) return {};
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== null && value !== undefined)) as Partial<T>;
  }

  function isReadOnlySubmission(data: any) {
    const status = data?.status ?? data?.form?.recordStatus;
    const policyType = String(data?.form?.policyType ?? data?.form?.screenCode ?? '').toUpperCase();
    return policyType.startsWith('POLICY') || ['Submitted', 'Bound', 'Active', 'Cancelled', 'Expired', 'Lapsed'].includes(status) || booleanValue(data?.form?.lockSubmission);
  }

  function goToStep(next: number) {
    // Belt-and-braces: WizardSidebar already hides step buttons that don't apply to this
    // flow (e.g. Limits & Coverages for endorsement/renewal — see stepsForFlow), but never
    // let a stale/mis-seeded screenCode land the wizard on a step it can't actually render
    // correctly for this flow.
    if (!stepsForFlow(flow).includes(next)) return;
    setStepState(next);
    const params = new URLSearchParams(searchParams);
    params.set('step', String(next));
    setSearchParams(params, { replace: true });
  }

  function set(k: keyof FormState, v: any) {
    setForm(f => {
      const next = { ...f, [k]: v } as FormState;
      if (['dwellingLimit', 'appurtenantLimit', 'personalAssetsLimit', 'occupancyDisruptionLimit'].includes(String(k))) {
        next.totalInsuredValues = formatNumberValue(totalInsuredValue(next));
      }
      return next;
    });
  }

  function previousStep() {
    const order = stepsForFlow(flow);
    const idx = order.indexOf(step);
    return idx <= 0 ? step : order[idx - 1];
  }

  function nextStep() {
    const order = stepsForFlow(flow);
    const idx = order.indexOf(step);
    return idx === -1 || idx >= order.length - 1 ? step : order[idx + 1];
  }

  // Validation functions for each step - return errors object, empty if valid
  function validateStep0(): Record<string, string> {
    const errors: Record<string, string> = {};
    const isPersonType = PERSON_INSURED_TYPES.has(form.insuredType);

    // Policy Details - all mandatory
    if (!form.effectiveDate) errors.effectiveDate = 'Provide Effective Date to continue';
    if (!form.policyTerm) errors.policyTerm = 'Provide Policy Term to continue';
    if (!form.insuredType) errors.insuredType = 'Provide Type of Primary Insured to continue';

    // Brokerage & Producer - all mandatory
    if (!form.brokerageFirmId) errors.brokerageFirmId = 'Provide Brokerage Firm to continue';
    if (!form.producerId && !form.producerName) errors.producerId = 'Provide Producer Name to continue';

    // Primary Insured - all mandatory
    if (isPersonType) {
      if (!form.firstName) errors.firstName = 'Provide First Name to continue';
      if (!form.lastName) errors.lastName = 'Provide Last Name to continue';
      if (!form.age65OrOlder) errors.age65OrOlder = 'Provide age information to continue';
    } else {
      if (!form.organizationName) errors.organizationName = 'Provide Organization Name to continue';
    }

    // Mailing Address - all mandatory
    if (!form.country) errors.country = 'Provide Country to continue';
    if (!form.state) errors.state = 'Provide State to continue';
    if (!form.city) errors.city = 'Provide City to continue';
    if (!form.zip) errors.zip = 'Provide Zip Code to continue';

    // LOB & Product - all mandatory
    if (!form.lob) errors.lob = 'Provide Line of Business to continue';
    if (!form.subProduct) errors.subProduct = 'Provide Sub-Product to continue';

    return errors;
  }

  function validateStep1(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (locations.length === 0) {
      errors.locations = 'Provide at least one location to continue';
    }
    return errors;
  }

  function validateStep2(): Record<string, string> {
    const errors: Record<string, string> = {};
    // Risk information step - validate any conditional mandatory fields
    return errors;
  }

  function validateStep3(): Record<string, string> {
    const errors: Record<string, string> = {};
    // Limits & Coverages step - validate mandatory coverage selections
    return errors;
  }

  function validateStep4(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!form.selectedPlan) errors.selectedPlan = 'Provide a plan selection to continue';
    return errors;
  }

  async function saveSubmission(nextStepValue?: number, closeAfterSave = false) {
    console.log('saveSubmission called with nextStepValue:', nextStepValue, 'currentStep:', step);
    // Validate current step before saving or navigating
    if (nextStepValue !== undefined && nextStepValue > step) {
      // User clicked Save & Next - validate before navigating
      let stepErrors: Record<string, string> = {};
      switch (step) {
        case 0:
          stepErrors = validateStep0();
          console.log('Step 0 validation errors:', stepErrors);
          setStep0Errors(stepErrors);
          break;
        case 1:
          stepErrors = validateStep1();
          setStep1Errors(stepErrors);
          break;
        case 2:
          stepErrors = validateStep2();
          setStep2Errors(stepErrors);
          break;
        case 3:
          stepErrors = validateStep3();
          setStep3Errors(stepErrors);
          break;
        case 4:
          stepErrors = validateStep4();
          setStep4Errors(stepErrors);
          break;
      }
      if (Object.keys(stepErrors).length > 0) {
        // Validation failed - do not save or navigate
        return;
      }
    } else if (nextStepValue === undefined) {
      // User clicked Save (not Save & Next) - light validation
      let stepErrors: Record<string, string> = {};
      switch (step) {
        case 0:
          stepErrors = validateStep0();
          setStep0Errors(stepErrors);
          break;
        case 1:
          stepErrors = validateStep1();
          setStep1Errors(stepErrors);
          break;
      }
      if (Object.keys(stepErrors).length > 0) {
        // Even Save needs validation to prevent invalid state
        return;
      }
    }

    // PRD §4/§5 (Finalize Quote): Save & Next is blocked with inline errors under the
    // dropdowns until both required selections are made.
    if (step === 6 && nextStepValue !== undefined && nextStepValue > 6) {
      const errors: { frequency?: string; party?: string } = {};
      if (!form.paymentFrequency) errors.frequency = 'Provide Payment Frequency to continue';
      if (!form.responsibleParty) errors.party = 'Provide Responsible Party to continue';
      setFinalizeErrors(errors);
      if (errors.frequency || errors.party) return;
    } else {
      setFinalizeErrors({});
    }
    setSaveState('saving');
    try {
      const nextStatus = flow === 'policy' ? valueOrFallback(form.recordStatus, 'Active') : booleanValue(form.lockSubmission) ? 'Submitted' : valueOrFallback(form.recordStatus, 'Draft');
      const formForSave = withRecordIdentity(form, submissionId);
      const dataJson = JSON.stringify({
        form: { ...formForSave, recordStatus: nextStatus },
        locations,
        mortgages,
        additionalInsureds,
        additionalOrgs,
      });
      const submission = await quotesPoliciesApi.updateSubmission(submissionId, { status: nextStatus, dataJson });
      const data: any = { id: submission.id, status: submission.status, ...JSON.parse(submission.dataJson || '{}') };
      setForm(f => withRecordIdentity(applyPlanScenarioDefaults(coerceFormBooleans({ ...f, ...withoutNullishValues<FormState>(data.form), recordStatus: data.status ?? nextStatus, lockSubmission: isReadOnlySubmission(data) } as FormState)), data.id ?? submissionId));
      setSaveState('saved');
      if (typeof nextStepValue === 'number') goToStep(nextStepValue);
      if (closeAfterSave) {
        window.setTimeout(() => navigate(nbQuotesBackPath), 800);
      }
      window.setTimeout(() => setSaveState('idle'), 1500);
    } catch (err) {
      console.error('Failed to save submission', err);
      setSaveState('error');
    }
  }

  const scenarioForm = applyPlanScenarioDefaults(form);
  const flow = getFlowKind(scenarioForm);
  const flowCopy = getFlowCopy(scenarioForm);
  const personDisplayName = [scenarioForm.firstName, scenarioForm.middleName, scenarioForm.lastName].filter(Boolean).join(' ');

  if (showLanding) {
    return (
      <div className="qp-scope" style={{ display: 'flex', height: '100%' }}>
        <NewSubmissionLanding
          form={landingForm}
          setForm={setLandingForm}
          onCancel={() => navigate(landingBackPath)}
          onCreate={handleCreate}
          isCreating={creatingSubmission}
          error={createError}
          intermediaryOptions={intermediaryOptions}
          producerOptions={landingProducerOptions}
          isProducer={isLoggedInUserProducer}
        />
      </div>
    );
  }
  const orgDisplayName = scenarioForm.organizationName || scenarioForm.doingBusinessAs;
  // No fictional fallback names — a fresh quote shows a neutral placeholder until the
  // insured is actually entered in Step 1.
  const insuredName = PERSON_INSURED_TYPES.has(scenarioForm.insuredType) ? (personDisplayName || '-') : (orgDisplayName || personDisplayName || '-');
  const recordId = flow === 'policy' ? valueOrFallback(scenarioForm.policyNumber, submissionId) : valueOrFallback(scenarioForm.quoteNumber, submissionId);
  const currentStatus = valueOrFallback(scenarioForm.recordStatus, flow === 'policy' ? 'Active' : 'Draft');
  const contextDate = flow === 'endorsement' ? valueOrFallback(scenarioForm.endorsementEffectiveDate, scenarioForm.effectiveDate) : scenarioForm.effectiveDate;
  const isPolicyFlow = flow === 'policy';
  const isEndorsementFlow = flow === 'endorsement';
  const currentNextStep = nextStep();
  const currentPreviousStep = previousStep();
  const atLastStep = currentNextStep === step;
  const insuredTypeSegment = String(scenarioForm.insuredType).toLowerCase() === 'business' ? 'business' : 'individual';
  const policyBackPath = `/quotes-policies/${insuredTypeSegment}/policies`;
  const nbQuotesBackPath = `/quotes-policies/${insuredTypeSegment}/nb-quotes`;

  async function handleBind() {
    if (!submissionId) throw new Error('Submission ID is required to bind.');
    await api.post(`/submissions/${submissionId}/bind`);
    set('recordStatus', 'Bound');
  }

  // Cancel ▾ → Delete Quote: irreversible, so confirm before calling the API.
  async function handleDeleteQuote() {
    if (!submissionId) return;
    if (!window.confirm('Delete this quote? This cannot be undone.')) return;
    try {
      await quotesPoliciesApi.deleteSubmission(submissionId);
      navigate(nbQuotesBackPath);
    } catch (err) {
      console.error('Failed to delete submission', err);
    }
  }

  // IssueOnClick server call → IssuePolicyHB_BL; response carries the generated policy
  // number and POLICYINDIVIDUAL/POLICYBUSINESS screen code (RefreshClientVariable).
  async function handleIssue() {
    if (!submissionId) throw new Error('Submission ID is required to issue policy.');
    const { data } = await api.post(`/submissions/${submissionId}/issue`);
    set('recordStatus', 'Active');
    set('policyType', 'POLICY');
    set('lockSubmission', true);
    if (data?.policyNumber) set('policyNumber', data.policyNumber);
    if (data?.policyType) set('screenCode', data.policyType);
    return data as { policyNumber?: string; message?: string };
  }

  // Endorsement flow: IssueEndorsementOnClick — skips Bind, issues endorsement directly.
  // Activates this draft as the policy's new Active record and cancels the prior policy
  // it was drafted against (see SubmissionRepository.IssueEndorsementAsync).
  async function handleIssueEndorsement() {
    if (!submissionId) throw new Error('Submission ID is required to issue endorsement.');
    const { data } = await api.post(`/submissions/${submissionId}/issue-endorsement`);
    set('recordStatus', 'Active');
    set('policyType', 'POLICY');
    set('lockSubmission', true);
    if (data?.policyType) set('screenCode', data.policyType);
    return data as { policyNumber?: string; message?: string };
  }

  async function handleDecline(reason: string) {
    await api.post(`/submissions/${submissionId}/decline`, { declinedReason: reason });
    set('recordStatus', 'Declined');
  }

  if (notFound) {
    return (
      <div className="qp-scope" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>No Data Available</div>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="qp-scope" style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
      <WizardSidebar submissionId={recordId} status={currentStatus} currentStep={step} onStepClick={goToStep} screenCode={scenarioForm.screenCode} recordLabel={flowCopy.recordLabel} />

      <div className="wizard-page" style={{ flex: 1 }}>
        <div className="wizard-breadcrumb">
          <strong>{flowCopy.title}</strong>
          <span>{isPolicyFlow ? `Home > ${flowCopy.breadcrumb}` : flowCopy.breadcrumb}</span>
          {flowCopy.breadcrumbSubtext && <em>{flowCopy.breadcrumbSubtext}</em>}
        </div>

        <div className="wizard-context-bar">
          <div className="ctx-item"><span className="ctx-icon">&#127968;</span><span className="ctx-label">{valueOrFallback(scenarioForm.lob, 'E&S Homeowners')} : {valueOrFallback(scenarioForm.subProduct, 'SuperPerils')}</span></div>
          <div className="ctx-item"><span className="ctx-icon">&#128197;</span><span className="ctx-label">{flowCopy.dateLabel} : {contextDate}</span></div>
          <div className="ctx-item"><span className="ctx-icon">&#128100;</span><span className="ctx-label">Named Insured : {insuredName}</span></div>
        </div>

        {step !== 5 && <div style={{ padding: '16px 24px 0', fontWeight: 700, fontSize: 16, color: '#111827' }}>{STEP_TITLES[step] ?? 'Plans Overview'}</div>}

        <div className="wizard-content">
          {step === 0 && <StepPolicyInfo form={scenarioForm} set={set} additionalInsureds={additionalInsureds} setAdditionalInsureds={setAdditionalInsureds} additionalOrgs={additionalOrgs} setAdditionalOrgs={setAdditionalOrgs} intermediaryOptions={intermediaryOptions} producerOptions={producerOptions} isLoggedInUserProducer={isLoggedInUserProducer} isRenewalQuote={isRenewalQuote} errors={step0Errors} setErrors={setStep0Errors} />}
          {step === 1 && <StepLocation form={scenarioForm} set={set} locations={locations} setLocations={setLocations} />}
          {step === 2 && <StepRiskInfo form={scenarioForm} set={set} mortgages={mortgages} setMortgages={setMortgages} isLoggedInUserProducer={isLoggedInUserProducer} isRenewalQuote={isRenewalQuote} />}
          {step === 3 && <StepLimits form={scenarioForm} set={set} isLoggedInUserProducer={isLoggedInUserProducer} />}
          {step === 4 && <StepPlans form={scenarioForm} set={set} />}
          {step === 5 && <StepQuoteReview form={scenarioForm} onEdit={() => goToStep(0)} />}
          {step === 6 && <StepFinalize form={scenarioForm} set={set} submissionId={submissionId} flow={flow} onBind={handleBind} onIssue={handleIssue} onIssueEndorsement={handleIssueEndorsement} onDecline={handleDecline} onEdit={() => goToStep(0)} onPolicySummary={() => navigate(policyBackPath)} finalizeErrors={finalizeErrors} />}
          {step === 7 && <StepDocuments form={scenarioForm} flow={flow} submissionId={submissionId} />}
          {step === 8 && <StepUWSpecific form={scenarioForm} isRenewal={isRenewalQuote} />}
        </div>

        <div className="wizard-footer">
          {isPolicyFlow ? (
            <>
              <button className="btn btn-outline" onClick={() => navigate(policyBackPath)}>Back to Policy Summary</button>
              <div className="wizard-footer-right">
                <button className="btn btn-outline" disabled={currentPreviousStep === step} onClick={() => goToStep(currentPreviousStep)}>Previous</button>
                {step !== 7 && <button className="btn btn-primary" disabled={atLastStep} onClick={() => goToStep(currentNextStep)}>Next</button>}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                {(step === 5 || step === 6 || step === 7) && (
                  <div style={{ position: 'relative' }}>
                    <button className="btn btn-outline" style={{ display: 'flex', gap: 4, alignItems: 'center' }} disabled={docGenBusy} onClick={() => setShowDocumentMenu(v => !v)}>
                      {docGenBusy ? 'Generating...' : <>Document &#8964;</>}
                    </button>
                    {showDocumentMenu && (
                      <div className="dropdown-menu" onClick={() => setShowDocumentMenu(false)}>
                        <div className="dropdown-item" onClick={() => openQuoteDocument(true)}>Download Quote</div>
                        <div className="dropdown-item" onClick={() => { setShareEmail(''); setShareState('idle'); setShareError(''); setShowShareQuote(true); }}>Share Quote</div>
                        <div className="dropdown-item" onClick={() => openQuoteDocument(false)}>Preview Quote</div>
                      </div>
                    )}
                    {docGenError && (
                      <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 6, whiteSpace: 'nowrap', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12, padding: '6px 10px', borderRadius: 6, zIndex: 50 }}>
                        {docGenError}
                      </div>
                    )}
                  </div>
                )}
                {/* Reference UI: "document is being generated" popup with Cancel, shown while
                    the Plumsail generation + download flow runs (~2 minutes). */}
                {docGenBusy && (
                  <div className="modal-overlay">
                    <div className="modal" style={{ textAlign: 'center', padding: '28px 36px', maxWidth: 420 }}>
                      <div style={{ fontSize: 44, marginBottom: 14, position: 'relative', display: 'inline-block' }}>
                        &#128194;
                        {/* green status dot orbits the folder while generation is in progress */}
                        <span className="docgen-orbit"><span className="docgen-dot" /></span>
                      </div>
                      <div style={{ fontSize: 14, color: '#111827', lineHeight: 1.5, marginBottom: 4 }}>
                        Your 268 page document is being generated. This will take approximately 2 minute to generate and download.
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Please wait...</div>
                      <button className="btn btn-outline-blue" style={{ fontSize: 13 }} onClick={cancelQuoteDocument}>Cancel</button>
                    </div>
                  </div>
                )}
                {showShareQuote && (
                  <div className="modal-overlay" onClick={() => setShowShareQuote(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                      <div className="modal-title">
                        Share Quote
                        <button className="modal-close" onClick={() => setShowShareQuote(false)}>&#215;</button>
                      </div>
                      {shareState === 'sent' ? (
                        <div style={{ padding: '16px 0', fontSize: 13 }}>
                          <span style={{ color: '#15803d', fontWeight: 600 }}>&#10003; Quote sent to {shareEmail}</span>
                        </div>
                      ) : (
                        <>
                          <div style={{ padding: '16px 0' }}>
                            <Field label="Recipient Email" required>
                              <Input value={shareEmail} onChange={setShareEmail} placeholder="name@example.com" />
                            </Field>
                            {shareError && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{shareError}</div>}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button className="btn btn-outline" onClick={() => setShowShareQuote(false)}>Cancel</button>
                            <button className="btn btn-primary" disabled={shareState === 'sending'} onClick={sendShareQuote}>
                              {shareState === 'sending' ? 'Sending...' : 'Send'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              <div style={{ position: 'relative' }}>
                <button className="btn btn-outline" style={{ display: 'flex', gap: 4, alignItems: 'center' }} onClick={() => setShowCancelMenu(v => !v)}>
                  {step === 4 ? 'Close' : 'Cancel'} &#8964;
                </button>
                {showCancelMenu && (
                  <div className="dropdown-menu" onClick={() => setShowCancelMenu(false)}>
                    <div className="dropdown-item" style={{ color: '#dc2626' }} onClick={() => navigate(nbQuotesBackPath)}>Close Quote</div>
                    {step !== 7 && <div className="dropdown-item" style={{ color: '#dc2626' }}>Decline Quote</div>}
                    {step !== 7 && <div className="dropdown-item" style={{ color: '#dc2626' }} onClick={handleDeleteQuote}>Delete Quote</div>}
                  </div>
                )}
              </div>
              </div>
              <div className="wizard-footer-right">
                <button
                  className="btn btn-outline"
                  onClick={() => step === 0 ? navigate(nbQuotesBackPath) : goToStep(currentPreviousStep)}
                  disabled={false}
                >
                  Previous
                </button>
                {step === 3 && !scenarioForm.isBulkUploaded && scenarioForm.insuredType === 'Business' ? (
                  <button className="btn btn-primary" onClick={() => saveSubmission(undefined, true)} disabled={saveState === 'saving'}>{saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved Successfully' : saveState === 'error' ? 'Retry Save' : 'Save'}</button>
                ) : (
                  <>
                    <button className="btn btn-outline" onClick={() => saveSubmission()} disabled={saveState === 'saving'}>{saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Retry Save' : 'Save'}</button>
                    {isEndorsementFlow && step === 4 && <button className="btn btn-outline-blue" onClick={() => saveSubmission(5)} disabled={saveState === 'saving'}>Go to Quote Review</button>}
                    {!atLastStep && <button className="btn btn-primary" onClick={() => saveSubmission(currentNextStep)} disabled={saveState === 'saving'}>Save &amp; Next</button>}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
