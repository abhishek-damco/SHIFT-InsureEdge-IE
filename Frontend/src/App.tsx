import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { PermissionProvider } from './contexts/PermissionContext';
import AppShell from './components/Layout/AppShell';
import GroupListPage from './pages/GroupListPage';
import AddGroupPage from './pages/AddGroupPage';
import GroupDetailPage from './pages/GroupDetailPage';
import UserManagementPage from './pages/UserManagement';
import UserForm from './pages/UserForm';
import ViewUser from './pages/ViewUser';
import PasswordResetPage from './pages/PasswordResetPage';
import PasswordResetConfirmPage from './pages/PasswordResetConfirmPage';
import OnboardingSetupPage from './pages/OnboardingSetupPage';
import LoginPage from './pages/LoginPage';
import ClaimsDashboardPage from './pages/ClaimsDashboardPage';
import ClaimsEnquiryPage from './pages/ClaimsEnquiryPage';
import FNOLRegPage from './pages/FNOLRegPage';
import ClaimsModulePage from './pages/ClaimsModulePage';
import ClaimsLetterTemplatePage from './pages/ClaimsLetterTemplatePage';
import ClaimsLetterTemplateAddPage from './pages/ClaimsLetterTemplateAddPage';
import ClaimsLetterTemplateEditPage from './pages/ClaimsLetterTemplateEditPage';
import ClaimsLetterTemplateViewPage from './pages/ClaimsLetterTemplateViewPage';
import ClaimsMasterConfigPage from './pages/ClaimsMasterConfigPage';
import ClaimsMasterConfigViewPage from './pages/ClaimsMasterConfigViewPage';
import ClaimsMasterConfigEditPage from './pages/ClaimsMasterConfigEditPage';
import ClaimsAuthorityPage from './pages/ClaimsAuthorityPage';
import ClaimsAuthorityAddUserPage from './pages/ClaimsAuthorityAddUserPage';
import ClaimsAuthorityViewPage from './pages/ClaimsAuthorityViewPage';
import ClaimsAuthorityEditPage from './pages/ClaimsAuthorityEditPage';
import AdjusterManagementPage from './pages/AdjusterManagementPage';
import AddAdjusterPage from './pages/AddAdjusterPage';
import AdjusterDetailPage from './pages/AdjusterDetailPage';
import ClaimWorkflowPage from './pages/ClaimWorkflowPage';
import PayeeListPage from './pages/PayeeListPage';
import MyProfilePage from './pages/MyProfilePage';
import ClientManagementPage from './pages/ClientManagementPage';
import DistributionManagementModule from './pages/DistributionManagement';
import BillingManagementModule from './pages/BillingManagement';
import QuotesPoliciesLandingShell from './pages/QuotesPolicies/QuotesPoliciesLandingShell';
import NBQuotesRegister from './pages/QuotesPolicies/NBQuotesRegister';
import EndorsementRegister from './pages/QuotesPolicies/EndorsementRegister';
import RenewalRegister from './pages/QuotesPolicies/RenewalRegister';
import PoliciesRegister from './pages/QuotesPolicies/PoliciesRegister';
import NewSubmission from './pages/QuotesPolicies/NewSubmission';
import PolicySummaryPage from './pages/PolicySummaryPage';

