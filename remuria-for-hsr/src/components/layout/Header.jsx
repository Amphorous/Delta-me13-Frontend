import React, { useState, useRef, useLayoutEffect } from 'react';
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

  useLayoutEffect(() => {
    if (testRef.current) {
      const width = hovered ? testRef.current.offsetWidth : 0;
      setTestWidth(width);
    }
  }, [hovered]);

  return (
    <div className="min-w-screen flex flex-col max-h-[12vh]">
      <div className="bg-gradient-to-b from-black to-transparent text-white h-[10vh] flex justify-between">
        <div className='flex items-center'>

          <Link to='/home' >
            <div className="afacad-bold text-7xl pl-9">
              Re<span className="text-violet-500">:</span>muria
            </div>
          </Link>
          
          <BreadCrumb />

        </div>

        <div className="flex mr-6.5">
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="self-center  border border-[#B2B2B2]/40 
              bg-gray-800/40 backdrop-blur-md rounded-full overflow-hidden py-2 px-4 ml-3 flex items-center min-h-[3rem] afacad-light"
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

            {/* usually visible */}
            <div className="flex">
              <Unhidden hovered = {hovered}/>
            </div>

            {/* Hidden measurement div dont remove*/}
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
