import React, { useState } from 'react'
import avatars from '../../../assets/pfps.json'
import { MdDelete } from "react-icons/md";
import { useDispatch, useSelector } from 'react-redux';
import { removeUser } from '../../../store/localUsersSlice';

//last is a bool which says is the item is the last
function UserStrip({user, last, first}) {

    const [isPressed, setIsPressed] = useState(false);
    const [hovered, setHovered] = useState(false);
    // const localUsers = useSelector( state => state.localUsers );
    const dispatch = useDispatch();

      function localStorageUserItemDelete(uid){
        console.log(uid)
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
        if(region === "NONE"){
            return `purple-400`;
        }
    }

  return (
    <div className={`relative flex flex-col h-full max-h-[15%] justify-between ${
        first ? '' : 'mt-[3%]'
      } rounded-xl transition 
      ${isPressed ? 'bg-black/50' : 'hover:bg-gray-400/25'}`}
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

        <div className='flex justify-between h-[90%] mb-[3%] ml-[1%] '>
            
            <div className="flex namesandpicarea items-center max-w-[90%]">
                <div className='h-full picarea aspect-square mt-[2.5%] rounded-full'>
                    <img src={profileImageGetter(user.headIcon)} className='h-full aspect-square bg-black/12 rounded-full ' />
                    
                </div>
                <div className="flex flex-col pl-3 justify-center w-full">
                    <p className="afacad-semi-bold text-white text-[180%]
                    truncate whitespace-nowrap overflow-hidden text-ellipsis  mix-blend-difference">{user.nickname}</p>
                    <p className='afacad-semi-bold text-[#ebebeb] text-[70%] -mt-1 max-w-[75%] 
                    truncate whitespace-nowrap overflow-hidden text-ellipsis  mix-blend-difference'>{user.signature}</p>
                </div>
            </div>

            <div className={`flex regionarea bg-${regionColourPicker(user.region)} w-[10%] justify-self-end items-center text-center 
            vertical-text justify-center mr-1.5 mt-1.5 afacad-semi-bold text-[95%] rounded`}>
                {user.region}
            </div>

        </div>
        
        {!last && <div className=' border-b border-[#B2B2B2]/40 rounded-4xl w-full'></div>}
    </div>
  )
}

export default UserStrip