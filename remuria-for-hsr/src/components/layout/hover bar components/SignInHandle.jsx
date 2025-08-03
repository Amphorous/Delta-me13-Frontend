import React from 'react'
import { LuUserRound } from "react-icons/lu";

//this will have the signin flow built into it,
//which includes user auth and showing the pfp

function SignInHandle() {
  return (
    <div className='p-2.5 mx-2 self-center rounded-full border-[1px] border-purple-400'>
        <LuUserRound size={24}/>
    </div>
  )
}

export default SignInHandle