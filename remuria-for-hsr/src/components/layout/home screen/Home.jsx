import axios from 'axios';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { GrSearch } from "react-icons/gr";
import { FaCircleNotch } from "react-icons/fa";
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';
import UserStrip from './UserStrip';
import { useDispatch, useSelector } from 'react-redux';
import { addOrReplaceUser } from '../../../store/localUsersSlice';

function Home() {

  const [responseWait, setResponseWait] = useState(false);
  const [cardState, setCardState] = useState(0);
  const [cardInfo, setCardInfo] = useState();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const localUsers = useSelector( state => state.localUsers )
  const dispatch = useDispatch();

  function submitHandler(obj){
    const uid = obj.uid;
    console.log("UID form output (Home.jsx) :", uid);

    setResponseWait(true);
    axios.get(`http://localhost:8080/user/dashboard/noRefresh/${uid}`)
      .then((res) => {
        setCardInfo(res.data);

        console.log(res.data)

        let userObjForLocalStorage = {
          uid: res.data.uid,
          nickname: res.data.nickname,
          signature: res.data.signature,
          region: res.data.region,
          headIcon: res.data.headIcon
        }
        setCardState(1);

        dispatch(addOrReplaceUser(userObjForLocalStorage))

        setResponseWait(false);
      })
      .catch((err) => {
        setCardState(-1);
        setCardInfo(undefined);
        setResponseWait(false);
      })
  }

  return (
    <div className='flex-1 bg-acmber-400 mx-5 flex justify-around items-center bg-gdray-800'>

      <div className="flex flex-col searchbar h-[73%] bg-avmber-50  aspect-[4.2/6] max-h-[65vh] max-w-[25vw] min-h-[480px] min-w-[336px]">
        
        <form onSubmit={handleSubmit(submitHandler)}
          className=' h-[10%] mb-[2%] text-[120%] flex items-center relative justify-end' 
        >
          <input
            id="uid"
            placeholder="Enter UID"
            type="text"
            inputMode="numeric"           
            pattern="\d*"                
            {...register("uid", {
              required: true,
              minLength: {
                value: 9,
                message: "UID must be at least 9 digits"
              },
              validate: value =>
                /^\d+$/.test(value) || "Only numbers allowed"
            })}
            className="border border-[#B2B2B2]/40 bg-gray-800/40 backdrop-blur-md rounded-full
                      w-full py-[3%] px-[5%] text-[#ebebeb] focus:outline-none focus:ring-2
                      focus:ring-purple-500 focus:border-transparent transition absolute z-0"
          />


            {(!responseWait) ? <>
              <button type="submit" className='cursor-pointer text-white rounded-full ring-[#E3E3E3] bg-[#B2B2B2]/42 p-[3%] m-2  text-[1rem] z-10
              hover:bg-white hover:text-black transition'>
                <GrSearch />
              </button>
            </>:
            <>
              <button type="button" className='cursor-pointer text-white rounded-full ring-[#ecebeb] bg-[#595959] p-[3%] m-2  text-[1rem] z-10'>
                <div className='animate-spin'>
                  <FaCircleNotch />
                </div>
              </button>
            </>}

        </form>

        <OverlayScrollbarsComponent
          options={{
            scrollbars: {
              autoHide: 'scroll', 
            },
          }}
          className="border border-[#B2B2B2]/40 bg-gray-800/40 backdrop-blur-md rounded-xl sm:rounded-4xl h-[88%] p-[5%]"
        >
          <div className="flex flex-col h-full ">
            {[...localUsers].reverse().map((user, index, arr) => (
              <UserStrip key={user.uid} user={user} last={(arr.length - index) === 1 ? true : false} first={(index) === 0 ? true : false}/>
              
            ))}
          </div>
        </OverlayScrollbarsComponent>


      </div>

      <div className="flex items-center justify-center mx-5">
        <div className="items-center flex flex-col ">
            <p className="afacad-bold text-9xl text-white truncate">
              Welcome to
            </p>
            <p className="afacad-bold text-9xl text-white mt-[-1.5rem]">
              Re<span className='text-purple-800'>:</span>muria
            </p>
          </div>
      </div>

    </div>
  )
}

export default Home