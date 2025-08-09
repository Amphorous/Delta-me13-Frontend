import axios from 'axios';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MdArrowBack } from "react-icons/md";
import { removeFocus, setFocus } from '../../../store/userCardSlice';
import avatars from '../../../assets/pfps.json';
import ach from '../../../assets/achievementIcon.webp';
import { IoMdRefresh } from "react-icons/io";
import { motion, AnimatePresence } from 'framer-motion';
import { addOrReplaceUser } from '../../../store/localUsersSlice';
import { useNavigate } from 'react-router';
import { IoIosArrowForward } from "react-icons/io";
import { IoMdClose } from "react-icons/io";

function UserCard({uid, cardState}) {

    const navigate = useNavigate()

    // useEffect(()=>{console.log(cardState)}, [])

    //dont forget to add removeFocus
    const localUsers = useSelector( state => state.localUsers );
    const [focusedUserDetails, setFocusedUserDetails] = useState();
    const [isBackPressed, setIsBackPressed] = useState(false);

    const [isRefreshPossible, setIsRefreshPossible] = useState(true);
    const [isRefreshButtonActive, setIsRefreshButtonActive] = useState(true);

    const [hovered, setHovered] = useState(false);
    const testRef = useRef(null);
    const [testWidth, setTestWidth] = useState(0);
    const [isPressed, setIsPressed] = useState(false);

    //timeout < 0 => dont allow refresh
    const [timeout, setTimeout] = useState(0);
    const dispatch = useDispatch();

    useLayoutEffect(() => {
        if (testRef.current) {
          const width = hovered ? testRef.current.offsetWidth : 0;
          setTestWidth(width);
        }
      }, [hovered]);

    useEffect(()=>{
        setFocusedUserDetails(() => {
            return localUsers.filter( u => u.uid === uid)[0]
        })
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
            setTimeout(res.data);
        })
    }, [uid])

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeout((prev)=>{
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
    

    // useEffect(()=>{
    //     console.log("focused user info loaded: ", focusedUserDetails);
    // }, [focusedUserDetails])

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
        setTimeout(-60);
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
                            achievementCount: res.data.achievementCount
                            }

                            dispatch(addOrReplaceUser(userObjForLocalStorage))
                            dispatch(setFocus(uid))

                            setIsRefreshButtonActive(true);

                        })
                        .catch((err) => {
                            console.log(err)
                            setIsRefreshButtonActive(true);
                        })
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

        <div className="afacad-bold text-8xl text-white text-wrap px-4 py-2 mb-4 rounded-3xl flex items-center">
                {/* old back button */}
            {/* <div className={`p-3 rounded-full bg-gray-800/50  transition aspect-[1/1] flex items-center justified-center mr-5
                ${isBackPressed ? '' : 'hover:bg-gray-800/80'}`}
                onClick={()=>{removeFocusOnBackPress()}}
                onMouseDown={() => setIsBackPressed(true)}
                onMouseUp={() => setIsBackPressed(false)}
            >
                <MdArrowBack />
            </div> */}
            <p className='leading-[85%]'>User Found!</p>
        </div>

        <div className='aspect-[31.5/15] w-full  relative rounded-2xl ' 
        
        >
            
            <img src="https://enka.network/ui/UI_NameCardPic_Shougun_P.png" className='w-full absolute -z-10 rounded-2xl' />
            <div className="absolute aspect-[31.5/17] w-full bg-gray-800/50 rounded-2xl backdrop-blur-[3px]">

                <div className="absolute text-white px-1 -rotate-90 mt-10 flex libre-baskerville-regular backdrop-blur-xs rounded-4xl z-10">
                    TL: {focusedUserDetails?.level}
                </div>
                
                <div className="border-2 border-dashed w-[95%] absolute ml-[5%] rounded-2xl h-full border-white/42 z-0 flex flex-col justify-between relative">

                    <div className=" absolute flex flex-col  items-center 
                    justify-center libre-baskerville-regular right-0 top-1/4  -mr-[2px]">

                        <div className="flex items-center justify-center bg-black/15 text-white backdrop-blur-sm py-3 px-2 mb-3
                        rounded-l-full hover:bg-white hover:text-black hover:border-black/42 transition
                        border-l-2 border-t-2 border-b-2 border-dashed border-white/42 "
                            onClick={()=>{removeFocusOnBackPress()}}
                        >
                            <IoMdClose />
                        </div>

                        <div className="flex items-center justify-center bg-black/15 text-white backdrop-blur-sm py-3 px-2 
                        rounded-l-full hover:bg-white hover:text-black hover:border-black/42 transition
                        border-l-2 border-t-2 border-b-2 border-dashed border-white/42 "
                            onClick={()=>{navigate(`/dashboard/${uid}`)}}
                        >
                            <IoIosArrowForward />
                        </div>
                        
                    </div>

                    <div className="cardbody flex flex-col w-full ">
                        <div className="flex nameandpfpbox ml-7 mr-5 mt-5 items-center ">
                            <img src={profileImageGetter(focusedUserDetails?.headIcon)} className='h-full aspect-square bg-black/12 rounded-full 
                                
                            ' />
                            <div className="flex flex-col overflow-hidden text-ellipsis">
                                <p className="libre-baskerville-bold text-white text-[300%]
                                ml-4 overflow-hidden text-ellipsis">{focusedUserDetails?.nickname}</p>
                                <p className="libre-baskerville-regular text-gray-400 text-[80%] -mt-2
                                ml-4 overflow-hidden text-ellipsis">{focusedUserDetails?.signature}</p>
                            </div>
                        </div>

                        <div className="flex flex-col ml-10 mt-5"
                        // 
                        >

                            <div className="flex">
                                <div className={`${regionColourPicker(focusedUserDetails?.region)} afacad-bold text-black px-2 text-center rounded-sm flex justify-center items-center mr-4`}>
                                    {focusedUserDetails?.region}
                                </div>

                                <div className="bg-[#93590D] afacad-bold text-white px-2 text-center rounded-sm flex justify-center items-center mr-4">
                                    <img src={ach} className='w-[24px] h-[24px]' />
                                    {focusedUserDetails?.achievementCount}
                                </div>
                            </div>

                        </div>
                    </div>


                    <div className="flex timeoutbox text-gray-400 afacad-semi-bold ml-4 mb-1.5 justify-between">
                        <div className="flex">
                            Last Updated: {(timeout+60 < 60)? <>
                                {timeout + 60} seconds ago
                            </>:
                            <>
                                {(timeout+60 < 3600 )? <>
                                    {Math.floor((timeout+60)/60)} minute(s) ago
                                </>: <>
                                    {Math.floor((timeout+60)/3600)} hour(s) ago
                                </>}
                            </>}
                        </div>

                        {(isRefreshPossible && isRefreshButtonActive)?
                            <div className={` ${(isPressed)?'bg-black/80 text-white':'bg-white text-black/70'} transition px-2 rounded-4xl mr-2 flex items-center justify-center  `}
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