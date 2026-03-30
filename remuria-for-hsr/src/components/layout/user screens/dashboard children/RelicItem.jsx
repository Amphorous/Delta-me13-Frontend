import React, { use, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CiStar } from "react-icons/ci";
import { FaStar } from "react-icons/fa";
import { LuUsersRound } from "react-icons/lu";
import headIcon from "../../../../assets/relicIcons/IconRelicHead.png"
import handsIcon from "../../../../assets/relicIcons/IconRelicHands.png"
import bodyIcon from "../../../../assets/relicIcons/IconRelicBody.png"
import footIcon from "../../../../assets/relicIcons/IconRelicFoot.png"
import neckIcon from "../../../../assets/relicIcons/IconRelicNeck.png"
import goodsIcon from "../../../../assets/relicIcons/IconRelicGoods.png"
import { useSelector } from "react-redux";
import { selectLocalization, selectRelicsInfo, selectTextMap, selectItemConfigRelic } from '../../../../store/loadedJSONSlice'; // relegate this to the backend soon
import iconAttack from "../../../../assets/downloaded_icons/IconAttack.png"
import iconBreakUp from "../../../../assets/downloaded_icons/IconBreakUp.png"
import iconCriticalChance from "../../../../assets/downloaded_icons/IconCriticalChance.png"
import iconCriticalDamage from "../../../../assets/downloaded_icons/IconCriticalDamage.png"
import iconDefence from "../../../../assets/downloaded_icons/IconDefence.png"
import iconFireAddedRatio from "../../../../assets/downloaded_icons/IconFireAddedRatio.png"
import iconIceAddedRatio from "../../../../assets/downloaded_icons/IconIceAddedRatio.png"
import iconImaginaryAddedRatio from "../../../../assets/downloaded_icons/IconImaginaryAddedRatio.png"
import iconJoy from "../../../../assets/downloaded_icons/IconJoy.png"
import iconMaxHP from "../../../../assets/downloaded_icons/IconMaxHP.png"
import iconPhysicalAddedRatio from "../../../../assets/downloaded_icons/IconPhysicalAddedRatio.png"
import iconQuantumAddedRatio from "../../../../assets/downloaded_icons/IconQuantumAddedRatio.png"
import iconSpeed from "../../../../assets/downloaded_icons/IconSpeed.png"
import iconStatusProbability from "../../../../assets/downloaded_icons/IconStatusProbability.png"
import iconStatusResistance from "../../../../assets/downloaded_icons/IconStatusResistance.png"
import iconThunderAddedRatio from "../../../../assets/downloaded_icons/IconThunderAddedRatio.png"
import iconWindAddedRatio from "../../../../assets/downloaded_icons/IconWindAddedRatio.png"
import iconSPRatio from "../../../../assets/downloaded_icons/IconSPRatio.png"

