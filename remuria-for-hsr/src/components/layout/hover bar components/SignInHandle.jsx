import React, { useEffect, useState, useRef } from 'react';
import { LuUserRound } from "react-icons/lu";
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from '../../../store/authSlice';
import { fetchBindings } from '../../../store/bindingsSlice';
import LoginDropdown from './LoginDropdown';

function SignInHandle() {
  const dispatch = useDispatch();
  const authStatus = useSelector(state => state.auth);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  
  const dropdownRef = useRef(null);

  // Auth check on page load
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    if (authStatus?.authenticated) dispatch(fetchBindings());
  }, [authStatus?.authenticated, dispatch]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLoginDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className='self-center relative'
      ref={dropdownRef} 
      onClick={() => setShowLoginDropdown((prev)=>!prev)}
      >
      {authStatus?.authenticated ? (
        <div 

          className='flex items-center justify-center p-1.5 pr-2 mx-2 rounded-full border-[1px]
          border-[var(--accent-muted)] cursor-pointer hover:border-[var(--accent-solid)] transition relative'
          >
          <img src={authStatus?.avatarUrl} alt="" className="rounded-full h-[35px]" />
          <p className="text-white afacad-light ml-1.5">{authStatus?.username}</p>
          
        </div>
      ) : (
        <div 
          
          className='flex items-center justify-center p-2.5 mx-2 rounded-full border-[1px]
            border-[var(--accent-muted)] cursor-pointer hover:border-[var(--accent-solid)] hover:bg-gray-400/20 transition relative'
        >
          <LuUserRound size={24}/>
          <p className="text-white afacad-light ml-1.5">Login</p>
        </div>
      )}

      {showLoginDropdown && <LoginDropdown />}
    </div>
  );
}

export default SignInHandle;
