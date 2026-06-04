import React from 'react'
import Header from './Header'
import { Outlet } from 'react-router'
import Footer from './Footer'
import { useSelector } from 'react-redux'
import { selectBackgroundImageKey } from '../../store/settingsSlice'
import { backgroundImages } from '../../assets/backgroundImages'

function RootLayout() {
  const backgroundImageKey = useSelector(selectBackgroundImageKey);
  const bgUrl = (backgroundImages.find(b => b.key === backgroundImageKey) ?? backgroundImages[0])?.url;

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-black">

      <div
        className="absolute inset-0 z-0 bg-cover bg-center blur-[3px]"
        style={{ backgroundImage: `url('${bgUrl}')` }}
      />

      <div className="relative z-10 flex flex-col h-screen">
        <Header />

        <div className="flex-1 min-h-0 flex overflow-hidden">
          <Outlet />
        </div>
        
        <Footer />
      </div>
    </div>
  )
}

export default RootLayout