function FNOLRegPageWithKey() {
  const { id } = useParams<{ id: string }>();
  return <FNOLRegPage key={id} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/password-reset" element={<PasswordResetPage />} />
        <Route path="/password-reset/confirm" element={<PasswordResetConfirmPage />} />
        <Route path="/onboarding/setup" element={<OnboardingSetupPage />} />

        {/* Protected routes — wrapped in PermissionProvider + AppShell */}
        <Route
          path="/*"
          element={
            <PermissionProvider>
              <AppShell>
                <Routes>
                  <Route path="/" element={<Navigate to="/groups" replace />} />
                  <Route path="/groups" element={<GroupListPage />} />
                  <Route path="/groups/new" element={<AddGroupPage />} />
                  <Route path="/groups/:id" element={<GroupDetailPage />} />
                  <Route path="/users" element={<UserManagementPage />} />
                  <Route path="/users/new" element={<UserForm />} />
                  <Route path="/users/:id" element={<UserForm />} />
                  <Route path="/users/:id/view" element={<ViewUser />} />
                  <Route path="/claims" element={<ClaimsDashboardPage />} />
                  <Route path="/claims/enquiry" element={<ClaimsEnquiryPage />} />
                  <Route path="/claims/workflow/:id" element={<ClaimWorkflowPage />} />
                  <Route path="/claims/fnol" element={<FNOLRegPage key="fnol-new" />} />
                  <Route path="/claims/fnol/:id" element={<FNOLRegPageWithKey />} />
                  <Route path="/claims/bulk-upload" element={<ClaimsModulePage moduleKey="bulk-upload" />} />
                  <Route path="/claims/authority" element={<ClaimsAuthorityPage />} />
                  <Route path="/claims/authority/add-user" element={<ClaimsAuthorityAddUserPage />} />
                  <Route path="/claims/authority/create" element={<ClaimsAuthorityEditPage />} />
                  <Route path="/claims/authority/:id/view" element={<ClaimsAuthorityViewPage />} />
                  <Route path="/claims/authority/:id/edit" element={<ClaimsAuthorityEditPage />} />
                  <Route path="/claims/adjusters" element={<AdjusterManagementPage />} />
                  <Route path="/claims/adjusters/new" element={<AddAdjusterPage />} />
                  <Route path="/claims/adjusters/:id" element={<AdjusterDetailPage />} />
                  <Route path="/claims/payees" element={<PayeeListPage />} />
                  <Route path="/claims/catastrophic-events" element={<ClaimsModulePage moduleKey="catastrophic-events" />} />
                  <Route path="/claims/letter-template" element={<ClaimsLetterTemplatePage />} />
                  <Route path="/claims/letter-template/add" element={<ClaimsLetterTemplateAddPage />} />
                  <Route path="/claims/letter-template/:id/view" element={<ClaimsLetterTemplateViewPage />} />
                  <Route path="/claims/letter-template/:id/edit" element={<ClaimsLetterTemplateEditPage />} />
                  <Route path="/claims/master-configuration" element={<ClaimsMasterConfigPage />} />
                  <Route path="/claims/master-configuration/:id/view" element={<ClaimsMasterConfigViewPage />} />
                  <Route path="/claims/master-configuration/:id/edit" element={<ClaimsMasterConfigEditPage />} />
                  <Route path="/client-management" element={<ClientManagementPage />} />
                  <Route path="/my-profile" element={<MyProfilePage />} />
                  <Route path="/distribution/*" element={<DistributionManagementModule />} />
                  <Route path="/billing/*" element={<BillingManagementModule />} />

                  {/* Quotes & Policies — ported from prototype */}
                  <Route element={<QuotesPoliciesLandingShell />}>
                    <Route path="/quotes-policies/individual/nb-quotes" element={<NBQuotesRegister insuredType="individual" />} />
                    <Route path="/quotes-policies/individual/endorsements" element={<EndorsementRegister insuredType="individual" />} />
                    <Route path="/quotes-policies/individual/renewals" element={<RenewalRegister insuredType="individual" />} />
                    <Route path="/quotes-policies/individual/policies" element={<PoliciesRegister insuredType="individual" />} />
                    <Route path="/quotes-policies/business/nb-quotes" element={<NBQuotesRegister insuredType="business" />} />
                    <Route path="/quotes-policies/business/endorsements" element={<EndorsementRegister insuredType="business" />} />
                    <Route path="/quotes-policies/business/renewals" element={<RenewalRegister insuredType="business" />} />
                    <Route path="/quotes-policies/business/policies" element={<PoliciesRegister insuredType="business" />} />
                    <Route path="/quotes-policies/submissions/new" element={<NewSubmission />} />
                    <Route path="/quotes-policies/submissions/:id" element={<NewSubmission />} />
                  </Route>
                  <Route path="/quotes-policies/policies/:id" element={<PolicySummaryPage />} />
                </Routes>
              </AppShell>
            </PermissionProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}







