import React, { useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import UserCard from '../home screen/UserCard';

function Dashboard() {

  const focusedUser = useSelector( state => state.focusedUser );
  const uid = useLocation().pathname.split("/")[2]

  useEffect(()=>{console.log("provided uid in dashboard: ", uid)}, [uid])


  return (
    <div className='flex justify-around bg-ambder-400 w-full'>

      <div className="max- w-[30vw] min-w-[480px] flex items-center">
        <UserCard uid={uid} showButtons={false} />
      </div>

      <div className="bg-amber-800 w-[60vw] min-w-[480]"></div>

    </div>
  )
}

export default Dashboard