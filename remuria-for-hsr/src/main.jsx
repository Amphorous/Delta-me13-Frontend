import { createRoot } from 'react-dom/client'
import './index.css'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router'
import RootLayout from './components/layout/RootLayout'
import Home from './components/layout/home screen/Home'
import Empty from './components/Empty'
import { Provider } from 'react-redux'
import store from './store/store'
import Dashboard from './components/layout/user screens/Dashboard'
import DashboardsRelics from './components/layout/user screens/dashboard children/DashboardsRelics'
import DashboardBuilds from './components/layout/user screens/dashboard children/DashboardBuilds'
import Validate from './components/layout/user screens/dashboard children/Validate'
import Settings from './components/layout/Settings'
import NotFound from './components/layout/NotFound'
import Leaderboards from './components/layout/Leaderboards'
import DashboardHome from './components/layout/user screens/dashboard children/DashboardHome'

const browserRouterObject = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
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
  
  <Provider store={store}>
    <RouterProvider router = {browserRouterObject} />
  </Provider>
  ,
)
