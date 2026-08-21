import type { IntermediaryListItem, IntermediaryListResult, IntermediaryRecord } from '../../types/Distribution';

export const MOCK_ITEMS: IntermediaryListItem[] = [];

// ── Mock record generation ─────────────────────────────────────────────────────

const ALL_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

const STATE_CITIES: Record<string, string[]> = {
  FL: ['Miami','Orlando','Tampa'], GA: ['Atlanta','Savannah'],
  PA: ['Philadelphia','Pittsburgh'], CA: ['Los Angeles','San Francisco'],
  AL: ['Birmingham','Montgomery'], OR: ['Portland','Eugene'],
  NY: ['New York','Buffalo'], CO: ['Denver','Colorado Springs'],
  TX: ['Houston','Dallas'], IL: ['Chicago','Naperville'],
  KS: ['Wichita','Topeka'], AZ: ['Phoenix','Scottsdale'],
  NJ: ['Newark','Trenton'], WA: ['Seattle','Spokane'], WI: ['Milwaukee','Madison'],
};

const STATE_ZIPS: Record<string, string> = {
  FL: '33101', GA: '30301', PA: '19101', CA: '90001', AL: '35201',
  OR: '97201', NY: '10001', CO: '80201', TX: '77001', IL: '60601',
  KS: '67201', AZ: '85001', NJ: '07101', WA: '98101', WI: '53201',
};

const ADDR_STREETS = [
  '100 Corporate Drive', '200 Business Park Blvd', '350 Commerce Way',
  '500 Enterprise Avenue', '750 Industrial Pkwy', '1200 Executive Drive',
];

const ENTITY_BY_TYPE: Record<string, string[]> = {
  MGA: ['LLC','Inc.'], Broker: ['LLC'], Carrier: ['Inc.','Corp.'],
  Agency: ['LLC','Corp.'], Brokerage: ['LLC'], Other: ['LLC','Inc.'],
};

const SECONDARY_NAMES = ['John Harrington','Susan Calloway','Mark Ellison','Carol Stanton',
  'David Kim','Michelle Ortega','Brian Waters','Nancy Patel'];
const SECONDARY_TITLES = ['VP','Director','Manager','Supervisor','Associate Director'];

const PRODUCER_FIRST = ['James','Michael','Robert','William','David','Richard','Joseph','Thomas',
  'Sarah','Jennifer','Linda','Patricia','Barbara','Elizabeth','Susan','Jessica'];
const PRODUCER_LAST  = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis',
  'Wilson','Martinez','Anderson','Taylor','Thomas','Jackson','White','Harris'];

function pick<T>(arr: T[], seed: number): T { return arr[seed % arr.length]; }

function mockPhone(seed: number): string {
  return `(${200 + (seed % 700)}) ${100 + (seed * 7 % 899)}-${String(1000 + (seed * 13 % 9000))}`;
}

function makeMockStep1(item: IntermediaryListItem, seed: number) {
  const entities = ENTITY_BY_TYPE[item.intermediaryType] ?? ['LLC'];
  const city      = pick(STATE_CITIES[item.residentState] ?? ['Springfield'], seed);
  const zip       = STATE_ZIPS[item.residentState] ?? '10001';
  const street    = pick(ADDR_STREETS, seed + 1);
  const legalEntity = pick(entities, seed + 2);

  const nrCount = (seed % 3) + 2;
  const available = ALL_STATES.filter(s => s !== item.residentState);
  const nrStates = Array.from({ length: nrCount }, (_, i) => {
    const st = available[(seed + i * 7) % available.length];
    return { id: `nr${i + 1}`, state: st, license: `NRL-${st}${String(item.id).padStart(4,'0')}` };
  });

  const slug = item.name.toLowerCase().replace(/[^a-z]/g, '');
  const contacts = [
    {
      id: 'c1', isAlsoProducer: false,
      name: item.primaryContactName ?? '', title: item.primaryContactTitle ?? '',
      email: `${(item.primaryContactName ?? 'contact').split(' ')[0].toLowerCase()}@${slug}.com`,
      phone: mockPhone(seed), extension: '', altPhone: '',
    },
    {
      id: 'c2', isAlsoProducer: false,
      name: pick(SECONDARY_NAMES, seed + 5), title: pick(SECONDARY_TITLES, seed + 3),
      email: `secondary@${slug}.com`,
      phone: mockPhone(seed + 11), extension: '', altPhone: '',
    },
  ];

  return {
    form: {
      status: item.status !== 'Inactive',
      name: item.name, dba: '', legalEntity,
      federalTaxId: item.federalTaxId, intermediaryType: item.intermediaryType,
      country: 'USA', residentState: item.residentState,
      licenseNumber: `LIC-${String(item.id).padStart(6,'0')}`,
      addrLine1: street, addrLine2: '', addrCountry: 'USA',
      addrState: item.residentState, city, county: '', zipCode: zip,
    },
    contacts,
    nrStates,
  };
}

