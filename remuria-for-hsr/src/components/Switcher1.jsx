import React, { useContext, useEffect, useState } from 'react'

const Switcher1 = ({value, setValue, settingName}) => {

  const handleCheckboxChange = () => {
    setValue((value)=>{
        localStorage.setItem(`${settingName}`, JSON.stringify(!value))
        return !value;
    })
  }

  return (
    <label className='flex cursor-pointer select-none items-center'>
      <div className='relative'>
        <input
          type='checkbox'
          checked={value}
          onChange={handleCheckboxChange}
          className='sr-only'
        />
        <div className={`block h-8 w-14 rounded-full transition-colors ${value ? 'bg-violet-500' : 'bg-[#acafb4]'}`}></div>
        <div
          className={`dot absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${
            value ? 'translate-x-7' : 'translate-x-1'
          }`}
        ></div>
      </div>
    </label>
  )
}

export default Switcher1
