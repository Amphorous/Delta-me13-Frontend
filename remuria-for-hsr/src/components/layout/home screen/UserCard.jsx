import axios from 'axios';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MdArrowBack } from "react-icons/md";
import { removeFocus, setFocus } from '../../../store/userCardSlice';
import avatars from '../../../assets/pfps.json';
import ach from '../../../assets/achievementIcon.webp';
import alb from '../../../assets/albedo.webp';
import { IoMdRefresh } from "react-icons/io";
import { motion, AnimatePresence } from 'framer-motion';
import { addOrReplaceUser } from '../../../store/localUsersSlice';
import { useNavigate } from 'react-router';
import { IoIosArrowForward } from "react-icons/io";
import { IoMdClose } from "react-icons/io";
import { ImEyeBlocked } from "react-icons/im";

//showButtons is for enable/disabling the close & go to dashboard buttons
function UserCard({uid, showButtons}) {

    const navigate = useNavigate();

    // useEffect(()=>{console.log(cardState)}, [])

    //dont forget to add removeFocus
    const localUsers = useSelector( state => state.localUsers );
    const focusedUser = useSelector( state => state.focusedUser );

    const [copyStatus, setCopyStatus] = useState("");

    const [isRefreshPossible, setIsRefreshPossible] = useState(true);
    const [isRefreshButtonActive, setIsRefreshButtonActive] = useState(true);

    const [hovered, setHovered] = useState(false);
    const testRef = useRef(null);
    const [testWidth, setTestWidth] = useState(0);
    const [isPressed, setIsPressed] = useState(false);

    //timeout < 0 => dont allow refresh
    const [timeout, setTimeoutValue] = useState(0);
    const dispatch = useDispatch();

    useLayoutEffect(() => {
        if (testRef.current) {
          const width = hovered ? testRef.current.offsetWidth : 0;
          setTestWidth(width);
        }
      }, [hovered]);

    useEffect(()=>{
            let focusedUserFromLS = localUsers.find( u => u.uid === uid )
            console.log("focuseduserfromls: ", focusedUserFromLS)
            if(focusedUserFromLS === undefined){
                axios.get(`http://localhost:8080/user/dashboard/noRefresh/${uid}`)
                        .then((res) => {

                            let userObjForLocalStorage = {
                                uid: res.data.uid,
                                nickname: res.data.nickname,
                                signature: res.data.signature,
                                region: res.data.region,
                                headIcon: res.data.headIcon,
                                level: res.data.level,
                                achievementCount: res.data.achievementCount,
                                buildsPublic: res.data.buildsPublic
                            }

                            dispatch(removeFocus())
                            // dispatch(addOrReplaceUser(userObjForLocalStorage))
                            // dispatch(setFocus(uid))

                            setIsRefreshButtonActive(true);
                            focusedUserFromLS = userObjForLocalStorage;
                            dispatch(setFocus(focusedUserFromLS));

                        })
                        .catch((err) => {
                            console.log("umm what: ",err)
                            setIsRefreshButtonActive(true);
                        })
            } else {
                dispatch(setFocus(focusedUserFromLS));
            }
            
    }, [localUsers, uid])

    useEffect(()=>{
        axios.get(`http://localhost:8080/user/timeout/${uid}`)
            .then((res) => {
            //console.log(res.data)
            if((res.data < 0)){
                //console.log("(prev < 0) && (isRefreshPossible !== false)")
                setIsRefreshPossible(()=>{return false});
                //console.log("isRefreshPossible", isRefreshPossible)
            } else{
                //console.log("isRefreshPossible !== true")
                setIsRefreshPossible(()=>{return true});
                //console.log("isRefreshPossible", isRefreshPossible)
            }
            setTimeoutValue(res.data);
        })
    }, [uid])

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeoutValue((prev)=>{
                //console.log(prev)
                if((prev < 0)){
                    //console.log("(prev < 0) && (isRefreshPossible !== false)")
                    setIsRefreshPossible(()=>{return false});
                    //console.log("isRefreshPossible", isRefreshPossible)
                } else{
                    //console.log("isRefreshPossible !== true")
                    setIsRefreshPossible(()=>{return true});
                    //console.log("isRefreshPossible", isRefreshPossible)
                }
                return (prev+1);
            })
        }, 1000);
      
        return () => clearInterval(interval);
      }, []);
    

    useEffect(()=>{
        console.log("focused user read in usercard as: ", focusedUser);
    }, [focusedUser])

    function removeFocusOnBackPress(){
        dispatch(removeFocus());
    }

    function profileImageGetter(headIcon){
        //console.log(avatars[`${headIcon}`]) //200001
        if(avatars[`${headIcon}`] !== undefined){
            return "https://enka.network"+avatars[`${headIcon}`]['Icon'];
        }
        return "https://enka.network/ui/hsr/SpriteOutput/AvatarRoundIcon/UI_Message_Contacts_Anonymous.png";
    }

    function regionColourPicker(region){
        switch(region){
            case "MHY": return 'bg-white';
            case "ASIA": return 'bg-[#FDF628]';
            case "CN": return 'bg-[#FD4428]';
            case "NA": return 'bg-[#FDA828]';
            case "EU": return 'bg-[#285AFD]';
            case "THM": return 'bg-[#2feb25]';
        }
        return `bg-purple-400`
    }

    function upsertUserRequest(uid){
        setIsRefreshButtonActive(false);
        setTimeoutValue(-60);
        if(isRefreshPossible){
            axios.get(`http://localhost:8080/user/dashboard/refresh/${uid}`)
                .then((res) => {
                    if(res.data){

                        axios.get(`http://localhost:8080/user/dashboard/noRefresh/${uid}`)
                        .then((res) => {

                            let userObjForLocalStorage = {
                            uid: res.data.uid,
                            nickname: res.data.nickname,
                            signature: res.data.signature,
                            region: res.data.region,
                            headIcon: res.data.headIcon,
                            level: res.data.level,
                            achievementCount: res.data.achievementCount,
                            buildsPublic: res.data.buildsPublic
                            }

                            dispatch(addOrReplaceUser(userObjForLocalStorage))
                            dispatch(setFocus(userObjForLocalStorage))

                            setIsRefreshButtonActive(true);

                        })
                        .catch((err) => {
                            console.log(err)
                            setIsRefreshButtonActive(true);
                        })
                    } else {
                        console.log("subloading failed in the backend it seems")
                    }
                })
                .catch((err) => {
                    console.log(err)
                    setIsRefreshButtonActive(true);
                })
        } else {
            setIsRefreshButtonActive(true);
        }
    }

  return (
    <div className='w-full'>

        {showButtons && 
            <div className="afacad-bold text-8xl text-white text-wrap px-4 py-2 mb-4 rounded-3xl flex items-center">
                <p className='leading-[85%]'>User Found!</p>
            </div>
        }

        <div className='aspect-[31.5/15] w-full  relative rounded-2xl ' 
        
        >
            {/* https://enka.network/ui/UI_NameCardPic_Shougun_P.png */}
            <img src={alb} className='w-full absolute -z-10 rounded-2xl' />
            <div className="absolute aspect-[31.5/17] w-full bg-gray-800/50 rounded-2xl backdrop-blur-[3px]">

                <div className="absolute text-white px-0 vertical-lmao left-[3.2%] top-[16.3%] flex
                 libre-baskerville-regular backdrop-blur-[5px] rounded-4xl z-10">
                    TL: {String(focusedUser?.level ?? "")}
                </div>
                
                <div className="border-2 border-dashed w-[95%] ml-[5%] rounded-2xl h-full border-white/42 z-0 flex flex-col justify-between relative">

                    {(showButtons) && 
                    <div className=" absolute flex flex-col  items-center 
                    justify-center libre-baskerville-regular right-0 top-1/4  -mr-[2px]">

                        <div className="flex items-center justify-center bg-black/50 text-white backdrop-blur-sm py-3 px-2 mb-3
                        rounded-l-full hover:bg-white hover:text-black hover:border-black/42 transition
                        border-l-2 border-t-2 border-b-2 border-dashed border-white/42 cursor-pointer"
                            onClick={()=>{removeFocusOnBackPress()}}
                        >
                            <IoMdClose />
                        </div>

                        <div className="flex items-center justify-center bg-black/50 text-white backdrop-blur-sm py-3 px-2 
                        rounded-l-full hover:bg-white hover:text-black hover:border-black/42 transition
                        border-l-2 border-t-2 border-b-2 border-dashed border-white/42 cursor-pointer"
                            onClick={()=>{navigate(`/dashboard/${uid}`)}}
                        >
                            <IoIosArrowForward />
                        </div>
                        
                    </div>}

                    <div className="cardbody flex flex-col w-full ">
                        <div className="flex nameandpfpbox ml-7 mr-5 mt-5 items-center ">
                            <img src={profileImageGetter(focusedUser?.headIcon)} className='h-full aspect-square bg-black/12 rounded-full 
                                
                            ' />
                            <div className="flex flex-col overflow-hidden text-ellipsis">
                                <p className="libre-baskerville-bold text-white text-[300%]
                                ml-4 overflow-hidden text-ellipsis whitespace-nowrap">{focusedUser?.nickname}</p>
                                <p className="libre-baskerville-regular text-gray-400 text-[80%] -mt-2
                                ml-4 overflow-hidden text-ellipsis whitespace-nowrap">{focusedUser?.signature}</p>
                            </div>
                        </div>

                        <div className="flex flex-col ml-10 mt-5">

                            <div className="flex flex-wrap gap-2">

                                <div className={`${regionColourPicker(focusedUser?.region)} afacad-bold text-black px-2 
                                text-center rounded-sm flex justify-center items-center`}>
                                    {focusedUser?.region}
                                </div>

                                <div className="bg-[#93590D] afacad-bold text-white px-2 text-center rounded-sm flex justify-center items-center">
                                    <img src={ach} className='w-[24px] h-[24px]' />
                                    {focusedUser?.achievementCount}
                                </div>

                                <div className={`${(copyStatus === "")?'bg-[#93590D]':((copyStatus === "Copied")?'bg-[#89b012]':'bg-[#a1381b]')} 
                                afacad-bold text-white px-2 text-center rounded-sm flex justify-center 
                                items-center cursor-copy`}
                                    onClick={() => {
                                        navigator.clipboard.writeText(uid)
                                        .then(() => {
                                            setCopyStatus("Copied"); 
                                            setTimeout(() => {
                                                setCopyStatus(""); 
                                            }, 750);
                                        })
                                        .catch(err => {
                                            setCopyStatus("Failed"); 
                                            setTimeout(() => {
                                                setCopyStatus(""); 
                                            }, 750);
                                        });
                                    }}
                                >
                                    {(copyStatus === "")?
                                    <>UID: {uid}</>:
                                    <>
                                        {(copyStatus === "Copied")?
                                        <>Copied!</>:
                                        <>Copy Failed</>}
                                    </>}
                                </div>

                                {(!focusedUser?.buildsPublic) && 
                                
                                    <div className="bg-[#93310d] afacad-bold text-white px-2 text-center rounded-sm flex gap-1 justify-center items-center">
                                        <ImEyeBlocked size={18}/>
                                        Builds Private
                                    </div>

                                }

                                

                            </div>

                        </div>
                    </div>


                    <div className="flex timeoutbox text-white/70 afacad-light ml-4 mb-1.5 justify-between">
                        <div className="flex">
                            Last Updated: {(timeout+60 < 60)? <>
                                {timeout + 60} seconds ago
                            </>:
                            <>
                                {(timeout+60 < 3600 )? <>
                                    {Math.floor((timeout+60)/60)} minute(s) {Math.floor((timeout+60)%60)} second(s) ago
                                </>: <>
                                    {Math.floor((timeout+60)/3600)} hour(s) ago
                                </>}
                            </>}
                        </div>

                        {(isRefreshPossible && isRefreshButtonActive)?
                            <div className={` ${(isPressed)?'bg-black/80 text-white':'bg-white text-black/70'} transition 
                            px-2 rounded-4xl mr-2 flex items-center justify-center cursor-pointer `}
                            onMouseEnter={() => setHovered(true)}
                            onMouseLeave={() => {{
                                setIsPressed(false);
                                setHovered(false);
                            }}}
                            onMouseDown={() => setIsPressed(true)}
                            onMouseUp={() => setIsPressed(false)}
                            onClick={() => {upsertUserRequest(uid)}}
                        >

                            <motion.div
                            animate={{ width: hovered ? testWidth : 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                            >
                                <AnimatePresence initial={false}>
                                    {hovered && (
                                    <motion.div
                                        className="flex"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <div className="mr-1">
                                            Refresh
                                        </div>
                                    </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            <IoMdRefresh />
                        </div>:
                        <div className='px-2 rounded-4xl mr-2 flex items-center justify-center bg-gray-800 gap-1'>      
                             {timeout*-1} seconds <IoMdRefresh />       
                        </div>}
                        {/* / */}
                        <div className="absolute invisible pointer-events-none h-0 overflow-hidden afacad-light">
                            <div ref={testRef} className="flex">
                                <div className="mr-1">
                                    Refresh
                                </div>
                            </div>
                        </div>
                        {/* / */}
                    </div>
                </div>

            </div>

            <div className="absolute bottom-0 left-0 vertical-text barcode-font mb-2 text-white/42">{uid}</div>

        </div>
        
    </div>
  )
}

export default UserCard