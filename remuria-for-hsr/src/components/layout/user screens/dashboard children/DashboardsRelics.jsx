import axios from 'axios';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import React, { useEffect, useRef, useState } from 'react'
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

  const osRef = useRef(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartScrollTop = useRef(0);
  const [dragging, setDragging] = useState(false);

  function getViewport() {
    return osRef.current?.osInstance()?.elements()?.viewport;
  }

  function handleMouseDown(e) {
    const viewport = getViewport();
    if (!viewport) return;
    isDragging.current = true;
    setDragging(true);
    dragStartY.current = e.clientY;
    dragStartScrollTop.current = viewport.scrollTop;
  }

  useEffect(() => {
    function onMouseMove(e) {
      if (!isDragging.current) return;
      const viewport = getViewport();
      if (!viewport) return;
      viewport.scrollTop = dragStartScrollTop.current - (e.clientY - dragStartY.current);
    }
    function onMouseUp() {
      if (isDragging.current) {
        isDragging.current = false;
        setDragging(false);
      }
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  function getRelicRangeLabel() {
    const start = (relicPageNumber - 1) * 20 + 1;
    if (!Array.isArray(relicsInfo)) return `Relics ${start}–${start + 19}`;
    const count = relicsInfo.filter(r => r !== 'lastItem' && r !== 'error').length;
    if (count === 0) return 'No relics';
    return `Relics ${start}–${start + count - 1}`;
  }

  useEffect(()=>{
    axios.get(`${import.meta.env.VITE_CELESTIA_API_URL}/user/relics/${uid}/${relicPageNumber}`)
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
      setRelicsInfo(null);
      setRelicPageNumber(relicPageNumber - 1);
    } else if(direction === 1 && relicsInfo !== null && relicsInfo[0] !== "lastItem"){
      setRelicsInfo(null);
      setRelicPageNumber(relicPageNumber + 1);
    }
  }

  function RelicSkeleton() {
    return (
      <div className="aspect-[3/2] rounded-lg border border-white/5 bg-gray-900/60 overflow-hidden flex p-1.5 gap-1.5 animate-pulse">
        <div className="w-[30%] bg-gray-800/60 rounded-md" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="bg-gray-800/60 rounded-md h-[30%]" />
          <div className="bg-gray-800/60 rounded-md flex-1" />
        </div>
        <div className="w-[3%] bg-gray-800/40 rounded-r-lg" />
      </div>
    );
  }

  return (
    <OverlayScrollbarsComponent
      ref={osRef}
      options={{
        scrollbars: { autoHide: 'scroll' },
      }}
      className="w-full h-full"
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
    >
      <div className='w-full px-4 py-2 sticky top-0 z-10'>
        <div className='w-full rounded-lg bg-gray-950/70 backdrop-blur-md px-4 py-2 flex items-center justify-center relative'>

          {/* range label — left */}
          <div className='absolute left-0 ml-4 pointer-events-none'>
            <span className='text-white/40 afacad-light text-xs'>{getRelicRangeLabel()}</span>
          </div>

          <div className='flex items-center gap-2' onMouseDown={e => e.stopPropagation()}>
            <button onClick={()=>handlePageChange(-1)}
            className='text-black afacad-bold text-sm px-2.5 py-1.5 rounded-full bg-white hover:bg-black/70
             hover:text-white transition active:scale-95'>
              <MdKeyboardArrowLeft size={16}/>
             </button>
            <div className='text-white afacad-bold text-sm min-w-[4rem] text-center'>Page {relicPageNumber}</div>
            <button onClick={()=>handlePageChange(1)}
            className='text-black afacad-bold text-sm px-2.5 py-1.5 rounded-full bg-white hover:bg-black/70
             hover:text-white transition active:scale-95'>
              <MdKeyboardArrowRight size={16}/>
             </button>
          </div>
          <div className='absolute right-0 mr-4 flex items-center gap-2' onMouseDown={e => e.stopPropagation()}>
            <FaList  className={`${!relicShowcaseStyle ? "text-[var(--accent-muted)]" : "text-gray-500"} transition`}/>
            <Switcher1 value={relicShowcaseStyle} setValue={setRelicShowcaseStyle} settingName="relicShowcaseStyle"/>
            <BsFillGridFill  className={`${relicShowcaseStyle ? "text-[var(--accent-muted)]" : "text-gray-500"} transition`}/>
          </div>
        </div>
      </div>

      {/* relic grid */}
      {relicShowcaseStyle &&
        <div className="w-full p-4 grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(22rem, 1fr))' }}
        >
          {relicsInfo === null
            ? Array.from({ length: 6 }).map((_, i) => <RelicSkeleton key={i} />)
            : relicsInfo.map((record, index) => (
                relicsInfo[index] !== "lastItem" && (
                  <div key={index} className="aspect-[3/2]">
                    {relicsInfo[index] === "error" ?
                      <div className="rounded-lg bg-red-900/40 border border-red-500/30 h-full flex items-center justify-center text-red-400 afacad-bold text-sm">
                        Failed to load
                      </div>
                      :
                      <RelicItem info={relicsInfo[index]} relicIndex={(relicPageNumber - 1)*20 + index + 1}/>
                    }
                  </div>
                )
              ))
          }
        </div>
      }

      {/* relic list */}
      {!relicShowcaseStyle &&
        <div className="w-full p-4">
          {relicsInfo === null
            ? <div className="flex flex-col gap-2 animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-900/60 rounded-md border border-white/5" />
                ))}
              </div>
            : <RelicList info={relicsInfo} relicPageNumber={relicPageNumber}/>
          }
        </div>
      }

    </OverlayScrollbarsComponent>


  )
}

export default DashboardsRelics