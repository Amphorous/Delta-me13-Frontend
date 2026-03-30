import axios from 'axios';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router';
import RelicItem from './RelicItem';
import { MdKeyboardArrowLeft } from "react-icons/md";
import { MdKeyboardArrowRight } from "react-icons/md";
import Switcher1 from '../../../Switcher1';
import { BsFillGridFill } from "react-icons/bs";
import { FaList } from "react-icons/fa6";
import RelicList from './RelicList';

function DashboardsRelics() {

  const [relicPageNumber, setRelicPageNumber] = useState(1);
  const [relicsInfo, setRelicsInfo] = useState(null);
  const [relicShowcaseStyle, setRelicShowcaseStyle] = useState(true); // true for grid, false for list
  const uid = useLocation().pathname.split("/")[2];

  useEffect(()=>{
    axios.get(`http://localhost:8080/user/relics/${uid}/${relicPageNumber}`)
    .then((res)=>{
      console.log("relic response: ", res.data)
      setRelicsInfo([...res.data, "lastItem"])
    })
    .catch((err)=>{
      console.log(err)
      setRelicsInfo("error")
    })
  }, [relicPageNumber])

  useEffect(()=>{
    // set showcaseStyle based on local storage, if none exists, set to true and save to local storage
    const storedShowcaseStyle = localStorage.getItem("relicShowcaseStyle");
    if(storedShowcaseStyle === null){
      localStorage.setItem("relicShowcaseStyle", JSON.stringify(true));
      setRelicShowcaseStyle(true);
    } else {
      setRelicShowcaseStyle(JSON.parse(storedShowcaseStyle));
    }
  }, [])

  function handlePageChange(direction){
    if(direction === -1 && relicPageNumber > 1){
      setRelicPageNumber(relicPageNumber - 1);
    } else if(direction === 1 && relicsInfo !== null && relicsInfo[0] !== "lastItem"){
      setRelicPageNumber(relicPageNumber + 1);
    }
  }

  return (
    <OverlayScrollbarsComponent
      // options={{
      //   scrollbars: { autoHide: 'scroll' },
      // }}
      className="w-full h-full bg-grafy-800  max-h-[75vh] overflow-hiddden flex flex-col items-center justify-center"
    >
      <div className='w-full  h-[5%] px-6 sticky top-0 z-10'>
        <div className='w-full h-full rounded-md bg-gray-950/60 backdrop-blur-md  relative flex items-center justify-center'>
          <div className='flex items-center gap-2'>
            {/* page carousel */}
            <button onClick={()=>handlePageChange(-1)} 
            className=' text-black afacad-bold text-sm px-2 py-1 rounded-full bg-white hover:bg-black/60
             hover:text-white transition active:scale-95 active:bg-gray-600'>
              <MdKeyboardArrowLeft />
             </button>
            <div className='text-white afacad-bold text-sm'>Page {relicPageNumber}</div>
            <button onClick={()=>handlePageChange(1)} 
            className=' text-black afacad-bold text-sm px-2 py-1 rounded-full bg-white hover:bg-black/60
             hover:text-white transition active:scale-95 active:bg-gray-600'>
              <MdKeyboardArrowRight />
             </button>
          </div>
          <div className='absolute right-0 mr-3 flex items-center gap-2'>
            {/* showcase style switcher */}
            <FaList  className={`${!relicShowcaseStyle ? "text-violet-500" : "text-gray-400"}`}/>
            <Switcher1 value={relicShowcaseStyle} setValue={setRelicShowcaseStyle} settingName="relicShowcaseStyle"/>
            <BsFillGridFill  className={`${relicShowcaseStyle ? "text-violet-500" : "text-gray-400"}`}/>
          </div>
        </div>
      </div>

      {/* relic grid */}
      { 
        relicShowcaseStyle &&
        <div className="flex flex-wrap flex-col sm:flex-row w-full p-5 gap-1.5 justify-center bg-amdber-400">
          
          {
            relicsInfo !== null &&
            relicsInfo.map((record, index) => (
              <div
                key={index}
                className={`bg-whide m-1 aspect-[3/2] ${(relicsInfo[index] === "lastItem")?"":"w-[25rem]"} m`}
              >

                {(relicsInfo[index] === "error")?<>
                  <div className="rounded-full bg-red-400 p-2"></div>
                </>:<>
                  {(relicsInfo[index] !== "lastItem") &&
                    <RelicItem info={relicsInfo[index]} relicIndex={(relicPageNumber - 1)*20 + index + 1}/>
                  }
                </>}
                
              </div>
              
            ))
            
          }
        </div>
      }

      {/* relic list */}
      {
          !relicShowcaseStyle &&
          <div className="w-full p-5 h-full">
          
            {
              relicsInfo !== null &&
              
                <RelicList info={relicsInfo} relicPageNumber={relicPageNumber}/>
              
            }
          </div>
      }

    </OverlayScrollbarsComponent>


  )
}

export default DashboardsRelics