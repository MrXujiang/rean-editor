"use client"

import { useRef, useState, useEffect } from "react"
import { Play, Pause, SkipBackIcon, ChevronDown, ChevronRight, GripVertical, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

export function Timeline({
  durationInFrames,
  fps,
  currentTime,
  elements,
  onTimeUpdate,
  isPlaying,
  onPlayPause,
  selectedElement,
  onElementsReorder,
}) {
  const timelineRef = useRef(null)
  const resizeHandleRef = useRef(null)
  const timelineContainerRef = useRef(null)
  const [expandedElements, setExpandedElements] = useState({})
  const [timelineHeight, setTimelineHeight] = useState(200) // 默认高度
  const [isDraggingHeight, setIsDraggingHeight] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragStartHeight, setDragStartHeight] = useState(0)
  const [draggingElementId, setDraggingElementId] = useState(null)
  const [dragOverElementId, setDragOverElementId] = useState(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [remainingTime, setRemainingTime] = useState("")

  // 格式化时间
  const formatTime = (frame) => {
    const seconds = Math.floor(frame / fps)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分${remainingSeconds.toString().padStart(2, "0")}秒`
  }

  // 计算剩余时间
  useEffect(() => {
    if (isPlaying) {
      const remainingFrames = durationInFrames - currentTime
      const remainingSeconds = Math.ceil(remainingFrames / fps)
      const minutes = Math.floor(remainingSeconds / 60)
      const seconds = remainingSeconds % 60
      setRemainingTime(`剩余: ${minutes}:${seconds.toString().padStart(2, "0")}`)
    } else {
      setRemainingTime("")
    }
  }, [isPlaying, currentTime, durationInFrames, fps])

  const toggleElementExpansion = (elementId) => {
    setExpandedElements((prev) => ({
      ...prev,
      [elementId]: !prev[elementId],
    }))
  }

  // 创建时间轴上的标记位置（每10%一个标记）
  const markers = Array.from({ length: 11 }, (_, i) => i * 0.1)

  // 处理时间轴高度调整 - 修复拖拽功能
  const handleHeightDragStart = (e) => {
    e.preventDefault()

    // 设置拖拽状态
    setIsDraggingHeight(true)

    // 记录起始位置和高度
    setDragStartY(e.clientY)
    setDragStartHeight(timelineHeight)

    // 添加全局鼠标事件监听器
    document.addEventListener("mousemove", handleHeightDragMove)
    document.addEventListener("mouseup", handleHeightDragEnd)
  }

  // 修改handleHeightDragMove函数 - 使用函数引用而不是内联函数
  const handleHeightDragMove = (e) => {
    if (!isDraggingHeight) return

    // 计算拖拽距离
    const deltaY = dragStartY - e.clientY

    // 计算新高度并限制在合理范围内
    const newHeight = Math.max(100, Math.min(400, dragStartHeight + deltaY))

    // 更新时间轴高度
    setTimelineHeight(newHeight)
  }

  const handleHeightDragEnd = () => {
    // 重置拖拽状态
    setIsDraggingHeight(false)

    // 移除全局鼠标事件监听器
    document.removeEventListener("mousemove", handleHeightDragMove)
    document.removeEventListener("mouseup", handleHeightDragEnd)
  }

  // 清理事件监听器
  useEffect(() => {
    // 组件卸载时清理事件监听器
    return () => {
      document.removeEventListener("mousemove", handleHeightDragMove)
      document.removeEventListener("mouseup", handleHeightDragEnd)
    }
  }, [])

  // 处理元素拖拽排序
  const handleDragStart = (e, elementId) => {
    e.stopPropagation()
    setDraggingElementId(elementId)
  }

  const handleDragOver = (e, elementId) => {
    e.preventDefault()
    if (draggingElementId !== elementId) {
      setDragOverElementId(elementId)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()

    if (draggingElementId && dragOverElementId && draggingElementId !== dragOverElementId) {
      // 找到拖拽元素和目标元素的索引
      const dragIndex = elements.findIndex((el) => el.id === draggingElementId)
      const dropIndex = elements.findIndex((el) => el.id === dragOverElementId)

      if (dragIndex !== -1 && dropIndex !== -1) {
        // 创建新的元素数组并重新排序
        const newElements = [...elements]
        const [draggedElement] = newElements.splice(dragIndex, 1)
        newElements.splice(dropIndex, 0, draggedElement)

        // 更新元素顺序
        onElementsReorder(newElements)
      }
    }

    // 重置拖拽状态
    setDraggingElementId(null)
    setDragOverElementId(null)
  }

  // 切换最小化状态
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  // 处理播放/暂停按钮点击
  const handlePlayPauseClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("Timeline中的播放/暂停按钮被点击")
    onPlayPause()
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 shadow-lg z-50 transition-all duration-300",
        isMinimized ? "h-12" : "",
      )}
      style={{
        boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)",
      }}
      ref={timelineContainerRef}
    >
      {/* 顶部控制栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onTimeUpdate(0)}>
            <SkipBackIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handlePlayPauseClick}
            aria-label={isPlaying ? "暂停" : "播放"}
            data-playing={isPlaying ? "true" : "false"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onTimeUpdate(durationInFrames - 1)}>
            <SkipBackIcon className="h-4 w-4 transform rotate-180" />
          </Button>

          <div className="text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(durationInFrames)}
          </div>

          {remainingTime && <div className="text-sm font-mono ml-2 text-blue-500">{remainingTime}</div>}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm">
            {currentTime} / {durationInFrames} frames
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMinimize}>
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 时间轴内容 - 仅在非最小化状态下显示 */}
      {!isMinimized && (
        <>
          {/* 高度调整手柄 - 修复拖拽功能 */}
          <div
            ref={resizeHandleRef}
            className="absolute top-0 left-0 right-0 h-4 cursor-ns-resize flex items-center justify-center z-10 bg-transparent"
            onMouseDown={handleHeightDragStart}
            style={{ touchAction: "none" }}
          >
            <div className="w-16 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
          </div>

          <div
            className="relative h-8 mx-4 my-2 bg-zinc-100 dark:bg-zinc-800 rounded-md overflow-hidden"
            ref={timelineRef}
          >
            {/* 时间轴标记 */}
            <div className="absolute inset-0 flex items-center">
              {markers.map((percentage, index) => (
                <div
                  key={index}
                  className="absolute h-full w-px bg-zinc-300 dark:bg-zinc-700"
                  style={{ left: `${percentage * 100}%` }}
                >
                  <div className="absolute -top-4 left-0 text-xs text-zinc-500 transform -translate-x-1/2">
                    {Math.round(percentage * durationInFrames)}
                  </div>
                </div>
              ))}
            </div>

            {/* 时间轴滑块 */}
            <Slider
              value={[currentTime]}
              min={0}
              max={durationInFrames - 1}
              step={1}
              onValueChange={(value) => onTimeUpdate(value[0])}
              className="absolute inset-0"
            />
          </div>

          {/* 元素时间轴轨道 */}
          <div
            className="overflow-y-auto rounded-md border border-zinc-200 dark:border-zinc-800 mx-4 mb-4"
            style={{ height: `${timelineHeight}px` }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {elements.map((element) => (
              <div
                key={element.id}
                className={cn(
                  "border-b border-zinc-200 dark:border-zinc-800 last:border-b-0",
                  element.id === selectedElement?.id && "bg-zinc-100 dark:bg-zinc-800",
                  draggingElementId === element.id && "opacity-50",
                  dragOverElementId === element.id && "border-t-2 border-blue-500",
                )}
                onDragOver={(e) => handleDragOver(e, element.id)}
              >
                <div className="flex items-center p-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <div
                    className="cursor-grab text-zinc-400 mr-1"
                    draggable
                    onDragStart={(e) => handleDragStart(e, element.id)}
                  >
                    <GripVertical className="h-4 w-4" />
                  </div>

                  <div className="flex-1 flex items-center" onClick={() => toggleElementExpansion(element.id)}>
                    {expandedElements[element.id] ? (
                      <ChevronDown className="h-4 w-4 mr-1" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-1" />
                    )}

                    <div className="text-sm font-medium">
                      {element.type === "text"
                        ? `文本: ${element.properties.text.substring(0, 15)}${element.properties.text.length > 15 ? "..." : ""}`
                        : element.type === "shape"
                          ? `形状: ${element.properties.shape}`
                          : "图片"}
                    </div>
                  </div>
                </div>

                {expandedElements[element.id] && (
                  <div className="pl-6 pr-2 pb-2">
                    <div className="relative h-6 bg-zinc-100 dark:bg-zinc-800 rounded">
                      {/* 元素时长条 */}
                      <div
                        className="absolute h-full bg-blue-200 dark:bg-blue-800 rounded"
                        style={{
                          left: `${(element.startFrame / durationInFrames) * 100}%`,
                          width: `${((element.endFrame - element.startFrame) / durationInFrames) * 100}%`,
                        }}
                      />

                      {/* 关键帧 */}
                      {Array.isArray(element.animations) &&
                        element.animations.map((anim, index) => (
                          <div
                            key={`${element.id}-keyframe-${index}`}
                            className="absolute h-4 w-4 bg-yellow-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 top-1/2 border-2 border-white"
                            style={{
                              left: `${(anim.frame / durationInFrames) * 100}%`,
                              zIndex: 5, // 确保关键帧在时间轴前面
                            }}
                            title={`${anim.property}: ${anim.value} at frame ${anim.frame}`}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
