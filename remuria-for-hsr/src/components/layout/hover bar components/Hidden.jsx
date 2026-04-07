import React from 'react'
import { GrValidate } from "react-icons/gr";
import { IoMdSettings } from "react-icons/io";
import { MdLeaderboard } from "react-icons/md";
import LanguageClickable from './LanguageClickable';

//no functionality as of now

function Hidden() {
  return (
    <div className='flex '>
        <div className="mr-3 p-1 hover:bg-gray-400/15 rounded-sm transition cursor-pointer flex items-center gap-1"><MdLeaderboard /> Leaderboards</div>
        <div className="mr-3 p-1 hover:bg-gray-400/15 rounded-sm transition cursor-pointer flex items-center gap-1"><GrValidate /> Validate</div>
        <div className="mr-3 p-1 hover:bg-gray-400/15 rounded-sm transition cursor-pointer flex items-center gap-1"><IoMdSettings /> Settings</div>
        <LanguageClickable />
    </div>
  )
}

export default Hidden