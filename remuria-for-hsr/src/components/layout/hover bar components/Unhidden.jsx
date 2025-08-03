import React, { useState } from 'react'
import { SlOptionsVertical } from "react-icons/sl";
import { motion } from 'framer-motion';

function Unhidden(props) {

    const {hovered} = props
    //based on if a user is signed in, 

  return (
    <motion.div
        animate={{ rotate: hovered ? -90 : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
        <SlOptionsVertical />
    </motion.div>
  )
}

export default Unhidden