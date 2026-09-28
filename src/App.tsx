import { Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './Dashboard/Dashbooard'
import LandingPage from './landingPage/LandingPage'
import CropCare from './Dashboard/Cropcare/CropCare'
import SoilDetects from './Dashboard/SoilDetects/SoilDetects'
import Weather from './Dashboard/Weather/Weather'
import Analytics from './Dashboard/Analytics'
import Community from './Dashboard/Community'
import Messages from './Dashboard/Messages'
import HelpandSupport from './Dashboard/HelpandSupport'
import Settings from './Dashboard/Settings'
import Subscription from './Dashboard/Subscription'
import Notifications from './Dashboard/Notifications'
import Marketplace from './Dashboard/Marketplace'
import Orders from './Dashboard/Orders'
import PredictionHistory from './Dashboard/PredictionHistory'
import AboutPage from './landingPage/AboutUs/AboutPage'
import ServicesPage from './landingPage/Popular-Services/ServicesPage'
import BlogPage from './landingPage/smartFarmingBlog/BlogPage'
import ContactPage from './landingPage/ContactPage'
import BlogPostPage from './landingPage/smartFarmingBlog/BlogPostPage'
import NotFound from './landingPage/NotFound'
import LandingPageChart from './testCharts/LandingPageChart'
import SignUp from './auth/SignUp'
import SignIn from './auth/SignIn'
import VerifyOtp from './auth/VerifyOtp'
import ForgotPassword from './auth/ForgotPassword'
import FarmerOnboarding from './auth/FarmerOnboarding'
import ProtectedRoute from './components/ProtectedRoute'
import TermsOfService from './legal/TermsOfService'
import PrivacyPolicy from './legal/PrivacyPolicy'
import { routes } from './lib/routes'
import Seo from './components/Seo'

// Supplier portal
import SupplierDashboard from './roles/supplier/SupplierDashboard'
import SupplierProducts from './roles/supplier/SupplierProducts'
import SupplierOrders from './roles/supplier/SupplierOrders'
import { SupplierBuyers, SupplierAnalytics, SupplierSettings } from './roles/supplier/SupplierPlaceholders'

// Admin console
import AdminDashboard from './roles/admin/AdminDashboard'
import AdminUsers from './roles/admin/AdminUsers'
import AdminModeration from './roles/admin/AdminModeration'
import AdminWaitlist from './roles/admin/AdminWaitlist'
import AdminBilling from './roles/admin/AdminBilling'
import AdminNotifications from './roles/admin/AdminNotifications'
import { AdminSuppliers, AdminAnalytics, AdminSettings } from './roles/admin/AdminPlaceholders'

// NGO / Government
import NgoDashboard from './roles/ngo/NgoDashboard'
import NgoPrograms from './roles/ngo/NgoPrograms'
import NgoRegions from './roles/ngo/NgoRegions'
import NgoDiseaseRisk from './roles/ngo/NgoDiseaseRisk'
import NgoAdvisories from './roles/ngo/NgoAdvisories'
import NgoFarmers from './roles/ngo/NgoFarmers'
import NgoReports from './roles/ngo/NgoReports'
import NgoNotifications from './roles/ngo/NgoNotifications'
import NgoSettings from './roles/ngo/NgoSettings'

// CFO finance portal
import FinanceDashboard from './roles/finance/FinanceDashboard'
import FinanceTransactions from './roles/finance/FinanceTransactions'
import FinanceAccounts from './roles/finance/FinanceAccounts'
import FinanceReports from './roles/finance/FinanceReports'
import FinanceAudit from './roles/finance/FinanceAudit'
import FinanceNotifications from './roles/finance/FinanceNotifications'

// Supplier portal extras
import SupplierNotifications from './roles/supplier/SupplierNotifications'

function App() {
  return (
    <>
      <Seo />
      <Routes>
      {/* Public */}
      <Route path={routes.home} element={<LandingPage />} />
      <Route path={routes.about} element={<AboutPage />} />
      <Route path={routes.services} element={<ServicesPage />} />
      <Route path={routes.blog} element={<BlogPage />} />
      <Route path={`${routes.blog}/:slug`} element={<BlogPostPage />} />
      <Route path={routes.contact} element={<ContactPage />} />
      <Route path="/testCharts" element={<LandingPageChart />} />

      {/* Legal */}
      <Route path={routes.legal.terms} element={<TermsOfService />} />
      <Route path={routes.legal.privacy} element={<PrivacyPolicy />} />

      {/* Auth */}
      <Route path={routes.auth.login} element={<SignIn />} />
      <Route path={routes.auth.register} element={<SignUp />} />
      <Route path={routes.auth.verifyOtp} element={<VerifyOtp />} />
      <Route path={routes.auth.forgotPassword} element={<ForgotPassword />} />
      <Route path={routes.auth.farmerOnboarding} element={<ProtectedRoute allowRoles={['FARMER']}><FarmerOnboarding /></ProtectedRoute>} />

      {/* Farmer app */}
      <Route path={routes.app.root} element={<ProtectedRoute allowRoles={['FARMER']}><Dashboard /></ProtectedRoute>} />
      <Route path={routes.app.notifications} element={<ProtectedRoute allowRoles={['FARMER']}><Notifications /></ProtectedRoute>} />
      <Route path={routes.app.marketplace} element={<ProtectedRoute allowRoles={['FARMER']}><Marketplace /></ProtectedRoute>} />
      <Route path={routes.app.orders} element={<ProtectedRoute allowRoles={['FARMER']}><Orders /></ProtectedRoute>} />
      <Route path={routes.app.predictionHistory} element={<ProtectedRoute allowRoles={['FARMER']}><PredictionHistory /></ProtectedRoute>} />
      <Route path={routes.app.cropCare} element={<ProtectedRoute allowRoles={['FARMER']}><CropCare /></ProtectedRoute>} />
      <Route path={routes.app.soil} element={<ProtectedRoute allowRoles={['FARMER']}><SoilDetects /></ProtectedRoute>} />
      <Route path={routes.app.weather} element={<ProtectedRoute allowRoles={['FARMER']}><Weather /></ProtectedRoute>} />
      <Route path={routes.app.analytics} element={<ProtectedRoute allowRoles={['FARMER']}><Analytics /></ProtectedRoute>} />
      <Route path={routes.app.community} element={<ProtectedRoute allowRoles={['FARMER']}><Community /></ProtectedRoute>} />
      <Route path={routes.app.messages} element={<ProtectedRoute allowRoles={['FARMER']}><Messages /></ProtectedRoute>} />
      <Route path={routes.app.help} element={<ProtectedRoute allowRoles={['FARMER']}><HelpandSupport /></ProtectedRoute>} />
      <Route path={routes.app.settings} element={<ProtectedRoute allowRoles={['FARMER']}><Settings /></ProtectedRoute>} />
      <Route path={routes.app.subscription} element={<ProtectedRoute allowRoles={['FARMER']}><Subscription /></ProtectedRoute>} />

      {/* Supplier portal */}
      <Route path={routes.supplier.root} element={<ProtectedRoute allowRoles={['SUPPLIER']}><SupplierDashboard /></ProtectedRoute>} />
      <Route path={routes.supplier.products} element={<ProtectedRoute allowRoles={['SUPPLIER']}><SupplierProducts /></ProtectedRoute>} />
      <Route path={routes.supplier.orders} element={<ProtectedRoute allowRoles={['SUPPLIER']}><SupplierOrders /></ProtectedRoute>} />
      <Route path={routes.supplier.buyers} element={<ProtectedRoute allowRoles={['SUPPLIER']}><SupplierBuyers /></ProtectedRoute>} />
      <Route path={routes.supplier.analytics} element={<ProtectedRoute allowRoles={['SUPPLIER']}><SupplierAnalytics /></ProtectedRoute>} />
      <Route path={routes.supplier.notifications} element={<ProtectedRoute allowRoles={['SUPPLIER']}><SupplierNotifications /></ProtectedRoute>} />
      <Route path={routes.supplier.settings} element={<ProtectedRoute allowRoles={['SUPPLIER']}><SupplierSettings /></ProtectedRoute>} />

      {/* Admin console */}
      <Route path={routes.admin.root} element={<ProtectedRoute allowRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path={routes.admin.users} element={<ProtectedRoute allowRoles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
      <Route path={routes.admin.suppliers} element={<ProtectedRoute allowRoles={['ADMIN']}><AdminSuppliers /></ProtectedRoute>} />
      <Route path={routes.admin.waitlist} element={<ProtectedRoute allowRoles={['ADMIN']}><AdminWaitlist /></ProtectedRoute>} />
      <Route path={routes.admin.billing} element={<ProtectedRoute allowRoles={['ADMIN']}><AdminBilling /></ProtectedRoute>} />
      <Route path={routes.admin.moderation} element={<ProtectedRoute allowRoles={['ADMIN']}><AdminModeration /></ProtectedRoute>} />
      <Route path={routes.admin.analytics} element={<ProtectedRoute allowRoles={['ADMIN']}><AdminAnalytics /></ProtectedRoute>} />
      <Route path={routes.admin.notifications} element={<ProtectedRoute allowRoles={['ADMIN']}><AdminNotifications /></ProtectedRoute>} />
      <Route path={routes.admin.settings} element={<ProtectedRoute allowRoles={['ADMIN']}><AdminSettings /></ProtectedRoute>} />

      {/* NGO / Government */}
      <Route path={routes.ngo.root} element={<ProtectedRoute allowRoles={['NGO', 'GOVERNMENT']}><NgoDashboard /></ProtectedRoute>} />
      <Route path={routes.ngo.programs} element={<ProtectedRoute allowRoles={['NGO', 'GOVERNMENT']}><NgoPrograms /></ProtectedRoute>} />
      <Route path={routes.ngo.regions} element={<ProtectedRoute allowRoles={['NGO', 'GOVERNMENT']}><NgoRegions /></ProtectedRoute>} />
      <Route path={routes.ngo.diseaseRisk} element={<ProtectedRoute allowRoles={['NGO', 'GOVERNMENT']}><NgoDiseaseRisk /></ProtectedRoute>} />
      <Route path={routes.ngo.advisories} element={<ProtectedRoute allowRoles={['NGO', 'GOVERNMENT']}><NgoAdvisories /></ProtectedRoute>} />
      <Route path={routes.ngo.farmers} element={<ProtectedRoute allowRoles={['NGO', 'GOVERNMENT']}><NgoFarmers /></ProtectedRoute>} />
      <Route path={routes.ngo.reports} element={<ProtectedRoute allowRoles={['NGO', 'GOVERNMENT']}><NgoReports /></ProtectedRoute>} />
      <Route path={routes.ngo.notifications} element={<ProtectedRoute allowRoles={['NGO', 'GOVERNMENT']}><NgoNotifications /></ProtectedRoute>} />
      <Route path={routes.ngo.settings} element={<ProtectedRoute allowRoles={['NGO', 'GOVERNMENT']}><NgoSettings /></ProtectedRoute>} />

      {/* CFO finance portal */}
      <Route path={routes.finance.root} element={<ProtectedRoute allowRoles={['CFO', 'ADMIN']}><FinanceDashboard /></ProtectedRoute>} />
      <Route path={routes.finance.transactions} element={<ProtectedRoute allowRoles={['CFO', 'ADMIN']}><FinanceTransactions /></ProtectedRoute>} />
      <Route path={routes.finance.accounts} element={<ProtectedRoute allowRoles={['CFO', 'ADMIN']}><FinanceAccounts /></ProtectedRoute>} />
      <Route path={routes.finance.reports} element={<ProtectedRoute allowRoles={['CFO', 'ADMIN']}><FinanceReports /></ProtectedRoute>} />
      <Route path={routes.finance.audit} element={<ProtectedRoute allowRoles={['CFO', 'ADMIN']}><FinanceAudit /></ProtectedRoute>} />
      <Route path={routes.finance.notifications} element={<ProtectedRoute allowRoles={['CFO', 'ADMIN']}><FinanceNotifications /></ProtectedRoute>} />

      {/* Legacy redirects — keep old bookmarks working */}
      <Route path="/signin" element={<Navigate to={routes.auth.login} replace />} />
      <Route path="/signup" element={<Navigate to={routes.auth.register} replace />} />
      <Route path="/verify-otp" element={<Navigate to={routes.auth.verifyOtp} replace />} />
      <Route path="/forgot-password" element={<Navigate to={routes.auth.forgotPassword} replace />} />
      <Route path="/terms" element={<Navigate to={routes.legal.terms} replace />} />
      <Route path="/privacy" element={<Navigate to={routes.legal.privacy} replace />} />
      <Route path="/blogs" element={<Navigate to={routes.blog} replace />} />
      <Route path="/contacts" element={<Navigate to={routes.contact} replace />} />
      <Route path="/dashboard" element={<Navigate to={routes.app.root} replace />} />
      <Route path="/crop-care" element={<Navigate to={routes.app.cropCare} replace />} />
      <Route path="/soil-detects" element={<Navigate to={routes.app.soil} replace />} />
      <Route path="/weather" element={<Navigate to={routes.app.weather} replace />} />
      <Route path="/analytics" element={<Navigate to={routes.app.analytics} replace />} />
      <Route path="/community" element={<Navigate to={routes.app.community} replace />} />
      <Route path="/help-and-support" element={<Navigate to={routes.app.help} replace />} />
      <Route path="/settings" element={<Navigate to={routes.app.settings} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  )
}

export default App
