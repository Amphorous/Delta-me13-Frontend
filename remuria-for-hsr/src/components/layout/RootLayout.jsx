import React from 'react'
import Header from './Header'
import { Outlet } from 'react-router'
import Footer from './Footer'
import { useSelector } from 'react-redux'
import { selectBackgroundImageKey, selectBgBlur } from '../../store/settingsSlice'
import { backgroundImages } from '../../assets/backgroundImages'
import ThemeManager from '../ThemeManager'

const BG_BLUR_VALUES = {
  none: '0px',
  low: '1px',
  medium: '3px',
  high: '8px',
};

function RootLayout() {
  const backgroundImageKey = useSelector(selectBackgroundImageKey);
  const bgBlur = useSelector(selectBgBlur);
  const bgUrl = (backgroundImages.find(b => b.key === backgroundImageKey) ?? backgroundImages[0])?.url;
  const blurValue = BG_BLUR_VALUES[bgBlur] ?? BG_BLUR_VALUES.medium;

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-black">
      <ThemeManager />

      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${bgUrl}')`, filter: `blur(${blurValue})` }}
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