function makeMockModules(seed: number) {
  const hasWrite = seed % 3 !== 0;
  function p(v: boolean, a: boolean, e: boolean, d = false) {
    return { view: v, add: a, edit: e, clone: false, upload: false, download: d,
      sensitiveData: false, sensitiveDocs: false, approveReject: false };
  }
  return [
    {
      id: 'm1', name: 'Dashboard', expanded: false, readOnly: false, allAccess: false,
      subGroups: [{ id: 'sg11', name: 'Analytics Overview', features: [
        { id: 'f111', name: 'KPI Cards',     perms: p(true, false, false) },
        { id: 'f112', name: 'Activity Feed', perms: p(true, false, false) },
      ]}],
    },
    {
      id: 'm2', name: 'Quotes & Policies', expanded: false, readOnly: false, allAccess: false,
      subGroups: [
        { id: 'sg21', name: 'New Business', features: [
          { id: 'f211', name: 'Submit Quote', perms: p(true, hasWrite, hasWrite) },
          { id: 'f212', name: 'Bind Policy',  perms: p(true, hasWrite, false) },
        ]},
        { id: 'sg22', name: 'Renewals', features: [
          { id: 'f221', name: 'View Renewals',    perms: p(true, false, false) },
          { id: 'f222', name: 'Process Renewal',  perms: p(true, hasWrite, hasWrite) },
        ]},
      ],
    },
    {
      id: 'm3', name: 'Distribution Management', expanded: false, readOnly: false, allAccess: false,
      subGroups: [{ id: 'sg31', name: 'Intermediaries', features: [
        { id: 'f311', name: 'View Intermediaries',   perms: p(true, false, false) },
        { id: 'f312', name: 'Manage Intermediaries', perms: p(true, hasWrite, hasWrite) },
      ]}],
    },
    {
      id: 'm4', name: 'Reports', expanded: false, readOnly: false, allAccess: false,
      subGroups: [{ id: 'sg41', name: 'Standard Reports', features: [
        { id: 'f411', name: 'View Reports',   perms: p(true, false, false, true) },
        { id: 'f412', name: 'Custom Reports', perms: p(true, hasWrite, false, true) },
      ]}],
    },
  ];
}

