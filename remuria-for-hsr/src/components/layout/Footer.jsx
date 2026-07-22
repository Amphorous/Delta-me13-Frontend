import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { Link } from 'react-router-dom';

function Footer() {

  const [expanded, setExpanded] = useState(false)

  return (
    <div className='w-full relative flex items-center justify-center'>

        <div className={` rounded-full  p-1 m-1 invisible`}>
          <MdOutlineKeyboardArrowDown size={24}/>
        </div>
      <motion.div
        className={`absolute w-full bg-black/3 backdrop-blur-md bottom-0 flex flex-col items-center transition ${(expanded)?'bg-black/70':''}`}
        initial={ false }
        animate={{ height: expanded ? "25vh" : "100%" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <div className='top-0 w-full flex items-center justify-between px-4 py-1'>

          {/* left — brand text */}
          <p className='afacad-light text-[var(--accent-dim)] text-xs select-none flex items-center gap-2'>
            <span>Re<span className='text-[var(--accent-colon)]'>:</span>muria - Honkai: Star Rail</span>
            <span className='opacity-50'>•</span>
            <Link to='/legal-notice' className='hover:text-white transition cursor-pointer'>Privacy Policy</Link>
          </p>

          {/* centre — expand toggle */}
          <div className={`flex afacad-light items-center justify-center
           hover:bg-gray-400/40 rounded-full text-white px-2 py-1 cursor-pointer`}
          onClick={()=>{setExpanded((prev)=>{return !prev})}}
          >
            Footer
            <div className={`transition ${(expanded)?'rotate-180 ':''}`}>
              <MdOutlineKeyboardArrowDown size={24}/>
            </div>
          </div>

          {/* right — status text */}
          <p className='afacad-light text-[var(--accent-dim)] text-xs select-none'>
            Under construction
          </p>

        </div>

        <motion.div
        initial = {{ opacity: 0, height: 0 }}
        animate = {{ opacity: expanded?1:0, height: expanded?100:0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="flex-1 w-[98%] mb-2 flex items-center justify-center afacad-bold text-[#cb493e]/80 text-[550%]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            rgba(203, 73, 62, 0.15) 0px,
            rgba(23, 73, 62, 0.15) 3px,
            transparent 3px,
            transparent 6px
          )`
        }}>
          {(expanded) && <>
            Work In Progress
          </>}
        </motion.div>

      </motion.div>

    </div>
  )
}

export default Footer
