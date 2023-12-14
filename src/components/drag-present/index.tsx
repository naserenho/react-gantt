import React, { useContext } from 'react'
import { observer } from 'mobx-react-lite'
import Context from '../../context'

/**
 * Tip bar when dragging
 */
const DragPresent: React.FC = () => {
  const { store } = useContext(Context)
  const { dragging, draggingType, bodyScrollHeight } = store

  if (!dragging) {
    return null
  }
  // As long as the currently dragged block
  const { width, translateX } = dragging
  const left = translateX
  const right = translateX + width
  const leftLine = draggingType === 'left' || draggingType === 'move'
  const rightLine = draggingType === 'right' || draggingType === 'move'
  return (
    <g fill='#DAE0FF' stroke='#7B90FF'>
      {leftLine && <path d={`M${left},0 L${left},${bodyScrollHeight}`} />}
      <rect x={left} y='0' width={width} height={bodyScrollHeight} strokeWidth='0' />
      {rightLine && <path d={`M${right},0 L${right},${bodyScrollHeight}`} />}
    </g>
  )
}
export default observer(DragPresent)
