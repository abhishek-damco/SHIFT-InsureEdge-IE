// Header "Hi, {name}" identity + My Profile (Personal/Security tabs)

export interface CurrentUserDto {
  id: number;
  fullName: string;
  email: string;
}

export interface MyProfile {
  id: number;
  userCode: string | null;
  status: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  roleName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bio: string | null;
  passwordUpdatedOn: string | null;
  lastLoginOn: string | null;
}

export interface UpdateMyProfileRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
}

// Producer self-service login: pre-fills New Submission's Brokerage Firm/Producer Name
// from the logged-in Producer's own record (null/null for staff logins).
export interface MyProducerResponse {
  producer: { id: number; first_name: string; last_name: string } | null;
  intermediary: { id: number; intermediary_name: string; type_of_intermediary: string | null } | null;
}
