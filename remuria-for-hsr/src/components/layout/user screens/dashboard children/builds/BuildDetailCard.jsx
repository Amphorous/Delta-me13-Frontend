import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { LuSword, LuUsersRound } from 'react-icons/lu';
import { MdEdit, MdDeleteOutline, MdVisibilityOff, MdVisibility, MdAdd } from 'react-icons/md';
import ExpandableRefreshButton from '../../../../ExpandableRefreshButton';
import { selectLoc } from '../../../../../store/localisationSlice';
import { characterIconUrl, relicPieceIconUrl, deriveDisplayStats, displayBuildName, fetchStatNames } from './buildConstants';

function BuildDetailCard({ build, isOwnUid, onRename, onDelete, onHide, onCreate, mutating }) {
  const selectedLoc = useSelector(selectLoc);
  const [statNames, setStatNames] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchStatNames(selectedLoc).then((names) => { if (!cancelled) setStatNames(names); });
    return () => { cancelled = true; };
  }, [selectedLoc]);

  useEffect(() => {
    if (build) {
      console.log("BuildDetailCard build:", build);
    }
  }, [build]);

  if (!build) {
    return (
      <div className='w-full h-full flex flex-col items-center justify-center gap-2'>
        <LuUsersRound size={32} />
        No build selected.
      </div>
    );
  }

  const relics = build.relicNodes || [];
  const displayStats = deriveDisplayStats(build.fightProps?.stats, statNames);
  const weapon = build.equipsWeapon;

  const setCounts = {};
  relics.forEach((r) => { if (r.setName) setCounts[r.setName] = (setCounts[r.setName] || 0) + 1; });
  const activeSets = Object.entries(setCounts).filter(([, count]) => count >= 2);

  const buildLabel = displayBuildName(build.buildName) ?? (build.isStatic ? 'Current Build' : 'Build');
  const mutatingAction = mutating?.key === `${build.avatarId}:${build.buildName}` ? mutating.action : null;

  return (
    <div className='w-full h-full flex flex-col overflow-hidden bg-gray-400'>
      <div className='flex items-center gap-4 p-5 shrink-0'>
        <img
          src={characterIconUrl(build.avatarId)}
          alt=""
          className='w-20 h-20 rounded-full object-cover shrink-0'
          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
        />
        <div className='flex flex-col min-w-0 flex-1'>
          <span className='text-xl truncate'>{buildLabel}</span>
          <span className='text-sm'>Lv. {build.level ?? '?'}</span>
        </div>
        <span className='shrink-0 text-2xl tabular-nums'>{(build.cv ?? 0).toFixed(1)}</span>
      </div>

      <div className='flex-1 min-h-0 overflow-y-auto p-5'>
        {weapon?.weaponNode && (
          <div className='flex items-center gap-2 mb-4 text-sm'>
            <LuSword size={18} />
            <span>Lv.{weapon.weaponLevel} · Refinement {weapon.weaponRefinement}</span>
          </div>
        )}

        {relics.length > 0 && (
          <div className='flex items-center gap-2 mb-4'>
            {relics.map((relic) => (
              <img
                key={relic.id}
                src={relicPieceIconUrl(relic.tid)}
                alt=""
                title={relic.setName}
                className='w-9 h-9 object-contain'
                onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
              />
            ))}
          </div>
        )}

        {activeSets.length > 0 && (
          <div className='flex flex-col gap-0.5 mb-4'>
            {activeSets.map(([name, count]) => (
              <span key={name} className='text-xs'>
                {count >= 4 ? '4pc' : '2pc'} {name}
              </span>
            ))}
          </div>
        )}

        <div className='grid grid-cols-2 gap-x-6 gap-y-1.5'>
          {displayStats.map(({ type, label, value }) => (
            <div key={type} className='flex items-center justify-between text-sm'>
              <span>{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {isOwnUid && (
        <div className='relative flex items-center gap-2 p-4 shrink-0'>
          {!build.isStatic && (
            <>
              <ExpandableRefreshButton
                label="Rename"
                icon={<MdEdit />}
                enabled={true}
                loading={mutatingAction === 'rename'}
                onClick={() => onRename?.(build)}
              />
              <ExpandableRefreshButton
                label="Delete"
                icon={<MdDeleteOutline />}
                enabled={true}
                loading={mutatingAction === 'delete'}
                onClick={() => onDelete?.(build)}
              />
            </>
          )}
          <ExpandableRefreshButton
            label={build.isHidden ? 'Unhide' : 'Hide'}
            icon={build.isHidden ? <MdVisibility /> : <MdVisibilityOff />}
            enabled={true}
            loading={mutatingAction === 'hide'}
            onClick={() => onHide?.(build)}
          />
          <ExpandableRefreshButton
            label="New Build"
            icon={<MdAdd />}
            enabled={true}
            loading={mutatingAction === 'create'}
            onClick={() => onCreate?.(build)}
          />
        </div>
      )}
    </div>
  );
}

export default BuildDetailCard;