function RelicItem({info, relicIndex}) {
    //meta info has [ rarity+1, setId, position/type ] (this is basically segmenting the tid into 3 parts)

    // make sure to have a state function which gives an option to show relics in a list (compact) or a detailed format

    const [relicMetaInfo, setRelicMetaInfo] = useState(null)
    const [hoveredRelicRarity, setHoveredRelicRarity] = useState(false);
    const [relicAnimations, setRelicAnimations] = useState(false); // currently set to false, but implement a setting slice later and get this value from there

    const loc = useSelector(selectLocalization);
    const relics = useSelector(selectRelicsInfo);
    const textMap = useSelector(selectTextMap);
    const itemConfigRelic = useSelector(selectItemConfigRelic);

    function getItemNameHashById(id){
        const item = itemConfigRelic.find(r => r.ID == id);
        const t = item?.ItemName?.Hash;
        return t;
    };

    function imageGetter(){
        if(relicMetaInfo){
            return `https://enka.network/ui/hsr/SpriteOutput/ItemIcon/RelicIcons/IconRelic_${relicMetaInfo[1]}_${relicMetaInfo[2]}.png`
        }
    }

    function relicIconGetter(){
        if(relicMetaInfo){
            switch(relicMetaInfo[2]){
                case "1": return headIcon
                case "2": return handsIcon
                case "3": return bodyIcon
                case "4": return footIcon
                case "5": return neckIcon
                case "6": return goodsIcon
            }
        }
    }

    useEffect(()=>{
        if(info){
            console.log("relic info: ",info.relic)
            let metaString = info.relic.tid;
            let metaArray = [ metaString.substring(0,1), metaString.substring(1, metaString.length-1), metaString.substring(metaString.length-1) ]
            setRelicMetaInfo(metaArray);
        }
    }, [info])

    useEffect(()=>{console.log("meta array: ", relicMetaInfo)}, [relicMetaInfo])

    function rarityColourGetter(){
        if(relicMetaInfo){
            switch(relicMetaInfo[0]){
                case "6": return `border-amber-400/40 `;
                case "5": return "border-purple-400/40";
                case "4": return "border-blue-400/40";
                case "3": return "border-gray-400/40";
            }
        }
    }

    function rarityBGColourGetter(){
        if(relicMetaInfo){
            switch(relicMetaInfo[0]){
                case "6": return `bg-amber-400/40 `;
                case "5": return "bg-purple-400/40";
                case "4": return "bg-blue-400/40";
                case "3": return "bg-gray-400/40";
            }
        }
    }

    function rarityTextColourGetter(){
        if(relicMetaInfo){
            switch(relicMetaInfo[0]){
                case "6": return `text-amber-200/80 `;
                case "5": return "text-purple-200/80";
                case "4": return "text-blue-200/80";
                case "3": return "text-gray-200/80";
            } 
        }
    }

    function cleanString(str) {
        return str.replace(/[^a-zA-Z0-9]/g, '');
    }

    function handleRelicAnimation(isEntering){ //follow up to the bootleg code, but can he used with minimal modification pretty sure
        if(relicAnimations){
            setHoveredRelicRarity(isEntering)
        } else{
            setHoveredRelicRarity(true)
        }
    }

    function statImageGetter(statType){
        if(statType.toLowerCase().includes("attack")) return iconAttack
        else if(statType.toLowerCase().includes("break")) return iconBreakUp
        else if(statType.toLowerCase().includes("criticalchance")) return iconCriticalChance
        else if(statType.toLowerCase().includes("criticaldamage")) return iconCriticalDamage
        else if(statType.toLowerCase().includes("defence")) return iconDefence
        else if(statType.toLowerCase().includes("fireaddedratio")) return iconFireAddedRatio
        else if(statType.toLowerCase().includes("iceaddedratio")) return iconIceAddedRatio
        else if(statType.toLowerCase().includes("imaginaryaddedratio")) return iconImaginaryAddedRatio
        else if(statType.toLowerCase().includes("joy")) return iconJoy
        else if(statType.toLowerCase().includes("hp")) return iconMaxHP
        else if(statType.toLowerCase().includes("physicaladdedratio")) return iconPhysicalAddedRatio
        else if(statType.toLowerCase().includes("quantumaddedratio")) return iconQuantumAddedRatio
        else if(statType.toLowerCase().includes("speed")) return iconSpeed
        else if(statType.toLowerCase().includes("statusprobability")) return iconStatusProbability
        else if(statType.toLowerCase().includes("statusresistance")) return iconStatusResistance
        else if(statType.toLowerCase().includes("thunderaddedratio")) return iconThunderAddedRatio
        else if(statType.toLowerCase().includes("windaddedratio")) return iconWindAddedRatio
        else if(statType.toLowerCase().includes("sp")) return iconSPRatio
    }

    function statValueGetter(statValue, statType){
        if(statType.toLowerCase().includes("ratio") || statType.toLowerCase().includes("chance") ||
         statType.toLowerCase().includes("resistance") || statType.toLowerCase().includes("probability") ||
         statType.toLowerCase().includes("criticaldamage")){
            console.log(statType)
            return (<div className='text-white afacad-semi-bold text-sm text-center'>+{(statValue*100).toFixed(2)}%</div>);
        } else {
            return (<div className='text-white afacad-semi-bold text-sm text-center'>+{statValue.toFixed(2)}</div>);
        }
    }

    useEffect(()=>{ //bootleg code, make sure you create a slice to store settings info and get this setting from there (store the info in local perhaps)
        handleRelicAnimation(false);
    }, [])

  return (
    <>{relicMetaInfo && <>
        {/* <div className={`rounded-full bg-gray-400 border-2 ${rarityColourGetter()} min-w-[6vw] aspect-[1/3.8] shadow-xl shadow-black/70 overflow-hidden flex flex-col `}
        onClick={()=>{console.log("relic info:", info.relic.tid)}}>
            <img src={imageGetter()} alt="" className="  aspect-square h-[20%] bg-amber-400" />
        </div> */}

        <div className={`rounded-md border-1 ${rarityColourGetter()} shadow-md shadow-black/50 overflow-hidden flex w-full h-full p-1 min-w-1/2 bg-gray-800/40 backdrop-blur-md`}>

            <div className="relative h-full w-full mr-1 flex">
               <div className='h-full w-1/3 bg-gray-700/40 rounded-md mr-1 flex flex-col items-center justify-center'>
                    {/* image section */}
                    <img src={imageGetter()} alt="" className="aspect-square h-full w-full object-contain " />
                    <div className='bg-blfack w-full flex justify-evenly text-white m-2'>
                        <img src={relicIconGetter()} alt="" className="aspect-square h-4.5 object-contain rounded-full " />
                        <LuUsersRound className='hover:mix-blend-overlay transition'/>
                    </div>
               </div>
               <div className='h-full w-2/3 flex flex-col'>
                    <div className='w-full bg-gray-700/40 rounded-md mb-1 h-1/3'>
                        {/* name section */}
                        { relicMetaInfo && <>
                            <div className='flex flex-col px-2 w-full h-full justify-between'>
                                <div className='text-white afacad-bold text-lg mt-2 '
                                    style={{lineHeight: 1.1}}
                                >
                                    {textMap[getItemNameHashById(info.relic.tid)]} {/*operation too heavy, immediate backend relegation required*/}
                                </div>
                                <div className='text-white afacad-bold text-sm mb-1.5'>
                                    {loc["en"][relics["Sets"][relicMetaInfo[1]]["Name"]]} {/*might have to change loc to dynamic later*/}
                                </div>
                            </div>
                        </>}
                    </div>
                    <div className='w-full bg-gray-700/40 rounded-md h-2/3 flex items-center'>
                        {/* stats section */}
                        <div className='h-[95%] mx-1 bg-black/20 rounded-md w-[43%] flex flex-col items-center'>
                            {/* main stat */}

                            <div className='h-[5%] text-center text-white afacad-bold text-sm my-1'>+{`${(info.relic.level === "null" ? 0 : info.relic.level)}`}</div>
                            <div className='h-full w-full mt-1 flex flex-col items-center justify-center'>
                                <img src={`${statImageGetter(info.relic.mainType)}`} alt=";(" className="aspect-square w-1/2 mb-3 object-contain " />
                                {statValueGetter(info.relic.mainValue, info.relic.mainType)} 
                            </div>

                        </div>
                        <div className='h-[99%]  rounded-md w-full mr-2.5'>
                            {/* map sub stats */}
                            {Array.from({ length: 4 }).map((_, index) => {
                                const sub = info.relic.subAffixes[index];

                                return (
                                    <div key={index} className='h-[22%] w-full m-1'>
                                        {sub ? 
                                        <>
                                            <div className='w-full bg-black/20 rounded-md h-full flex items-center'>
                                                <img src={`${statImageGetter(sub.type)}`} alt=";(" className="aspect-square h-1/2 object-contain mx-3" />
                                                {statValueGetter(sub.value, sub.type)} 
                                            </div>
                                        </> : <>
                                            <div className='w-full bg-gray-700 rounded-md h-full flex items-center justify-center text-white/40 afacad-bold'>
                                                Empty
                                            </div>
                                        </>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
               </div>
            </div>



            {/* <div className={`absdolute h-full right-0 top-0 w-2 rounded-lg ${rarityBGColourGetter()} `}></div> */}

            <motion.div
             onMouseEnter={()=>handleRelicAnimation(true)}
             onMouseLeave={()=>handleRelicAnimation(false)}
             animate={{ width: hoveredRelicRarity? "10%": "2%" }} //change the val to 2% if you want to have a minimisable
             transition={{ duration: 0.3, ease: 'easeInOut' }}
             className={`h-full right-0 top-0 rounded-lg flex flex-col ${rarityBGColourGetter()}`}
            >
                <AnimatePresence initial={false}>
                    {hoveredRelicRarity && (
                        <motion.div
                            className="flex flex-col justify-between h-full items-center m-1 my-3 bg-bladck"
                            initial = {{ opacity: 0 }}
                            animate = {{ opacity: 1 }}
                            exit={{ 
                                opacity: 0,
                                transition: { duration: 0.15, ease: "easeOut" }
                            }}
                            transition={{
                                opacity: { duration: 0.2, ease: "easeInOut", delay: 0.07 }
                            }}
                        >
                            { relicMetaInfo && 
                                <div className={`flex flex-col justify-between h-full w-full items-center ${rarityTextColourGetter()} mix-blend-lighten`}>
                                    <div className="text-center flex flex-col justify-center items-center ">
                                        {Array.from({ length: relicMetaInfo[0] - 1 }).map((_, i) => (
                                            <FaStar key={i} size={14} />
                                        ))}
                                    </div>
                                    <div className={`text-center text-sm vertical-text barcode-font mr-2.5  wider                                    
                                    `}>{`${cleanString(info.relic.relicId)}`}</div>
                                </div>
                            }

                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

        </div>
    </>}</>
  )
}

export default RelicItem