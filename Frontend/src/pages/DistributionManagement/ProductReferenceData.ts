export const SPECIALTY_INSURANCE_TYPE = 'Specialty Lines';

// Mirrors the checked-in 009_client_management_tables.sql seed so a frontend
// deployed just before its matching API does not render an empty required field.
export const SEEDED_SPECIALTY_PRODUCTS = [
  {
    id: 'seed-specialty-homeowners',
    product_name: 'E&S Homeowners',
    product_type: SPECIALTY_INSURANCE_TYPE,
    is_sub_product: false,
    parent_product_id: null,
    is_active: true,
  },
  {
    id: 'seed-specialty-homeowners-superperils',
    product_name: 'SuperPerils',
    product_type: SPECIALTY_INSURANCE_TYPE,
    is_sub_product: true,
    parent_product_id: 'seed-specialty-homeowners',
    is_active: true,
  },
] as const;
