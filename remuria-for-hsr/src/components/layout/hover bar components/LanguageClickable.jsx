import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BsTranslate } from "react-icons/bs";
import { useSelector, useDispatch } from "react-redux";
import { selectLoc, setLoc } from '../../../store/localisationSlice';

const ALL_KNOWN_LOCS = ["en", "cn", "tw", "de", "es", "fr", "id", "jp", "kr", "pt", "ru", "th", "vi"];

function LanguageClickable() {

    const falsinator = false;

    const selectedLoc = useSelector(selectLoc);
    const dispatch = useDispatch();

    const [allLocs, setAllLocs] = useState(
        ALL_KNOWN_LOCS.map(lang => ({ [lang]: lang === "en" }))
    );

    useEffect(() => {
        fetch(`${import.meta.env.VITE_TRANSLATION_API_URL}/hsr/localization/getlist`)
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(data => {
                const available = new Set(data.map(obj => Object.keys(obj)[0]));
                const merged = [...ALL_KNOWN_LOCS];
                available.forEach(lang => { if (!merged.includes(lang)) merged.push(lang); });
                setAllLocs(merged.map(lang => ({ [lang]: available.has(lang) })));
            })
            .catch(() => {
                setAllLocs(ALL_KNOWN_LOCS.map(lang => ({ [lang]: lang === "en" })));
            });
    }, []);

    const [showLocDropdown, setShowLocDropdown] = useState(false);
    const [positionReady, setPositionReady] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setShowLocDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useLayoutEffect(() => {
        if (showLocDropdown && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 5,
                left: rect.left
            });
            setPositionReady(true);
        } else {
            setPositionReady(false);
        }
    }, [showLocDropdown]);

  return (
    <div className="mr-3 p-1 hover:bg-gray-400/15 rounded-sm transition cursor-pointer flex items-center gap-1 relative"
    
        ref={buttonRef} 
        onClick={() => {setShowLocDropdown(prev => !prev);console.log("clicked loc dropdown, showLocDropdown is now: ", !showLocDropdown)}}
    >
        <BsTranslate /> {selectedLoc.toUpperCase()}
        {showLocDropdown && positionReady && createPortal(
            <AnimatePresence>
                <motion.div 
                    ref={dropdownRef}
                    className='fixed bg-gray-800/90 backdrop-blur-md rounded-md p-2 flex flex-col gap-1 z-50'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    style={{
                        top: `${dropdownPos.top}px`,
                        left: `${dropdownPos.left}px`
                    }}
                >
                {allLocs.map( (locObj, index) => {
                    const locKey = Object.keys(locObj)[0];
                    const locValue = locObj[locKey];
                    const isSelected = locKey === selectedLoc;
                    if(isSelected) return (<div key={index} ></div>);
                    return (
                        <div 
                            key={index} 
                            className={`px-2 py-1 rounded-sm cursor-pointer text-center afacad-light ${locValue ? "text-white" : "text-gray-400"} hover:bg-gray-400/20 ${isSelected ? "bg-gray-400/30" : ""}`}
                            onClick={() => {
                                (locValue)?(
                                    dispatch(setLoc(locKey))
                                ):(
                                    alert("This language is not currently available, stay tuned for future updates!")
                                );
                                setShowLocDropdown(false);
                            }}
                        >
                            {locKey.toUpperCase()}
                        </div>
                    )
                })}
                </motion.div>
            </AnimatePresence>,
            document.body
        )}
    </div>
  )
}
    

export default LanguageClickable