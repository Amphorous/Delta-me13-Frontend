import React from 'react';
import { MdLeaderboard } from "react-icons/md";

function Leaderboards() {
    return (
        <div className='w-full h-full flex items-center justify-center p-6'>
            <div className='bg-gray-900/75 backdrop-blur-md border border-white/20 rounded-2xl px-10 py-8 flex flex-col items-center text-center max-w-md'>
                <MdLeaderboard size={48} className='text-[var(--accent-muted)] mb-3' />
                <div className='afacad-bold text-white text-xl mb-1'>Leaderboards</div>
                <p className='afacad-light text-white/50 text-sm'>
                    Coming soon.
                </p>
            </div>
        </div>
    );
}

export default Leaderboards;
