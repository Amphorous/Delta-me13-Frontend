import React, { useState } from 'react'
import { FaDice } from "react-icons/fa";
import { FaCircleNotch } from "react-icons/fa";

function RandomUserStrip({ onClick, loading }) {

    const [isPressed, setIsPressed] = useState(false);
    const [hovered, setHovered] = useState(false);

    return (
        <div className={`relative flex items-center justify-center gap-2 my-0.5 rounded-xl border border-dashed border-white/25
        transition-all duration-150 py-2 px-2 ${loading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        ${isPressed ? 'bg-black/50 scale-[0.98]' : hovered ? 'bg-gray-400/20 scale-[1.01]' : 'scale-100'}`}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => {
                setIsPressed(false);
                setHovered(false);
            }}
        >
            {loading ?
                <div className='animate-spin text-white/60'><FaCircleNotch /></div> :
                <FaDice className='text-white/60' />
            }
            <p className="afacad-semi-bold text-white/60 text-sm">Find Random User</p>
        </div>
    )
}

export default RandomUserStrip