const PRODUCT_SETS = [
  [
    { insuranceType: 'Specialty Lines',   lineOfBusiness: 'E&S Commercial', subProduct: 'Property',          effectiveDate: '2026-01-01', newBusinessPct: '15', renewalPct: '20', states: ['FL','TX','CA'] },
    { insuranceType: 'Specialty Lines',   lineOfBusiness: 'E&S Homeowners', subProduct: 'Coastal',           effectiveDate: '2026-01-01', newBusinessPct: '10', renewalPct: '12', states: ['FL','GA'] },
  ],
  [
    { insuranceType: 'Admitted Lines',    lineOfBusiness: 'Homeowners',     subProduct: 'HO-3 Standard',     effectiveDate: '2026-01-01', newBusinessPct: '20', renewalPct: '25', states: ['CA','OR','WA'] },
    { insuranceType: 'Admitted Lines',    lineOfBusiness: 'Auto',           subProduct: 'Personal Auto PAP', effectiveDate: '2026-02-01', newBusinessPct: '18', renewalPct: '22', states: ['CA','NY'] },
  ],
  [
    { insuranceType: 'Non-Admitted Lines', lineOfBusiness: 'Umbrella',      subProduct: 'Commercial Umbrella',      effectiveDate: '2026-01-01', newBusinessPct: '12', renewalPct: '15', states: ['NY','NJ','PA'] },
    { insuranceType: 'Non-Admitted Lines', lineOfBusiness: 'Excess Liability', subProduct: 'XS General Liability', effectiveDate: '2026-03-01', newBusinessPct: '8',  renewalPct: '10', states: ['TX','IL'] },
  ],
];

const MOCK_COMPANIES = ['Hudson Bailey Insurance', 'Pacific Mutual', 'Atlantic Risk Partners'];

function makeMockProducts(_item: IntermediaryListItem, seed: number) {
  return PRODUCT_SETS[seed % 3].map((row, i) => ({
    id: `p${seed}_${i}`,
    company: MOCK_COMPANIES[i % MOCK_COMPANIES.length],
    ...row,
  }));
}

function makeMockProducers(item: IntermediaryListItem, seed: number) {
  const count = (seed % 3) + 2;
  const slug  = item.name.toLowerCase().replace(/[^a-z]/g, '');
  return Array.from({ length: count }, (_, i) => {
    const firstName = pick(PRODUCER_FIRST, seed + i * 3);
    const lastName  = pick(PRODUCER_LAST,  seed + i * 3 + 1);
    return {
      id: `prod_${seed}_${i}`,
      saved: true, expanded: false, errors: {},
      form: {
        status: true, profilePic: null, profilePicUrl: '',
        firstName, middleName: '', lastName, suffix: '',
        country: 'USA', residentState: item.residentState,
        licReq: 'Separate',
        combinedLicense: '',
        plLicense: `PL-${String(item.id).padStart(4,'0')}-${String(i+1).padStart(2,'0')}`,
        clLicense:  `CL-${String(item.id).padStart(4,'0')}-${String(i+1).padStart(2,'0')}`,
        isManager: i === 0, reportsTo: i > 0 ? `prod_${seed}_0` : '',
        phone: mockPhone(seed + i * 17), extension: '', altPhone: '',
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${slug}.com`,
        sameAsIntermediary: true, enterManually: false,
        addrLine1: '', addrLine2: '', addrCountry: 'USA',
        addrState: item.residentState, city: '', county: '',
        zipCode: '', latitude: '', longitude: '', nrStates: [], nrSearch: '',
      },
    };
  });
}

export function getMockRecord(item: IntermediaryListItem): IntermediaryRecord {
  const seed = item.id;
  if (item.id === 18) return { ...item, draftStep: 2, step1: makeMockStep1(item, seed) };
  if (item.id === 19) return { ...item, draftStep: 4, step1: makeMockStep1(item, seed), step2: makeMockModules(seed), step3: makeMockProducts(item, seed) };
  if (item.id === 20) return { ...item, draftStep: 5, step1: makeMockStep1(item, seed), step2: makeMockModules(seed), step3: makeMockProducts(item, seed), step4: makeMockProducers(item, seed) };
  return {
    ...item,
    step1: makeMockStep1(item, seed),
    step2: makeMockModules(seed),
    step3: makeMockProducts(item, seed),
    step4: makeMockProducers(item, seed),
  };
}

export function getMockPage(
  items: IntermediaryListItem[],
  page: number,
  pageSize: number
): IntermediaryListResult {
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  const totalCount = items.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  return {
    items: pageItems,
    page,
    pageSize,
    totalCount,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };
}
