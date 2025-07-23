import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider, createBrowserRouter } from 'react-router'
import RootLayout from './components/RootLayout'

const browserRouterObject = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />
  }
])

createRoot(document.getElementById('root')).render(
  
    <RouterProvider router = {browserRouterObject} />
  ,
)
