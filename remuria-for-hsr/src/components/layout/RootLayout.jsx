import React from 'react'
import Header from './Header'
import { Outlet } from 'react-router'
import Footer from './Footer'

function RootLayout() {
  return (
    <div className='bg-amber-400 min-h-screen flex flex-col'>
        <Header />

        <Outlet />

        <Footer />
    </div>
  )
}

export default RootLayout