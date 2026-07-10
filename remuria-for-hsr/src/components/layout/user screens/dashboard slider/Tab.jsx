import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { selectPillColorMode } from '../../../../store/settingsSlice'

const ACTIVE_TEXT_CLASSES = {
    theme: 'text-[var(--accent-text)]',
    card:  'text-[var(--pill-accent-text)]',
}

function Tab({children, icon, setPosition, selectedTab, setSelectedTab, hoveredTab, setHoveredTab}) {
    const pillColorMode = useSelector(selectPillColorMode)

    const ref = useRef(null);

    useEffect(()=>{
        if (!ref.current) return;
        if(selectedTab === ""){
            setPosition((prev)=>({
                ...prev,
                opacity: 0,
            }))
            return;
        }
        if(children !== selectedTab) return;

        const update = () => {
            if (!ref.current) return;
            const {width} = ref.current.getBoundingClientRect();
            setPosition({
                width,
                opacity: 1,
                left: ref.current.offsetLeft,
            })
        };
        update();

        // Re-sync the cursor pill when layout settles after mount (late web
        // fonts / dev stylesheet injection) — a one-shot measurement taken
        // before that leaves the pill with a stale width/left until the next
        // hover. Observing the parent too catches this tab *shifting* because
        // a sibling resized (position changes alone don't fire an observer on
        // this element).
        const observer = new ResizeObserver(update);
        observer.observe(ref.current);
        if (ref.current.parentElement) observer.observe(ref.current.parentElement);
        return () => observer.disconnect();
    }, [selectedTab])

  return (
    <div
    ref={ref}
    title={children}
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
    }}
    onClick={()=>{
        if(children === selectedTab){
            setSelectedTab("");
            return;
        }
        setSelectedTab(String(children))
    }}
    className={`relative z-10 cursor-pointer px-2.5 py-2 flex
     items-center justify-center transition-colors duration-200
     ${pillColorMode === 'bw' ? 'text-white mix-blend-difference' : ''}
     ${(pillColorMode !== 'bw' && (selectedTab === "" ? hoveredTab === children : selectedTab === children)) ? (ACTIVE_TEXT_CLASSES[pillColorMode] ?? ACTIVE_TEXT_CLASSES.theme) : 'text-white'}`}>
      {icon || children}
    </div>
  )
}

export default Tab