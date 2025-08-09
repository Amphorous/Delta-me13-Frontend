import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Hidden from './hover bar components/Hidden';
import Unhidden from './hover bar components/Unhidden';
import SignInHandle from './hover bar components/SignInHandle';
import BreadCrumb from './breadcrumbs/BreadCrumb';
import { Link } from 'react-router-dom';

function Header() {
  const [hovered, setHovered] = useState(false);
  const testRef = useRef(null);
  const [testWidth, setTestWidth] = useState(0);
  const [authStatus, setAuthStatus] = useState({
    authenticated: false,
    username: '',
    discordData: null, // Full Discord user object
  });

  useLayoutEffect(() => {
    if (testRef.current) {
      const width = hovered ? testRef.current.offsetWidth : 0;
      setTestWidth(width);
    }
  }, [hovered]);

  // Auth check on page load
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
  try {
    const response = await fetch('http://localhost:8080/api/auth/status', {
      credentials: 'include',
    });
    const data = await response.json();

    console.log('Full Discord user object:', data);

    if (data.authenticated) {
      setAuthStatus({
        authenticated: true,
        username: data.username || '',
        discordData: data,
      });
    } else {
      setAuthStatus({
        authenticated: false,
        username: '',
        discordData: null,
      });
    }
  } catch (error) {
    console.error('Error checking auth:', error);
    setAuthStatus({ authenticated: false, username: '', discordData: null });
  }
}

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  function logout() {
    const csrfToken = getCookie('XSRF-TOKEN');

    fetch('http://localhost:8080/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-XSRF-TOKEN': csrfToken,
      },
    })
      .then((res) => {
        console.log('Logout response status:', res.status);
        if (!res.ok) {
          throw new Error('Logout failed');
        }
        return res.text();
      })
      .then((text) => {
        console.log('Logout response body:', text);
        window.location.href = 'http://localhost:5173/home';
      })
      .catch((err) => console.error('Logout failed:', err));
  }

  return (
    <div className="min-w-screen flex flex-col max-h-[12vh]">
      <div className="bg-gradient-to-b from-black to-transparent text-white h-[10vh] flex justify-between">
        <div className="flex items-center">
          <Link to="/home">
            <div className="afacad-bold text-7xl pl-9">
              Re<span className="text-violet-500">:</span>muria
            </div>
          </Link>

          <BreadCrumb />
        </div>

        <div className="afacad-bold text-5xl pl-9 pt-5 flex items-center space-x-4">
          {authStatus.authenticated ? (
            <>
              <span
                onClick={() => {
                  console.log('Discord user object:', authStatus.discordData);
                }}
              >
                Logged in as: {authStatus.username}
              </span>
              <button
                className="border px-3 py-1 rounded cursor-pointer hover:bg-gray-700 transition"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <a
              href="http://localhost:8080/oauth2/authorization/discord"
              className="text-blue-500 hover:underline cursor-pointer"
            >
              Login with Discord
            </a>
          )}
        </div>

        <div className="flex mr-6.5">
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="self-center border border-[#B2B2B2]/40 bg-gray-800/40 backdrop-blur-md rounded-full overflow-hidden py-2 px-4 ml-3 flex items-center min-h-[3rem] afacad-light"
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
                    <Hidden />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="flex">
              <Unhidden hovered={hovered} />
            </div>

            {/* Hidden measurement div - don't remove */}
            <div className="absolute invisible pointer-events-none h-0 overflow-hidden">
              <div ref={testRef} className="flex">
                <Hidden />
              </div>
            </div>
          </div>

          <SignInHandle />
        </div>
      </div>
    </div>
  );
}

export default Header;
