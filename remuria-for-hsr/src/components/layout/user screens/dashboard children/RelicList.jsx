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

  return (
    <div className='h-full w-full rounded-md'>
      <table className='w-full table-auto bg-gray-900/60 backdrop-blur-md text-white rounded-md'>
        <thead className='bg-gray-800/50 rounded-md'>
          <tr>
            <th className='px-4 py-1.5 text-left'>#</th>
            <th className='px-4 py-1.5 text-left'>Image</th>
            <th className='px-4 py-1.5 text-left'>Slot</th>
            <th className='px-4 py-1.5 text-left'>Name</th>
            <th className='px-4 py-1.5 text-left'>Set</th>
            <th className='px-4 py-1.5 text-left'>Level</th>
            <th className='px-4 py-1.5 text-left'>Main Stat</th>
            <th className='px-4 py-1.5 text-left'>Sub Stats</th>
            <th className='px-4 py-1.5 text-left'>Rarity</th>
          </tr>
        </thead>
        <tbody>
          {info && info.map((record, index) => {
            if (!record || record === "lastItem" || record === "error" || !record.relic) return null;
            const relic = record.relic;
            const metaArray = relic.tid ? metaArrayGetter(relic.tid) : [];
            return (
              <tr key={index} className={`border-b border-gray-700 ${rarityColourGetter(metaArray)}`}>
                <td className='px-4 py-1.5'>
                  <div className='afacad-bold text-sm text-gray-300'>{(relicPageNumber - 1) * 20 + index + 1}</div>
                </td>
                <td className='px-4 py-1.5'>
                  <img src={imageGetter(metaArray)} alt="" className="w-10 h-10 object-contain" />
                </td>
                <td className='px-4 py-1.5'>
                  <img src={relicIconGetter(metaArray)} alt="" className="w-6 h-6 object-contain" />
                </td>
                <td className='px-4 py-1.5'>
                  <div className='afacad-bold text-sm'>{ localisedRelicName[index] }</div>
                </td>
                <td className='px-4 py-1.5'>
                  <div className='afacad-bold text-sm'>{ localisedSetName[index] }</div>
                </td>
                <td className='px-4 py-1.5'>
                  <div className='afacad-semi-bold text-sm'>{relic.level === "null" ? 0 : relic.level}</div>
                </td>
                <td className='px-4 py-1.5'>
                  <div className='flex items-center'>
                    <img src={statImageGetter(relic.mainType)} alt="" className="w-6 h-6 mr-2" />
                    {statValueGetter(relic.mainValue, relic.mainType)}
                  </div>
                </td>
                <td className='px-4 py-1.5'>
                  <div className='flex flex-wrap gap-1'>
                    {relic.subAffixes.map((sub, subIndex) => (
                      sub ? (
                        <div key={subIndex} className='flex items-center bg-black/20 rounded px-1 py-0.5'>
                          <img src={statImageGetter(sub.type)} alt="" className="w-4 h-4 mr-1" />
                          {statValueGetter(sub.value, sub.type)}
                        </div>
                      ) : <div key={subIndex} className='text-gray-400 text-xs'>Empty</div>
                    ))}
                  </div>
                </td>
                <td className='px-4 py-1.5'>
                  <div className={`flex items-center ${rarityTextColourGetter(metaArray)}`}>
                    <div className='flex'>
                      {Array.from({ length: parseInt(metaArray[0] - 1) }).map((_, i) => (
                        <FaStar key={i} size={12} />
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )
}

export default RelicList