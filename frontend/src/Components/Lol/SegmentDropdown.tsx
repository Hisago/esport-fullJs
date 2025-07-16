import { motion } from 'framer-motion'
import clsx from 'clsx'
import { useSegments } from '@/api/lol'

type Props = {
  onSelectSegment: (segmentId: string) => void
}

const SegmentDropdown = ({ onSelectSegment }: Props) => {
  const { data: segments, isLoading } = useSegments()

  if (isLoading) return <div className="p-4 text-white">Chargement...</div>
  if (!segments) return <div className="p-4 text-white">Aucun segment</div>

  return (
    <div className="w-64 rounded-xl bg-zinc-900 p-4 text-white shadow-lg">
      <div className="relative pl-4">
        {segments.map((segment, idx) => {
          const isLast = idx === segments.length - 1
          const nextSegment = segments[idx + 1]

          const isCurrentDoneOrActive = segment.status === 'done' || segment.status === 'active'
          const isNextDoneOrActive = nextSegment?.status === 'done' || nextSegment?.status === 'active'

          const connectorColor = isCurrentDoneOrActive && isNextDoneOrActive ? 'bg-red-500' : 'bg-white'

          return (
            <div
              key={segment.id}
              className="group relative mb-6 flex cursor-pointer items-start gap-3 last:mb-0"
              onClick={() => onSelectSegment(segment.id)}
            >
              {/* ligne verticale entre les points */}
              {!isLast && <div className={clsx('absolute bottom-[-1.5rem] left-2 top-4 w-px', connectorColor)} />}

              {/* point animé */}
              <div className="relative z-10">
                <motion.div
                  animate={segment.status === 'active' ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={segment.status === 'active' ? { repeat: Infinity, duration: 1, ease: 'easeInOut' } : {}}
                  className={clsx(
                    'h-4 w-4 rounded-full border-2',
                    segment.status === 'done' || segment.status === 'active'
                      ? 'border-rose-500 bg-rose-500'
                      : 'border-white bg-white'
                  )}
                />
              </div>

              {/* label */}
              <div>
                <div className="font-semibold leading-tight group-hover:underline">{segment.name}</div>
                <div className="text-xs uppercase text-gray-400">{segment.type}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SegmentDropdown
