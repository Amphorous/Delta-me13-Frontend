import React from 'react'
import Header from './Header'
import { Outlet } from 'react-router'
import Footer from './Footer'
import testBG from '../../assets/tes.jpg'

function RootLayout() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-black">
      
      <div
        className="absolute inset-0 z-0 bg-cover bg-center blur-[3px]"
        style={{ backgroundImage: `url('${testBG}')` }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        
        <div className="flex-1 overflow-y-auto flex bg-bldack">
          <Outlet />
        </div>
        
        <Footer />
      </div>
    </div>
  )
}

export default RootLayout
