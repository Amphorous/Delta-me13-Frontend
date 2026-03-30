import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router';
import UserCard from '../home screen/UserCard';
import PillSlidingSelectBar from './dashboard slider/PillSlidingSelectBar';

function Dashboard() {

  const focusedUser = useSelector( state => state.focusedUser );
  const uid = useLocation().pathname.split("/")[2];
  const navigate = useNavigate();

  //0 = relics, 1 = builds
  const [rightDisplaySelector, setRightDisplaySelector] = useState("relics");

  useEffect(()=>{
    console.log("right display selector: ", rightDisplaySelector)
    navigate(`${rightDisplaySelector}`)
  }, [rightDisplaySelector])

  useEffect(()=>{console.log("provided uid in dashboard: ", uid)}, [uid])


  return (
    <div className='flex flex-col sm:flex-row justify-around bg-ambder-400 w-full'>

      <div className=" maxs-ws-[480px] min-w-[480px] flex flex-col justify-center ">
        <p className="afacad-bold xl:text-[700%] leading-[80%] text-white text-[500%] mb-[5%] lg:mb-[10%]">User <br/> Dashboard</p>
        <UserCard uid={uid} showButtons={false}/>
      </div>

      <div className=" w-[60vw] min-w-[480] flex flex-col items-center "> {/* not properly small screen compatible yet */}
        <PillSlidingSelectBar uid={uid} rightDisplaySelector={rightDisplaySelector} setRightDisplaySelector={setRightDisplaySelector}/>
        <div className="bg-gfray-400 w-full h-full mt-5">
          <Outlet />
        </div>
      </div>

    </div>
  )
}

export default Dashboard