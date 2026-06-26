import React, { useEffect, useState } from 'react'
import avatars from '../../../assets/pfps.json'
import { MdDelete } from "react-icons/md";
import { useDispatch, useSelector } from 'react-redux';
import { removeUser } from '../../../store/localUsersSlice';
import { removeFocus, setFocus } from '../../../store/userCardSlice';
import { motion } from 'framer-motion';


//last is a bool which says is the item is the last
function UserStrip({user, setCardState}) {

    const [isPressed, setIsPressed] = useState(false);
    const [hovered, setHovered] = useState(false);
    //const focusedUser = useSelector( state => state.focusedUser )
    // useEffect(()=>{console.log("Focused UID change detected: " + focusedUser)}, [focusedUser])
    const dispatch = useDispatch();

    function loadUserCard(){
        //console.log(uid)
        dispatch(setFocus(user))
    }

    function localStorageUserItemDelete(uid){
        //console.log(uid)
        //setCardState(0);
        dispatch(removeFocus());
        dispatch(removeUser(uid));
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
        return 'bg-[var(--accent-solid)]';
    }

  return (
    <div className={`relative flex items-center justify-between my-0.5 rounded-xl transition-all duration-150 py-2 px-2 cursor-pointer
      ${isPressed ? 'bg-black/50 scale-[0.98]' : hovered ? 'bg-gray-400/20 scale-[1.01]' : 'scale-100'}`}
      onClick={() => loadUserCard()}
      onMouseEnter={() => setHovered(true)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false);
        setHovered(false);
      }}
    >
        {hovered &&
            <div className="absolute left-1 top-1/2 -translate-y-1/2 bg-red-600/50 hover:bg-red-600 transition w-6 h-6
            rounded-full text-white/60 hover:text-white flex items-center justify-center z-10"
                onClick={(e) => { e.stopPropagation(); localStorageUserItemDelete(user.uid); }}
            >
                <MdDelete size={13}/>
            </div>
        }

        <div className={`flex items-center min-w-0 flex-1 transition-all duration-150 ${hovered ? 'pl-7' : 'pl-0'}`}>
            <img src={profileImageGetter(user.headIcon)} className='w-9 h-9 aspect-square bg-black/20 rounded-full shrink-0'
                onError={(e) => {
                    const anon = "https://enka.network/ui/hsr/SpriteOutput/AvatarRoundIcon/UI_Message_Contacts_Anonymous.png";
                    if (e.target.src.includes("/Series/")) {
                        e.target.src = e.target.src.replace("/Series/", "/");
                    } else if (e.target.src !== anon) {
                        e.target.src = anon;
                    }
                }}
            />
            <div className="flex flex-col pl-2.5 justify-center min-w-0">
                <p className="afacad-semi-bold text-white text-base leading-tight
                truncate whitespace-nowrap overflow-hidden">{user.nickname}</p>
                <p className='afacad-light text-white/50 text-xs truncate whitespace-nowrap overflow-hidden'>{user.signature}</p>
            </div>
        </div>

        <div className={`shrink-0 ${regionColourPicker(user.region)} text-black
        px-1.5 py-0.5 ml-2 afacad-bold text-[10px] rounded-full`}>
            {user.region}
        </div>

    </div>
  )
}

export default UserStrip