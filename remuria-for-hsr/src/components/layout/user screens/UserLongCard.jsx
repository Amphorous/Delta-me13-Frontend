import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeFocus, setFocus } from '../../../store/userCardSlice';
import { usePfpUrl, handlePfpImgError } from '../../../utils/pfps';
import ach from '../../../assets/achievementIcon.webp';
import { cardBackgroundImages } from '../../../assets/backgroundImages';
import { selectCardBackgroundImageKey } from '../../../store/settingsSlice';
import { motion } from 'framer-motion';
import { addOrReplaceUser } from '../../../store/localUsersSlice';
import { ImEyeBlocked } from "react-icons/im";
import PillSlidingSelectBar from './dashboard slider/PillSlidingSelectBar';
import { useCutouts } from '../../CutoutUtil';
import ExpandableRefreshButton from '../../ExpandableRefreshButton';
import RefreshWarningBanner from '../../RefreshWarningBanner';

function UserLongCard({ uid, rightDisplaySelector, setRightDisplaySelector, onRefreshComplete }) {

    const localUsers = useSelector(state => state.localUsers);
    const focusedUser = useSelector(state => state.focusedUser);
    const cardBgKey = useSelector(selectCardBackgroundImageKey);
    const cardBgUrl = (cardBackgroundImages.find(b => b.key === cardBgKey) ?? cardBackgroundImages[0])?.url;
    const dispatch = useDispatch();

    const [copyStatus, setCopyStatus] = useState("");
    const [isRefreshPossible, setIsRefreshPossible] = useState(true);
    const [isRefreshButtonActive, setIsRefreshButtonActive] = useState(true);
    const [timeout, setTimeoutValue] = useState(0);
    // { type: 'warning' | 'error', text } — refresh partial-success/failure banner
    const [refreshWarning, setRefreshWarning] = useState(null);

    const cardRef = useRef(null);
    const dividerRef = useRef(null);
    const frameRef = useRef(null);
    const barcodeRef = useRef(null);

    const NOTCH_RADIUS = 5;
    const BARCODE_CUTOUT_PADDING = 4;

    const outerNotchStyle = useCutouts(cardRef, [
        { ref: dividerRef, type: 'notch', radius: NOTCH_RADIUS },
    ], [focusedUser]);

    const frameMaskStyle = useCutouts(frameRef, [
        { ref: dividerRef, type: 'notch', radius: NOTCH_RADIUS, container: cardRef },
        { ref: barcodeRef, type: 'rect', padding: BARCODE_CUTOUT_PADDING },
    ], [focusedUser]);

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
        console.log("Focused User: ", focusedUser);
    }, [focusedUser]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeoutValue((prev) => {
                setIsRefreshPossible(prev >= 0);
                return prev + 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // headIcon -> URL now resolves via the backend's Redis-served pfps map
    // (fetch-once, module-cached in utils/pfps) instead of a bundled JSON that
    // went stale on every game version update.
    const pfpUrl = usePfpUrl(focusedUser?.headIcon);

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
        setRefreshWarning(null);
        setTimeoutValue(-60);
        if (isRefreshPossible) {
            axios.get(`${import.meta.env.VITE_CELESTIA_API_URL}/user/dashboard/refresh/${uid}`)
                .then((res) => {
                    // res.data used to be a bare boolean; it's now an
                    // UpsertResultDTO object — accept both shapes so a mixed
                    // deploy (old backend, new frontend) still works.
                    if (res.data === true || res.data?.success) {
                        // partial success: some characters use game assets the
                        // backend doesn't support yet and were skipped —
                        // surface that, but still treat the refresh as a success.
                        if (res.data?.partial) {
                            setRefreshWarning({
                                type: 'warning',
                                text: res.data.warnings?.join(' ')
                                    || 'Some characters use new game assets that are not yet supported; data was partially updated.',
                            });
                        }
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
                                onRefreshComplete?.();
                            })
                            .catch(() => setIsRefreshButtonActive(true));
                    } else {
                        setIsRefreshButtonActive(true);
                    }
                })
                .catch(() => {
                    setRefreshWarning({
                        type: 'error',
                        text: 'Refresh failed. New game content may not be supported yet — try again later.',
                    });
                    setIsRefreshButtonActive(true);
                });
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
            <div ref={frameRef} style={frameMaskStyle} className="relative z-10 border-2 border-dashed border-white/30 mx-6 my-2 rounded-2xl flex items-center gap-5 px-7 py-5 min-h-[110px]">

                {/* TL level — vertical left edge */}
                <div className="text-white/70 vertical-lmao libre-baskerville-regular text-xs shrink-0 select-none">
                    TL: {String(focusedUser?.level ?? "")}
                </div>

                {/* avatar */}
                <img
                    src={pfpUrl}
                    className="w-14 h-14 rounded-full bg-black/20 shrink-0 ring-1 ring-white/10"
                    onError={handlePfpImgError}
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

                    <ExpandableRefreshButton
                        onClick={() => upsertUserRequest(uid)}
                        enabled={isRefreshPossible && isRefreshButtonActive}
                        loading={!isRefreshButtonActive}
                        countdown={timeout * -1}
                    />
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

            {/* refresh partial-success / failure banner */}
            <div className='relative z-10 mx-6 empty:hidden [&:not(:empty)]:mb-2'>
                <RefreshWarningBanner warning={refreshWarning} onDismiss={() => setRefreshWarning(null)} />
            </div>

            {/* UID barcode — outside dashed border, center-left gap */}
            <div ref={barcodeRef} className="absolute top-1/2 -translate-y-1/2 left-3 vertical-text barcode-font text-white/20 text-sm select-none z-20">
                {uid}
            </div>

        </motion.div>
    );
}

export default UserLongCard;
