import React, { useEffect } from 'react'
import { LuUserRound } from "react-icons/lu";
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth, logout } from '../../../store/authSlice';
import { FaDiscord } from "react-icons/fa";
import { CgLogOut } from "react-icons/cg";

function LoginDropdown() {

    const dispatch = useDispatch();
    const authStatus = useSelector( state => state.auth )


  return (
    <div className="absolute border border-[#B2B2B2]/40 bg-gray-800/40 backdrop-blur-md rounded-xl vmt-[170%] top-[115%] p-3 w-[270%] right-0">
        {(authStatus?.authenticated)?
            <div className='flex flex-col'>
                <p className='afacad-light italic text-gray-400/60'>Logged in as: {authStatus?.username} (via {authStatus?.platform})</p>
                <div className="text-white afacad-bold self-center mt-1 rounded-xl py-1 px-3 flex items-center gap-2 hover:bg-[#dc8585]/20 cursor-pointer text-xl"
                    onClick={() => dispatch(logout())} 
                >
                    <p className='text-red-400 flex gap-2 items-center justify-center'><CgLogOut size={25}/> Logout</p>
                </div>
            </div>:
            <div className='flex flex-col'>
                
                <p className='afacad-light italic text-gray-400/60'>User not logged in.</p>
                <a className="text-white afacad-bold self-center mt-1 rounded-xl py-1 px-3 flex items-center gap-2 hover:bg-gray-600/20 cursor-pointer text-xl"
                    href={`${import.meta.env.VITE_AUTH_API_URL}/oauth2/authorization/discord`}
                >
                    <span className='text-blue-500'><FaDiscord /></span>
                    <p>Login with <span className='text-blue-500'>Discord</span></p>
                </a>

            </div>
        }
    </div>
  )
}

export default LoginDropdown