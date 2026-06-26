import React from 'react'
import { GrValidate } from "react-icons/gr";
import { IoMdSettings } from "react-icons/io";
import { MdLeaderboard } from "react-icons/md";
import LanguageClickable from './LanguageClickable';
import { useNavigate } from 'react-router-dom';

function Hidden() {
  const navigate = useNavigate();

  return (
    <div className='flex items-center'>
        <div className="mr-2 px-2.5 py-1 hover:bg-[var(--accent-bg-20)] rounded-full transition cursor-pointer flex items-center gap-1.5 text-sm"
            onClick={() => navigate('/leaderboards')}
        ><MdLeaderboard size={15}/> Leaderboards</div>
        <div className="mr-2 px-2.5 py-1 hover:bg-[var(--accent-bg-20)] rounded-full transition cursor-pointer flex items-center gap-1.5 text-sm"
            onClick={() => navigate('/settings')}
        ><IoMdSettings size={15}/> Settings</div>
        <LanguageClickable />
    </div>
  )
}

export default Hidden