import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { selectPillColorMode } from '../../../../store/settingsSlice'

const ACTIVE_TEXT_CLASSES = {
    theme: 'text-[var(--accent-text)]',
    card:  'text-[var(--pill-accent-text)]',
}

function Tab({children, setPosition, selectedTab, setSelectedTab, hoveredTab, setHoveredTab}) {
    const pillColorMode = useSelector(selectPillColorMode)

    const ref = useRef(null);

    useEffect(()=>{
        if (!ref.current) return;
        if((children !== selectedTab) && (selectedTab !== "")) return;
        if(selectedTab === ""){
            setPosition((prev)=>({
                ...prev,
                opacity: 0,
            }))
            return;
        }

        const {width} = ref.current.getBoundingClientRect();
        setPosition({
            width,
            opacity: 1,
            left: ref.current.offsetLeft,
        })
    }, [selectedTab])

  return (
    <div 
    ref={ref}
    onMouseEnter={()=>{
        if (!ref.current) return;
        if((children !== selectedTab) && (selectedTab !== "")) return;

        setHoveredTab(children);

        const {width} = ref.current.getBoundingClientRect();
        setPosition({
            width,
            opacity: 1,
            left: ref.current.offsetLeft,
        })
        //console.log(children)
    }}
    onClick={()=>{
        if(children === selectedTab){
            setSelectedTab("");
            return;
        }
        setSelectedTab(String(children)) //this one
    }}
    className={`relative z-10 cursor-pointer px-4 py-3 flex
     items-center justify-center gap-1 afacad-light uppercase transition-colors duration-200
     ${pillColorMode === 'bw' ? 'text-white mix-blend-difference' : ''}
     ${(pillColorMode !== 'bw' && (selectedTab === "" ? hoveredTab === children : selectedTab === children)) ? (ACTIVE_TEXT_CLASSES[pillColorMode] ?? ACTIVE_TEXT_CLASSES.theme) : 'text-white'}`}>{children}</div>
  )
}

export default Tab