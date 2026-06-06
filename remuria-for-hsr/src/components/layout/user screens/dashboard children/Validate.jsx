import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router';
import { FaDiscord } from 'react-icons/fa';
import { IoMdRefresh } from 'react-icons/io';
import { MdVerified } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { fetchBindings } from '../../../../store/bindingsSlice';

const GAME = 'hsr';
const VERIFY_COOLDOWN = 30;

function Validate() {
  const dispatch = useDispatch();
  const authStatus = useSelector(state => state.auth);
  const bindings = useSelector(state => state.bindings);
  const { uid } = useParams();

  const [code, setCode] = useState(null);
  const [step, setStep] = useState('input'); // 'input' | 'code' | 'verified'
  const [verifyError, setVerifyError] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyTimeout, setVerifyTimeout] = useState(0);
  const [isVerifyButtonActive, setIsVerifyButtonActive] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const testRef = useRef(null);
  const [testWidth, setTestWidth] = useState(0);

  const isVerifyPossible = verifyTimeout >= 0;
  const hsrUids = Array.isArray(bindings?.hsr) ? bindings.hsr : [];
  const isAlreadyValidated = hsrUids.includes(uid);

  useLayoutEffect(() => {
    if (testRef.current) setTestWidth(testRef.current.offsetWidth);
  }, []);

  useEffect(() => {
    if (step !== 'code') return;
    const interval = setInterval(() => {
      setVerifyTimeout(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  async function handleGenerate() {
    setIsGenerating(true);
    setVerifyError(false);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_AUTH_API_URL}/api/binding-code/generate`,
        { params: { game: GAME, uid }, withCredentials: true }
      );
      setCode(String(res.data));
      setVerifyTimeout(-VERIFY_COOLDOWN);
      setStep('code');
    } catch (e) {
      console.error('Generate failed:', e);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleVerify() {
    if (!isVerifyPossible || !isVerifyButtonActive) return;
    setIsVerifyButtonActive(false);
    setVerifyTimeout(-VERIFY_COOLDOWN);
    setIsVerifying(true);
    setVerifyError(false);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_AUTH_API_URL}/api/binding-code/verify`,
        { params: { game: GAME, uid }, withCredentials: true }
      );
      if (res.data === true) {
        setStep('verified');
        dispatch(fetchBindings());
      } else {
        setVerifyError(true);
      }
    } catch (e) {
      console.error('Verify failed:', e);
      setVerifyError(true);
    } finally {
      setIsVerifying(false);
      setIsVerifyButtonActive(true);
    }
  }

  if (!authStatus?.authenticated) {
    return (
      <div className="w-full h-full overflow-y-auto px-4 py-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-gray-900/75 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex items-center justify-between gap-4">
            <div>
              <p className="libre-baskerville-bold text-white text-lg">Account Verification</p>
              <p className="afacad-light text-gray-200 text-sm mt-0.5">
                Log in with Discord to link your HSR UID to your account.
              </p>
            </div>
            <a
              href={`${import.meta.env.VITE_AUTH_API_URL}/oauth2/authorization/discord`}
              className="rounded-xl py-2 px-4 flex items-center gap-2 hover:bg-gray-600/20 border border-white/20 text-white afacad-bold text-sm transition whitespace-nowrap shrink-0"
            >
              <span className="text-blue-500"><FaDiscord size={18} /></span>
              Login with <span className="text-blue-500">Discord</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (isAlreadyValidated) {
    return (
      <div className="w-full h-full overflow-y-auto px-4 py-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-gray-900/75 backdrop-blur-md border border-green-500/30 rounded-2xl p-6 flex items-center gap-4">
            <MdVerified size={28} className="text-green-400 shrink-0" />
            <div>
              <p className="libre-baskerville-bold text-white text-lg">Already Validated</p>
              <p className="afacad-light text-gray-200 text-sm mt-0.5">
                UID <span className="afacad-bold text-white">{uid}</span> is already linked to your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto px-4 py-6 relative">
      <div className="max-w-xl mx-auto flex flex-col gap-4">

        {/* Title + generate button */}
        <motion.div
          className="bg-gray-900/75 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex items-center justify-between gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div>
            <p className="libre-baskerville-bold text-white text-lg">Validate your HSR Account</p>
            <p className="afacad-light text-gray-200 text-sm mt-0.5">
              Verifying ownership of UID <span className="text-white afacad-bold">{uid}</span>
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl bg-[var(--accent-bg-40)] border border-[var(--accent-border-60)] text-[var(--accent-text)] afacad-bold text-sm hover:bg-[var(--accent-bg-60)] transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          >
            {isGenerating ? 'Generating…' : step !== 'input' ? 'Regenerate' : 'Generate Code'}
          </button>
        </motion.div>

        {/* Instructions card — always visible; code + verify animate in */}
        <motion.div
          className="bg-gray-900/75 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          {/* Code boxes — animate in after generate */}
          <AnimatePresence>
            {step === 'code' && code && (
              <motion.div
                key="code-boxes"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3 pb-4 border-b border-white/10"
              >
                <p className="afacad-light text-white/80 text-xs uppercase tracking-wider text-center">Verification Code</p>
                <div className="flex justify-center gap-3">
                  {code.split('').map((char, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 flex items-center justify-center bg-black/50 border border-white/40 rounded-xl libre-baskerville-bold text-white text-xl select-all"
                    >
                      {char}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Instructions — always visible */}
          <div>
            <p className="afacad-light text-white/80 text-xs uppercase tracking-wider mb-3">How to verify</p>
            <ol className="afacad-light text-gray-200 text-sm flex flex-col gap-2">
              <li className="flex gap-2"><span className="text-[var(--accent-muted)] shrink-0">1.</span>Click <span className="text-white afacad-bold">Generate Code</span> above to get your unique 6-digit code.</li>
              <li className="flex gap-2"><span className="text-[var(--accent-muted)] shrink-0">2.</span>Open Honkai: Star Rail and go to your profile.</li>
              <li className="flex gap-2"><span className="text-[var(--accent-muted)] shrink-0">3.</span>Edit your signature / bio and add the code anywhere, then save.</li>
              <li className="flex gap-2"><span className="text-[var(--accent-muted)] shrink-0">4.</span>Return here and click <span className="text-white afacad-bold">Verify</span> once the timer expires.</li>
            </ol>
          </div>

          {/* Verify button — animate in after generate */}
          <AnimatePresence>
            {step === 'code' && (
              <motion.div
                key="verify-area"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-2 pt-2 border-t border-white/10"
              >
                {verifyError && (
                  <p className="afacad-light text-red-400 text-sm">
                    Verification failed — make sure the code is saved in your bio, then try again.
                  </p>
                )}

                <div className="flex items-center gap-3">
                  {(isVerifyPossible && isVerifyButtonActive) ? (
                    <motion.div
                      className={`flex items-center justify-center gap-1 overflow-hidden rounded-full cursor-pointer text-sm afacad-light py-0.5 ${isPressed ? 'bg-black/80 text-white' : 'bg-white/10 border border-white/20 text-white/60 hover:bg-white hover:text-black/80'} transition-colors`}
                      animate={{ width: hovered ? testWidth : 28 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      onMouseEnter={() => setHovered(true)}
                      onMouseLeave={() => { setIsPressed(false); setHovered(false); }}
                      onMouseDown={() => setIsPressed(true)}
                      onMouseUp={() => setIsPressed(false)}
                      onClick={handleVerify}
                    >
                      <AnimatePresence initial={false}>
                        {hovered && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="whitespace-nowrap pl-2 pr-1"
                          >
                            {isVerifying ? 'Verifying…' : 'Verify'}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <IoMdRefresh className={`${isVerifying ? 'animate-spin' : ''} mr-1`} />
                    </motion.div>
                  ) : (
                    <div className="px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-white/10 border border-white/20 text-white/60 text-sm cursor-not-allowed afacad-light">
                      {verifyTimeout * -1}s <IoMdRefresh />
                    </div>
                  )}
                  <p className="afacad-light text-white/70 text-xs">
                    {isVerifyPossible ? 'Ready to verify' : `Wait ${verifyTimeout * -1}s`}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Success */}
        <AnimatePresence>
          {step === 'verified' && (
            <motion.div
              key="verified-block"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 bg-green-900/40 border border-green-500/40 rounded-2xl px-5 py-4"
            >
              <MdVerified size={22} className="text-green-400 shrink-0" />
              <p className="afacad-light text-green-200 text-sm">
                UID <span className="afacad-bold">{uid}</span> has been successfully linked to your account.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Hidden div to measure verify button expanded width */}
      <div className="absolute invisible pointer-events-none h-0 overflow-hidden afacad-light">
        <div ref={testRef} className="flex items-center justify-center gap-1 px-2.5 py-0.5">
          <span>Verify</span>
          <IoMdRefresh />
        </div>
      </div>
    </div>
  );
}

export default Validate;
