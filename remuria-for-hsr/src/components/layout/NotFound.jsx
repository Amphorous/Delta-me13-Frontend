import React from 'react';
import { useNavigate } from 'react-router';

function NotFound() {
    const navigate = useNavigate();

    return (
        <div className='w-full h-full flex items-center justify-center p-6'>
            <div className='bg-gray-900/75 backdrop-blur-md border border-white/20 rounded-2xl px-10 py-8 flex flex-col items-center text-center max-w-md'>
                <div className='libre-baskerville-bold text-[var(--accent-muted)] text-6xl mb-2'>404</div>
                <div className='afacad-bold text-white text-xl mb-1'>Page not found</div>
                <p className='afacad-light text-white/50 text-sm mb-6'>
                    The page you're looking for doesn't exist or may have been moved.
                </p>
                <button
                    onClick={() => navigate('/home')}
                    className='afacad-bold text-sm px-5 py-2.5 rounded-full bg-[var(--accent-solid)] text-[var(--accent-text)] hover:opacity-90 transition active:scale-95'
                >
                    Go to home page
                </button>
            </div>
        </div>
    );
}

export default NotFound;
