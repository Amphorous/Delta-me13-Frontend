import React from 'react'
import { Link, useMatches } from 'react-router-dom';
import { IoIosArrowForward } from "react-icons/io";

function BreadCrumb() {

    const matches = useMatches();

    const crumbs = matches
        .filter(match => match.handle?.crumb)
        .map((match, index) => ({
            path: match.pathname,
            label: match.handle.crumb(match),
            isLast: index === matches.length - 1,
        }));

  return (
    <nav className="text-sm text-gray-400 ml-2 mt-5 flex">
      {crumbs.map((crumb, idx) => (
        <span key={idx} className='flex'>
          {!crumb.isLast ? (
            <>
              <Link to={crumb.path} className="text-purple-400 hover:bg-gray-400/15 p-1.5 rounded-sm transition cursor-pointer">
                {crumb.label}
              </Link>
              <div className='mt-2.5'>
                <IoIosArrowForward />
              </div>
            </>
          ) : (
            <span className="text-gray-300">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export default BreadCrumb