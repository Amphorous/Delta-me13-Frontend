import { createRoot } from 'react-dom/client'
import { Suspense, lazy } from 'react'
import './index.css'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router'
import RootLayout from './components/layout/RootLayout'
import Home from './components/layout/home screen/Home'
import Empty from './components/Empty'
import { Provider } from 'react-redux'
import store from './store/store'
import Dashboard from './components/layout/user screens/Dashboard'
import DashboardsRelics from './components/layout/user screens/dashboard children/DashboardsRelics'
import DashboardBuilds from './components/layout/user screens/dashboard children/builds/DashboardBuilds'
import Validate from './components/layout/user screens/dashboard children/Validate'
import Settings from './components/layout/Settings'
import NotFound from './components/layout/NotFound'
import Leaderboards from './components/layout/Leaderboards'
import DashboardHome from './components/layout/user screens/dashboard children/DashboardHome'
import ErrorPage from './components/layout/ErrorPage'
import IsolatedRouteFallback from './components/layout/IsolatedRouteFallback'
import AppErrorBoundary from './components/AppErrorBoundary'

// Lazy + its own errorElement below: same ad-block-target reasoning as
// CookieNotice (see RootLayout.jsx). A per-route errorElement only replaces
// what this route would have rendered in place of RootLayout's <Outlet />,
// so a failure here can never take out Header/Footer/the rest of the app —
// unlike the root "/" route's own errorElement (ErrorPage), which would.
const PrivacyPolicy = lazy(() => import('./components/layout/PrivacyPolicy'))

const browserRouterObject = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "home",
        element: <Home />,
        handle: { crumb: () => 'Home' },
        children: [
          {
            path: "empty",
            element: <Empty />,
            handle: { crumb: () => 'Empty' }
          }
        ]
      },
      {
        path: "",
        element: <Navigate to="home" />
      },
      {
        path: "settings",
        element: <Settings />,
        handle: { crumb: () => 'Settings' }
      },
      {
        path: "leaderboards",
        element: <Leaderboards />,
        handle: { crumb: () => 'Leaderboards' }
      },
      {
        // Not "/privacy" — ad-block filter lists (EasyPrivacy etc.) broadly
        // block URL paths containing "privacy" since third-party consent
        // management trackers commonly host scripts at such paths. Same
        // page/content, just a route name that doesn't collide with that.
        path: "legal-notice",
        element: (
          <Suspense fallback={null}>
            <PrivacyPolicy />
          </Suspense>
        ),
        errorElement: <IsolatedRouteFallback />,
        handle: { crumb: () => 'Privacy Policy' }
      },
      {
        path: "dashboard/:uid",
        element: <Dashboard />,
        handle: { crumb: () => 'Dashboard' },
        children: [
          {
            path: "relics",
            element: <DashboardsRelics />,
            handle: { crumb: () => 'Relics' }
          },
          {
            path: "home",
            element: <DashboardHome />,
            handle: { crumb: () => 'Home' }
          },
          {
            path: "builds",
            element: <DashboardBuilds />,
            handle: { crumb: () => 'Builds' }
          },
          {
            path: "validate",
            element: <Validate />,
            handle: { crumb: () => 'User Validation' }
          },
          {
            path: "",
            element: <Navigate to="home" />
          },
        ]
      },
      {
        path: "*",
        element: <NotFound />
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(

  <AppErrorBoundary>
    <Provider store={store}>
      <RouterProvider router = {browserRouterObject} />
    </Provider>
  </AppErrorBoundary>
  ,
)
