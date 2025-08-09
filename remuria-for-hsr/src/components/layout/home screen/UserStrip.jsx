import React, { useEffect, useState } from 'react'
import avatars from '../../../assets/pfps.json'
import { MdDelete } from "react-icons/md";
import { useDispatch, useSelector } from 'react-redux';
import { removeUser } from '../../../store/localUsersSlice';
import { removeFocus, setFocus } from '../../../store/userCardSlice';



//last is a bool which says is the item is the last
function UserStrip({user, last, first}) {

    const [isPressed, setIsPressed] = useState(false);
    const [hovered, setHovered] = useState(false);
    //const focusedUser = useSelector( state => state.focusedUser )
    // useEffect(()=>{console.log("Focused UID change detected: " + focusedUser)}, [focusedUser])
    const dispatch = useDispatch();

    function loadUserCard(uid){
        //console.log(uid)
        dispatch(setFocus(uid))
    }

    function localStorageUserItemDelete(uid){
        console.log(uid)
        dispatch(removeFocus())
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
        return `bg-purple-400`
    }

  return (
    <div className={`relative flex flex-col justify-between my-1 rounded-xl transition py-2 px-2 
      ${isPressed ? 'bg-black/50' : 'hover:bg-gray-400/25'}`}
      onClick={() => loadUserCard(user.uid)}
      onMouseEnter={() => setHovered(true)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false);
        setHovered(false);
      }}
    >

        {
            (hovered) && 
            <div className="aspect-square bg-red-600/50 hover:bg-red-600 transition h-[25%] 
            absolute rounded-full text-white/50 hover:text-white flex items-center justify-center"
                onClick={()=>{localStorageUserItemDelete(user.uid)}}
            >
                <MdDelete />
            </div>
        }

        <div className='flex justify-between  items-center'>
            
            <div className="flex namesandpicarea items-center w-[90%] max-w-[90%]">
                <div className='h-full picarea aspect-square rounded-full items-center'>
                <img src={profileImageGetter(user.headIcon)} className='aspect-square bg-black/12 rounded-full ' />
                    
                </div>
                <div className="flex flex-col pl-3 justify-center w-full">
                    <p className="afacad-semi-bold text-white text-[180%]
                    truncate whitespace-nowrap overflow-hidden text-ellipsis  mix-blend-difference">{user.nickname}</p>
                    <p className='afacad-semi-bold text-[#ebebeb] text-[70%] -mt-1 max-w-[75%] 
                    truncate whitespace-nowrap overflow-hidden text-ellipsis  mix-blend-difference'>{user.signature}</p>
                </div>
            </div>

            <div className={`flex regionarea ${regionColourPicker(user.region)} items-center text-center 
            vertical-text justify-center px-3 mr-1.5 afacad-semi-bold text-[95%] rounded`} >
                {user.region}
            </div>

        </div>
        
        
    </div>
  )
}

export default UserStrip