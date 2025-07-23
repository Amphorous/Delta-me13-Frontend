import { createRoot } from 'react-dom/client'
import './index.css'
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router'
import RootLayout from './components/layout/RootLayout'
import Home from './components/Home'

const browserRouterObject = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "home",
        element: <Home />
      },
      {
        path: "",
        element: <Navigate to="home" />
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  
    <RouterProvider router = {browserRouterObject} />
  ,
)
