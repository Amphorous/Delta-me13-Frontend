import { createRoot } from 'react-dom/client'
import './index.css'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router'
import RootLayout from './components/layout/RootLayout'
import Home from './components/layout/home screen/Home'
import Empty from './components/Empty'
import { Provider } from 'react-redux'
import store from './store/store'
import Dashboard from './components/layout/user screens/Dashboard'

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
        path: "dashboard/:uid",
        element: <Dashboard />,
        handle: { crumb: () => 'Dashboard' }
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
