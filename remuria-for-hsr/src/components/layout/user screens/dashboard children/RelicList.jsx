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
import { selectLoc } from '../../../../store/localisationSlice';
import axios from 'axios';
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

function RelicList({ info, relicPageNumber }) {

    const [localisedRelicName, setLocalisedRelicName] = useState([]);
    const [localisedSetName, setLocalisedSetName] = useState([]);

    const selectedLoc = useSelector(selectLoc);

    useEffect(() => {
      if (!info || info.length === 0) return;

      const fetchLocalisationInfo = async () => {
          const promises = info.map((record) => {
              if (record?.relic) {
                  return axios.get(`${import.meta.env.VITE_TRANSLATION_API_URL}/hsr/relic-info/${selectedLoc}/${record.relic.tid}`)
                      .then((res) => {
                          return {
                              relicName: res.data.ArtifactName,
                              setName: res.data.SetName
                          };
                      })
                      .catch((err) => {
                          console.log("Localisation Endpoint Error: ", err);
                          return { relicName: "Unknown", setName: "Unknown" }; 
                      });
              }
              return Promise.resolve({ relicName: "", setName: "" });
          });

          const results = await Promise.all(promises);

          const tempRelicNames = results.map(r => r.relicName);
          const tempSetNames = results.map(r => r.setName);

          setLocalisedRelicName(tempRelicNames);
          setLocalisedSetName(tempSetNames);
      };

      fetchLocalisationInfo();

  }, [selectedLoc, info]);




    function imageGetter(relicMetaInfo){
        if(relicMetaInfo){
            return `https://enka.network/ui/hsr/SpriteOutput/ItemIcon/RelicIcons/IconRelic_${relicMetaInfo[1]}_${relicMetaInfo[2]}.png`
        }
    }

    function relicIconGetter(relicMetaInfo){
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

    function rarityColourGetter(relicMetaInfo){
        if(relicMetaInfo){
            switch(relicMetaInfo[0]){
                case "6": return `border-amber-400/40 `;
                case "5": return "border-purple-400/40";
                case "4": return "border-blue-400/40";
                case "3": return "border-gray-400/40";
            }
        }
    }

    function rarityBGColourGetter(relicMetaInfo){
        if(relicMetaInfo){
            switch(relicMetaInfo[0]){
                case "6": return `bg-amber-400/40 `;
                case "5": return "bg-purple-400/40";
                case "4": return "bg-blue-400/40";
                case "3": return "bg-gray-400/40";
            }
        }
    }

    function rarityTextColourGetter(relicMetaInfo){
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
            else if(statType.toLowerCase().includes("heal")) return iconMaxHP
            else if(statType.toLowerCase().includes("sp")) return iconSPRatio
    }
    
    function statValueGetter(statValue, statType){
            if(statType.toLowerCase().includes("ratio") || statType.toLowerCase().includes("chance") ||
             statType.toLowerCase().includes("resistance") || statType.toLowerCase().includes("probability") ||
             statType.toLowerCase().includes("criticaldamage")){
                // console.log(statType)
                return (<div className='text-white afacad-semi-bold text-sm text-center'>+{(statValue*100).toFixed(2)}%</div>);
            } else {
                return (<div className='text-white afacad-semi-bold text-sm text-center'>+{statValue.toFixed(2)}</div>);
            }
    }

    function metaArrayGetter(tid){
        return [ tid.substring(0,1), tid.substring(1, tid.length-1), tid.substring(tid.length-1) ]
    }

  function statNameGetter(statType) {
    const t = statType.toLowerCase();
    if (t.includes("criticaldamage"))    return "CRIT DMG";
    if (t.includes("criticalchance"))    return "CRIT Rate";
    if (t.includes("attack"))            return "ATK";
    if (t.includes("break"))             return "Break";
    if (t.includes("defence"))           return "DEF";
    if (t.includes("fireaddedratio"))    return "Fire";
    if (t.includes("iceaddedratio"))     return "Ice";
    if (t.includes("imaginaryaddedratio")) return "Imaginary";
    if (t.includes("heal"))              return "Healing";
    if (t.includes("joy"))               return "Elation";
    if (t.includes("hp"))                return "HP";
    if (t.includes("physicaladdedratio")) return "Physical";
    if (t.includes("quantumaddedratio")) return "Quantum";
    if (t.includes("speed"))             return "SPD";
    if (t.includes("statusprobability")) return "Eff Hit";
    if (t.includes("statusresistance"))  return "Eff RES";
    if (t.includes("thunderaddedratio")) return "Lightning";
    if (t.includes("windaddedratio"))    return "Wind";
    if (t.includes("sp"))                return "Energy";
    return "";
  }

  function inlineStatValue(statValue, statType) {
    const isPercent = statType.toLowerCase().includes("ratio") ||
                      statType.toLowerCase().includes("chance") ||
                      statType.toLowerCase().includes("resistance") ||
                      statType.toLowerCase().includes("probability") ||
                      statType.toLowerCase().includes("criticaldamage");
    return isPercent
      ? `+${(statValue * 100).toFixed(1)}%`
      : `+${statValue.toFixed(1)}`;
  }

  return (
    <div className='w-full flex flex-col gap-1'>

      {/* header */}
      <div className='flex items-center gap-3 px-3 py-1 text-white/55 afacad-bold text-xs tracking-widest uppercase select-none'>
        <div className='w-11 shrink-0' />
        <div className='w-52 shrink-0'>Name</div>
        <div className='w-10 text-center shrink-0'>Lvl</div>
        <div className='w-44 shrink-0'>Main</div>
        <div className='flex-1'>Substats</div>
        <div className='w-14 shrink-0'>Rarity</div>
      </div>

      {/* rows */}
      {info && info.map((record, index) => {
        if (!record || record === "lastItem" || record === "error" || !record.relic) return null;
        const relic = record.relic;
        const metaArray = relic.tid ? metaArrayGetter(relic.tid) : [];

        return (
          <div key={index}
            className='flex items-center gap-3 rounded-lg bg-gray-900/50 backdrop-blur-sm overflow-hidden hover:bg-gray-800/60 transition-colors'
          >
            {/* rarity accent bar */}
            <div className={`w-1 self-stretch shrink-0 ${rarityBGColourGetter(metaArray)}`} />

            {/* piece image + slot icon overlay */}
            <div className='w-10 shrink-0 relative py-2'>
              <img src={imageGetter(metaArray)} alt="" className="w-10 h-10 object-contain" />
              <img src={relicIconGetter(metaArray)} alt="" className="absolute bottom-1.5 right-0 w-4 h-4 object-contain opacity-60 bg-black/40 rounded-full p-0.5" />
            </div>

            {/* name + set */}
            <div className='w-52 shrink-0 min-w-0 py-2.5'>
              <p className='text-white afacad-bold text-base leading-tight truncate'>
                {localisedRelicName[index]}
              </p>
              <p className='text-white/40 afacad-light text-xs truncate mt-0.5'>
                {localisedSetName[index]}
              </p>
            </div>

            {/* level */}
            <div className={`w-10 text-center afacad-bold text-sm shrink-0 ${rarityTextColourGetter(metaArray)}`}>
              +{relic.level === "null" ? 0 : relic.level}
            </div>

            {/* main stat */}
            <div className='w-44 shrink-0 flex items-center gap-2'>
              <img src={statImageGetter(relic.mainType)} alt="" className="w-5 h-5 object-contain shrink-0" />
              <span className='text-white/50 afacad-light text-sm whitespace-nowrap'>{statNameGetter(relic.mainType)}</span>
              <span className='text-white afacad-bold text-sm whitespace-nowrap'>
                {inlineStatValue(relic.mainValue, relic.mainType)}
              </span>
            </div>

            {/* sub stats — 4 fixed chips, each capped so they don't bloat */}
            <div className='flex-1 flex gap-2 py-2 pr-3'>
              {Array.from({ length: 4 }).map((_, i) => {
                const sub = relic.subAffixes[i];
                return sub ? (
                  <div key={i} className='flex items-center gap-1.5 bg-black/25 rounded-md px-2 py-1.5 w-[23%] min-w-0 shrink-0'>
                    <img src={statImageGetter(sub.type)} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
                    <span className='text-white/45 afacad-light text-xs whitespace-nowrap truncate flex-1'>
                      {statNameGetter(sub.type)}
                    </span>
                    <span className='text-white afacad-semi-bold text-xs whitespace-nowrap'>
                      {inlineStatValue(sub.value, sub.type)}
                    </span>
                  </div>
                ) : (
                  <div key={i} className='bg-gray-800/30 rounded-md w-[23%] shrink-0 flex items-center justify-center text-white/15 text-xs py-1.5'>
                    —
                  </div>
                );
              })}
            </div>

            {/* rarity stars */}
            <div className={`w-14 shrink-0 flex gap-0.5 items-center pr-3 ${rarityTextColourGetter(metaArray)}`}>
              {Array.from({ length: parseInt(metaArray[0]) - 1 }).map((_, i) => (
                <FaStar key={i} size={10} />
              ))}
            </div>

          </div>
        );
      })}
    </div>
  )
}

export default RelicList