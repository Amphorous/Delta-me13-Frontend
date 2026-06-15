import React from 'react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { selectPillColorMode } from '../../../../store/settingsSlice'

const BG_CLASSES = {
  theme: 'bg-[var(--accent-solid)]',
  card:  'bg-[var(--pill-accent-solid)]',
  bw:    'bg-white',
}

const BG_SELECTED_CLASSES = {
  theme: 'bg-[var(--accent-solid)]/85',
  card:  'bg-[var(--pill-accent-solid)]/85',
  bw:    'bg-white/85',
}

function Cursor({position, selectedTab}) {
  const pillColorMode = useSelector(selectPillColorMode)
  const mode = BG_CLASSES[pillColorMode] ? pillColorMode : 'theme'

  const bgClass = selectedTab === "" ? BG_CLASSES[mode] : BG_SELECTED_CLASSES[mode]

  return (
    <motion.div className={`absolute z-0 rounded-full h-[87%] ${bgClass}`}
        animate={position}
    ></motion.div>
  )
}

export default Cursor