"use client"

import type React from "react"

import { useRef } from "react"
import { useDrag, useDrop } from "react-dnd"
import { JobColumn } from "./job-column"

interface DraggableColumnProps {
  id: string
  index: number
  moveColumn: (dragIndex: number, hoverIndex: number) => void
  title: string
  type: string
  color: string
  count?: number
  children: React.ReactNode
  onDrop: (jobId: string) => void
  onSettingsClick: () => void
  onAddJobClick: (statusId: string) => void
}

export function DraggableColumn({
  id,
  index,
  moveColumn,
  title,
  type,
  color,
  count,
  children,
  onDrop,
  onSettingsClick,
  onAddJobClick,
}: DraggableColumnProps) {
  const ref = useRef<HTMLDivElement>(null)

  const [{ isOver }, drop] = useDrop({
    accept: "column",
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
    hover(item: any, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      // Get horizontal middle
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2

      // Determine mouse position
      const clientOffset = monitor.getClientOffset()
      
      // If clientOffset is null, we can't calculate drag position
      if (!clientOffset) {
        return
      }

      // Get pixels to the left
      const hoverClientX = clientOffset.x - hoverBoundingRect.left

      // Only perform the move when the mouse has crossed half of the items width
      // When dragging rightward, only move when the cursor is after 50%
      // When dragging leftward, only move when the cursor is before 50%

      // Dragging rightward
      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
        return
      }

      // Dragging leftward
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
        return
      }

      // Time to actually perform the action
      moveColumn(dragIndex, hoverIndex)

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex
    },
  })

  const [{ isDragging }, drag] = useDrag({
    type: "column",
    item: () => {
      return { id, index }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  drag(drop(ref))

  return (
    <div
      ref={ref}
      className="h-full transition-transform duration-200 mx-1"
      style={{
        opacity: isDragging ? 0.5 : 1,
        transform: isOver ? "scale(1.02)" : "scale(1)",
        cursor: isDragging ? "grabbing" : "grab"
      }}
      aria-label={`${title} column`}
    >
      <JobColumn
        id={id}
        title={title}
        type={type}
        color={color}
        count={count}
        onDrop={onDrop}
        onSettingsClick={onSettingsClick}
        onAddJobClick={onAddJobClick}
        isDragging={isDragging}
      >
        {children}
      </JobColumn>
    </div>
  )
}
