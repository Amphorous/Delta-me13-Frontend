import axios from 'axios';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeFocus, setFocus } from '../../../store/userCardSlice';
import avatars from '../../../assets/pfps.json';
import ach from '../../../assets/achievementIcon.webp';
import { cardBackgroundImages } from '../../../assets/backgroundImages';
import { selectCardBackgroundImageKey } from '../../../store/settingsSlice';
import { IoMdRefresh } from "react-icons/io";
import { motion, AnimatePresence } from 'framer-motion';
import { addOrReplaceUser } from '../../../store/localUsersSlice';
import { ImEyeBlocked } from "react-icons/im";
import PillSlidingSelectBar from './dashboard slider/PillSlidingSelectBar';

function UserLongCard({ uid, rightDisplaySelector, setRightDisplaySelector }) {

    const localUsers = useSelector(state => state.localUsers);
    const focusedUser = useSelector(state => state.focusedUser);
    const cardBgKey = useSelector(selectCardBackgroundImageKey);
    const cardBgUrl = (cardBackgroundImages.find(b => b.key === cardBgKey) ?? cardBackgroundImages[0])?.url;
    const dispatch = useDispatch();

    const [copyStatus, setCopyStatus] = useState("");
    const [isRefreshPossible, setIsRefreshPossible] = useState(true);
    const [isRefreshButtonActive, setIsRefreshButtonActive] = useState(true);
    const [hovered, setHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [timeout, setTimeoutValue] = useState(0);

    const testRef = useRef(null);
    const [testWidth, setTestWidth] = useState(0);

    const cardRef = useRef(null);
    const dividerRef = useRef(null);
    const [notchX, setNotchX] = useState(null);

    useLayoutEffect(() => {
        if (testRef.current) {
            setTestWidth(testRef.current.offsetWidth);
        }
    }, []);

    // ticket-style notch — punched through the card's top/bottom edges, centered
    // on the vertical divider's x position
    useEffect(() => {
        function updateNotch() {
            if (!cardRef.current || !dividerRef.current) return;
            const cardRect = cardRef.current.getBoundingClientRect();
            const dividerRect = dividerRef.current.getBoundingClientRect();
            setNotchX(dividerRect.left + dividerRect.width / 2 - cardRect.left);
        }

        updateNotch();

        const ro = new ResizeObserver(updateNotch);
        if (cardRef.current) ro.observe(cardRef.current);

        window.addEventListener('resize', updateNotch);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', updateNotch);
        };
    }, [focusedUser]);

    useEffect(() => {
        let focusedUserFromLS = localUsers.find(u => u.uid === uid);
        if (focusedUserFromLS === undefined) {
            axios.get(`${import.meta.env.VITE_CELESTIA_API_URL}/user/dashboard/noRefresh/${uid}`)
                .then((res) => {
                    const userObj = {
                        uid: res.data.uid,
                        nickname: res.data.nickname,
                        signature: res.data.signature,
                        region: res.data.region,
                        headIcon: res.data.headIcon,
                        level: res.data.level,
                        achievementCount: res.data.achievementCount,
                        buildsPublic: res.data.buildsPublic,
                    };
                    dispatch(removeFocus());
                    setIsRefreshButtonActive(true);
                    dispatch(setFocus(userObj));
                })
                .catch(() => setIsRefreshButtonActive(true));
        } else {
            dispatch(setFocus(focusedUserFromLS));
        }
    }, [localUsers, uid]);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_CELESTIA_API_URL}/user/timeout/${uid}`)
            .then((res) => {
                setIsRefreshPossible(res.data >= 0);
                setTimeoutValue(res.data);
            });
    }, [uid]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeoutValue((prev) => {
                setIsRefreshPossible(prev >= 0);
                return prev + 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    function profileImageGetter(headIcon) {
        if (avatars[`${headIcon}`] !== undefined) {
            return "https://enka.network" + avatars[`${headIcon}`]['Icon'];
        }
        return "https://enka.network/ui/hsr/SpriteOutput/AvatarRoundIcon/UI_Message_Contacts_Anonymous.png";
    }

    function regionColourPicker(region) {
        switch (region) {
            case "MHY": return 'bg-white';
            case "ASIA": return 'bg-[#FDF628]';
            case "CN": return 'bg-[#FD4428]';
            case "NA": return 'bg-[#FDA828]';
            case "EU": return 'bg-[#285AFD]';
            case "THM": return 'bg-[#2feb25]';
        }
        return 'bg-[var(--accent-solid)]';
    }

    function upsertUserRequest(uid) {
        setIsRefreshButtonActive(false);
        setTimeoutValue(-60);
        if (isRefreshPossible) {
            axios.get(`${import.meta.env.VITE_CELESTIA_API_URL}/user/dashboard/refresh/${uid}`)
                .then((res) => {
                    if (res.data) {
                        axios.get(`${import.meta.env.VITE_CELESTIA_API_URL}/user/dashboard/noRefresh/${uid}`)
                            .then((res) => {
                                const userObj = {
                                    uid: res.data.uid,
                                    nickname: res.data.nickname,
                                    signature: res.data.signature,
                                    region: res.data.region,
                                    headIcon: res.data.headIcon,
                                    level: res.data.level,
                                    achievementCount: res.data.achievementCount,
                                    buildsPublic: res.data.buildsPublic,
                                };
                                dispatch(addOrReplaceUser(userObj));
                                dispatch(setFocus(userObj));
                                setIsRefreshButtonActive(true);
                            })
                            .catch(() => setIsRefreshButtonActive(true));
                    }
                })
                .catch(() => setIsRefreshButtonActive(true));
        } else {
            setIsRefreshButtonActive(true);
        }
    }

    function lastUpdatedText() {
        const secs = timeout + 60;
        if (secs < 60) return `${secs}s ago`;
        if (secs < 3600) return `${Math.floor(secs / 60)}m ${Math.floor(secs % 60)}s ago`;
        return `${Math.floor(secs / 3600)}h ago`;
    }

    const NOTCH_RADIUS = 5;
    function buildNotchStyle(x, topY, bottomY) {
        if (x === null) return undefined;
        const maskImage = `radial-gradient(circle ${NOTCH_RADIUS}px at ${x}px ${topY}, transparent 99%, #000 100%), radial-gradient(circle ${NOTCH_RADIUS}px at ${x}px ${bottomY}, transparent 99%, #000 100%)`;
        return {
            WebkitMaskImage: maskImage,
            maskImage,
            WebkitMaskComposite: 'source-over, source-in',
            maskComposite: 'intersect',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
        };
    }

    // outer layers (bg image, overlay) share the card's own box — origin (0,0) at its top-left
    const outerNotchStyle = buildNotchStyle(notchX, '0%', '100%');
    // inner dashed frame is inset by mx-6 my-2 (24px / 8px), so shift the centers to match
    const innerNotchStyle = notchX !== null ? buildNotchStyle(notchX - 24, '-8px', 'calc(100% + 8px)') : undefined;

    return (
        <motion.div
            ref={cardRef}
            className="w-full relative rounded-2xl overflow-hidden"
            style={outerNotchStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
        >
            {/* background image */}
            <img src={cardBgUrl} style={outerNotchStyle} className="absolute inset-0 w-full h-full object-cover object-center -z-10 rounded-2xl" />
            <div style={outerNotchStyle} className="absolute inset-0 bg-gray-800/55 backdrop-blur-[3px] rounded-2xl" />

            {/* inner frame — dashed border matching UserCard identity */}
            <div style={innerNotchStyle} className="relative z-10 border-2 border-dashed border-white/30 mx-6 my-2 rounded-2xl flex items-center gap-5 px-7 py-5 min-h-[110px]">

                {/* TL level — vertical left edge */}
                <div className="text-white/70 vertical-lmao libre-baskerville-regular text-xs shrink-0 select-none">
                    TL: {String(focusedUser?.level ?? "")}
                </div>

                {/* avatar */}
                <img
                    src={profileImageGetter(focusedUser?.headIcon)}
                    className="w-14 h-14 rounded-full bg-black/20 shrink-0 ring-1 ring-white/10"
                    onError={(e) => {
                        const anon = "https://enka.network/ui/hsr/SpriteOutput/AvatarRoundIcon/UI_Message_Contacts_Anonymous.png";
                        if (e.target.src.includes("/Series/")) {
                            e.target.src = e.target.src.replace("/Series/", "/");
                        } else if (e.target.src !== anon) {
                            e.target.src = anon;
                        }
                    }}
                />

                {/* name / sig / badges */}
                <div className="flex flex-col min-w-0 flex-1">
                    <p className="libre-baskerville-bold text-white truncate leading-tight"
                        style={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.75rem)' }}>
                        {focusedUser?.nickname}
                    </p>
                    <p className="libre-baskerville-regular text-gray-400 text-sm truncate mt-0.5">
                        {focusedUser?.signature}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">

                        <div className={`${regionColourPicker(focusedUser?.region)} afacad-bold text-black px-2.5 py-0.5 text-xs rounded-full`}>
                            {focusedUser?.region}
                        </div>

                        <div className="bg-amber-900/70 border border-amber-600/30 afacad-bold text-amber-100 px-2.5 py-0.5 text-xs rounded-full flex gap-1 items-center">
                            <img src={ach} className="w-3.5 h-3.5" />
                            {focusedUser?.achievementCount}
                        </div>

                        <div
                            className={`${copyStatus === "" ? 'bg-white/10 border border-white/20' : copyStatus === "Copied" ? 'bg-green-800/60 border border-green-500/30' : 'bg-red-800/60 border border-red-500/30'} afacad-bold text-white px-2.5 py-0.5 text-xs rounded-full cursor-copy transition`}
                            onClick={() => {
                                navigator.clipboard.writeText(uid)
                                    .then(() => { setCopyStatus("Copied"); setTimeout(() => setCopyStatus(""), 750); })
                                    .catch(() => { setCopyStatus("Failed"); setTimeout(() => setCopyStatus(""), 750); });
                            }}
                        >
                            {copyStatus === "" ? <>UID: {uid}</> : copyStatus === "Copied" ? <>Copied!</> : <>Copy Failed</>}
                        </div>

                        {!focusedUser?.buildsPublic && (
                            <div className="bg-red-900/60 border border-red-500/30 afacad-bold text-red-200 px-2.5 py-0.5 text-xs rounded-full flex gap-1 items-center">
                                <ImEyeBlocked size={12} />
                                Builds Private
                            </div>
                        )}

                    </div>
                </div>

                <div className='shrink-0 flex justify-center'>
                    <PillSlidingSelectBar uid={uid} rightDisplaySelector={rightDisplaySelector} setRightDisplaySelector={setRightDisplaySelector}/>
                </div>

                {/* thin divider */}
                <div className="self-stretch w-px bg-white/10 shrink-0 " />

                {/* last updated + refresh — centered column */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                    <p className="text-white/35 afacad-light text-xs text-center whitespace-nowrap">
                        {lastUpdatedText()}
                    </p>

                    {(isRefreshPossible && isRefreshButtonActive) ? (
                        <motion.div
                            className={`flex items-center justify-center gap-1 overflow-hidden rounded-full cursor-pointer text-xs afacad-light py-0.5 ${isPressed ? 'bg-black/80 text-white' : 'bg-white/10 border border-white/20 text-white/60 hover:bg-white hover:text-black/80'} transition-colors`}
                            animate={{ width: hovered ? testWidth : 26 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            onMouseEnter={() => setHovered(true)}
                            onMouseLeave={() => { setIsPressed(false); setHovered(false); }}
                            onMouseDown={() => setIsPressed(true)}
                            onMouseUp={() => setIsPressed(false)}
                            onClick={() => upsertUserRequest(uid)}
                        >
                            <AnimatePresence initial={false}>
                                {hovered && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="whitespace-nowrap"
                                    >
                                        Refresh
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            <IoMdRefresh />
                        </motion.div>
                    ) : (
                        <div className="px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-white/5 border border-white/10 text-white/25 text-xs cursor-not-allowed afacad-light">
                            {timeout * -1}s <IoMdRefresh />
                        </div>
                    )}

                    {/* hidden measurement div — measures full expanded button (text + icon + gap + padding) */}
                    <div className="absolute invisible pointer-events-none h-0 overflow-hidden afacad-light">
                        <div ref={testRef} className="flex items-center justify-center gap-1 px-2.5 py-0.5">
                            <span>Refresh</span>
                            <IoMdRefresh />
                        </div>
                    </div>
                </div>

                {/* divider before title */}
                <div ref={dividerRef} className="self-stretch w-px bg-white/10 shrink-0" />

                {/* "User Dashboard" title — right */}
                <div className="flex flex-col items-end shrink-0 select-none pl-1">
                    <p className="afacad-light text-white/25 tracking-[0.45em] uppercase text-xs">
                        User
                    </p>
                    <p className="libre-baskerville-bold text-white leading-none"
                        style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)' }}>
                        Dashboard
                    </p>
                </div>

            </div>

            {/* UID barcode — outside dashed border, bottom-left gap */}
            <div className="absolute bottom-2 left-3 vertical-text barcode-font text-white/20 text-sm select-none z-20">
                {uid}
            </div>

        </motion.div>
    );
}

export default UserLongCard;
