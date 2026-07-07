import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router';
import UserLongCard from './UserLongCard';
import PillSlidingSelectBar from './dashboard slider/PillSlidingSelectBar';

function Dashboard() {

  const focusedUser = useSelector( state => state.focusedUser );
  const uid = useLocation().pathname.split("/")[2];
  const navigate = useNavigate();

  //0 = relics, 1 = builds
  const [rightDisplaySelector, setRightDisplaySelector] = useState("home");

  useEffect(()=>{
    //console.log("right display selector: ", rightDisplaySelector)
    navigate(`${rightDisplaySelector}`)
  }, [rightDisplaySelector])

  //useEffect(()=>{console.log("provided uid in dashboard: ", uid)}, [uid])


  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className='flex flex-col w-full h-full px-4 pt-3 pb-2 gap-3'>

      <div className='shrink-0'>
        <UserLongCard uid={uid} rightDisplaySelector={rightDisplaySelector} setRightDisplaySelector={setRightDisplaySelector} onRefreshComplete={() => setRefreshKey(k => k + 1)} />
      </div>

      <div className='flex-1 min-h-0'>
        <Outlet context={{ refreshKey, bumpRefresh: () => setRefreshKey(k => k + 1) }} />
      </div>

    </div>
  )
}

export default Dashboard