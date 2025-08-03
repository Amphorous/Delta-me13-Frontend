import React from 'react'
import { GrValidate } from "react-icons/gr";
import { IoMdSettings } from "react-icons/io";
import { MdLeaderboard } from "react-icons/md";

//no functionality as of now

function Hidden() {
  return (
    <div className='flex'>
        <div className="mr-3 p-1 hover:bg-gray-400/15 rounded-sm transition cursor-pointer flex items-center gap-1"><MdLeaderboard /> Leaderboards</div>
        <div className="mr-3 p-1 hover:bg-gray-400/15 rounded-sm transition cursor-pointer flex items-center gap-1"><IoMdSettings /> Settings</div>
        <div className="mr-3 p-1 hover:bg-gray-400/15 rounded-sm transition cursor-pointer flex items-center gap-1"><GrValidate /> Validate</div>
    </div>
  )
}

export default Hidden