import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { removeFocus, setFocus } from '../../../store/userCardSlice';
import { usePfpUrl, handlePfpImgError } from '../../../utils/pfps';
import ach from '../../../assets/achievementIcon.webp';
import { cardBackgroundImages } from '../../../assets/backgroundImages';
import { selectCardBackgroundImageKey } from '../../../store/settingsSlice';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { addOrReplaceUser } from '../../../store/localUsersSlice';
import { useNavigate } from 'react-router';
import { IoMdClose } from "react-icons/io";
import { ImEyeBlocked } from "react-icons/im";
import { useCutouts } from '../../CutoutUtil';
import ExpandableRefreshButton from '../../ExpandableRefreshButton';
import RefreshWarningBanner from '../../RefreshWarningBanner';

const TL_CUTOUT_PADDING = 4;

//showButtons is for enable/disabling the close & go to dashboard buttons
function UserCard({uid, showButtons}) {

    const navigate = useNavigate();

    // useEffect(()=>{console.log(cardState)}, [])

    //dont forget to add removeFocus
    const localUsers = useSelector( state => state.localUsers );
    const focusedUser = useSelector( state => state.focusedUser );
    const cardBgKey = useSelector(selectCardBackgroundImageKey);
    const cardBgUrl = (cardBackgroundImages.find(b => b.key === cardBgKey) ?? cardBackgroundImages[0])?.url;

    const [copyStatus, setCopyStatus] = useState("");

    const [isRefreshPossible, setIsRefreshPossible] = useState(true);
    const [isRefreshButtonActive, setIsRefreshButtonActive] = useState(true);
    // { type: 'warning' | 'error', text } — refresh partial-success/failure banner
    const [refreshWarning, setRefreshWarning] = useState(null);

    const tlRef = useRef(null);
    const borderRef = useRef(null);
    const cardRef = useRef(null);

    const rawRotateX = useMotionValue(0);
    const rawRotateY = useMotionValue(0);
    const rotateX = useSpring(rawRotateX, { stiffness: 220, damping: 28 });
    const rotateY = useSpring(rawRotateY, { stiffness: 220, damping: 28 });

    function handleMouseMove(e) {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        rawRotateY.set(dx * 7);
        rawRotateX.set(-dy * 4);
    }

    function handleMouseLeave() {
        rawRotateX.set(0);
        rawRotateY.set(0);
    }

    const borderMaskStyle = useCutouts(borderRef, [
        { ref: tlRef, type: 'rect', padding: TL_CUTOUT_PADDING },
    ], [focusedUser]);

    //timeout < 0 => dont allow refresh
    const [timeout, setTimeoutValue] = useState(0);
    const dispatch = useDispatch();

    useEffect(()=>{
            let focusedUserFromLS = localUsers.find( u => u.uid === uid )
            //console.log("focuseduserfromls: ", focusedUserFromLS)
            if(focusedUserFromLS === undefined){
                axios.get(`${import.meta.env.VITE_CELESTIA_API_URL}/user/dashboard/noRefresh/${uid}`)
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
                            //console.log("umm what: ",err)
                            setIsRefreshButtonActive(true);
                        })
            } else {
                dispatch(setFocus(focusedUserFromLS));
            }
            
    }, [localUsers, uid])

    useEffect(()=>{
        axios.get(`${import.meta.env.VITE_CELESTIA_API_URL}/user/timeout/${uid}`)
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
        //console.log("focused user read in usercard as: ", focusedUser);
    }, [focusedUser])

    function removeFocusOnBackPress(){
        dispatch(removeFocus());
    }

    // headIcon -> URL now resolves via the backend's Redis-served pfps map
    // (fetch-once, module-cached in utils/pfps) instead of a bundled JSON that
    // went stale on every game version update.
    const pfpUrl = usePfpUrl(focusedUser?.headIcon);

    function regionColourPicker(region){
        switch(region){
            case "MHY": return 'bg-white';
            case "ASIA": return 'bg-[#FDF628]';
            case "CN": return 'bg-[#FD4428]';
            case "NA": return 'bg-[#FDA828]';
            case "EU": return 'bg-[#285AFD]';
            case "THM": return 'bg-[#2feb25]';
        }
        return 'bg-[var(--accent-solid)]';
    }

    function upsertUserRequest(uid){
        setIsRefreshButtonActive(false);
        setRefreshWarning(null);
        setTimeoutValue(-60);
        if(isRefreshPossible){
            axios.get(`${import.meta.env.VITE_CELESTIA_API_URL}/user/dashboard/refresh/${uid}`)
                .then((res) => {
                    // res.data used to be a bare boolean; it's now an
                    // UpsertResultDTO object — accept both shapes so a mixed
                    // deploy (old backend, new frontend) still works.
                    if(res.data === true || res.data?.success){

                        // partial success: some characters use game assets the
                        // backend doesn't support yet and were skipped —
                        // surface that, but still treat the refresh as a success.
                        if(res.data?.partial){
                            setRefreshWarning({
                                type: 'warning',
                                text: res.data.warnings?.join(' ')
                                    || 'Some characters use new game assets that are not yet supported; data was partially updated.',
                            });
                        }

                        axios.get(`${import.meta.env.VITE_CELESTIA_API_URL}/user/dashboard/noRefresh/${uid}`)
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
                            //console.log(err)
                            setIsRefreshButtonActive(true);
                        })
                    } else {
                        //console.log("subloading failed in the backend it seems")
                        setIsRefreshButtonActive(true);
                    }
                })
                .catch((err) => {
                    //console.log(err)
                    setRefreshWarning({
                        type: 'error',
                        text: 'Refresh failed. New game content may not be supported yet — try again later.',
                    });
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

        <motion.div
          ref={cardRef}
          className={`aspect-[31.5/15] w-full relative rounded-2xl${showButtons ? ' cursor-pointer' : ''}`}
          style={{ rotateX, rotateY, transformPerspective: 900 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => showButtons && navigate(`/dashboard/${uid}`)}
        >
            <img src={cardBgUrl} className='w-full absolute -z-10 rounded-2xl' />
            <div className="absolute aspect-[31.5/17] w-full bg-gray-800/50 rounded-2xl backdrop-blur-[3px]">

                <div ref={tlRef} className="absolute text-white px-0 vertical-lmao left-[3.2%] top-[16.3%] flex
                 libre-baskerville-regular rounded-4xl z-10">
                    TL: {String(focusedUser?.level ?? "")}
                </div>

                <div ref={borderRef} style={borderMaskStyle} className="border-2 border-dashed w-[95%] ml-[5%] rounded-2xl h-full border-white/42 z-0 flex flex-col justify-between relative">

                    {(showButtons) &&
                    <div className="absolute flex flex-col items-center
                    justify-center libre-baskerville-regular right-0 top-1/4 -mr-px">

                        <div className="flex items-center justify-center bg-black/60 text-white backdrop-blur-sm py-3 px-2
                        rounded-l-xl hover:bg-white hover:text-black transition
                        border-l border-t border-b border-white/20 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); removeFocusOnBackPress(); }}
                        >
                            <IoMdClose size={14}/>
                        </div>

                    </div>}

                    <div className="cardbody flex flex-col w-full ">
                        <div className="flex nameandpfpbox ml-7 mr-5 mt-5 items-center ">
                            <img src={pfpUrl} className='h-full aspect-square bg-black/12 rounded-full'
                                onError={handlePfpImgError}
                            />
                            <div className="flex flex-col overflow-hidden text-ellipsis">
                                <p className="libre-baskerville-bold text-white text-[300%]
                                ml-4 overflow-hidden text-ellipsis whitespace-nowrap">{focusedUser?.nickname}</p>
                                <p className="libre-baskerville-regular text-gray-400 text-[80%] -mt-2
                                ml-4 overflow-hidden text-ellipsis whitespace-nowrap">{focusedUser?.signature}</p>
                            </div>
                        </div>

                        <div className="flex flex-col ml-6 mt-4">

                            <div className="flex flex-wrap gap-1.5">

                                <div className={`${regionColourPicker(focusedUser?.region)} afacad-bold text-black px-2.5 py-0.5
                                text-xs text-center rounded-full flex justify-center items-center`}>
                                    {focusedUser?.region}
                                </div>

                                <div className="bg-amber-900/70 border border-amber-600/30 afacad-bold text-amber-100 px-2.5 py-0.5 text-xs text-center rounded-full flex gap-1 justify-center items-center">
                                    <img src={ach} className='w-[14px] h-[14px]' />
                                    {focusedUser?.achievementCount}
                                </div>

                                <div className={`${(copyStatus === "")?'bg-white/10 border border-white/20':((copyStatus === "Copied")?'bg-green-800/60 border border-green-500/30':'bg-red-800/60 border border-red-500/30')}
                                afacad-bold text-white px-2.5 py-0.5 text-xs text-center rounded-full flex justify-center
                                items-center cursor-copy transition`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(uid)
                                        .then(() => {
                                            setCopyStatus("Copied");
                                            setTimeout(() => { setCopyStatus(""); }, 750);
                                        })
                                        .catch(err => {
                                            setCopyStatus("Failed");
                                            setTimeout(() => { setCopyStatus(""); }, 750);
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
                                    <div className="bg-red-900/60 border border-red-500/30 afacad-bold text-red-200 px-2.5 py-0.5 text-xs text-center rounded-full flex gap-1 justify-center items-center">
                                        <ImEyeBlocked size={12}/>
                                        Builds Private
                                    </div>
                                }

                            </div>

                        </div>
                    </div>


                    <div className="flex timeoutbox text-white/50 afacad-light text-xs ml-4 mb-2 justify-between items-center">
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

                        <div className="mr-2" onClick={(e) => e.stopPropagation()}>
                            <ExpandableRefreshButton
                                onClick={() => upsertUserRequest(uid)}
                                enabled={isRefreshPossible && isRefreshButtonActive}
                                loading={!isRefreshButtonActive}
                                countdown={timeout * -1}
                            />
                        </div>
                    </div>
                </div>

            </div>

            <div className="absolute bottom-0 left-0 vertical-text barcode-font mb-2 text-white/42">{uid}</div>

        </motion.div>

        {/* refresh partial-success / failure banner — outside the tilting
            motion.div so it doesn't ride the 3D hover transform */}
        <div className='empty:hidden [&:not(:empty)]:mt-3'>
            <RefreshWarningBanner warning={refreshWarning} onDismiss={() => setRefreshWarning(null)} />
        </div>

    </div>
  )
}

export default UserCard