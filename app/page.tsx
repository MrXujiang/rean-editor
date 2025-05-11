"use client"

import { useState, useRef, useEffect } from "react"
import { Player, type PlayerRef } from "@remotion/player"
import { AnimationComposition } from "@/components/animation-composition"
import { Timeline } from "@/components/timeline"
import { ControlPanel } from "@/components/control-panel"
import { ExportOptions } from "@/components/export-options"
import { Header } from "@/components/header"
import { ElementsList } from "@/components/elements-list"
import { initialElements } from "@/lib/initial-elements"
import { initialAnimationProps } from "@/lib/animation-props"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

export default function EditorPage() {
  const [elements, setElements] = useState(initialElements)
  const [selectedElement, setSelectedElement] = useState(null)
  const [animationProps, setAnimationProps] = useState({
    ...initialAnimationProps,
    backgroundColor: "#ffffff",
  })
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playerRef = useRef<PlayerRef>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  const { toast } = useToast()

  // 历史记录用于撤销/重做
  const [history, setHistory] = useState({
    past: [],
    present: initialElements,
    future: [],
  })

  // 当元素变化时更新历史记录
  useEffect(() => {
    if (elements !== history.present) {
      setHistory((prev) => ({
        past: [...prev.past, prev.present],
        present: elements,
        future: [],
      }))
    }
  }, [elements])

  // 在组件挂载后查找并存储视频元素引用
  useEffect(() => {
    const findVideoElement = () => {
      if (playerRef.current && playerRef.current.containerRef && playerRef.current.containerRef.current) {
        const videoEl = playerRef.current.containerRef.current.querySelector("video")
        if (videoEl) {
          videoElementRef.current = videoEl
          console.log("找到视频元素:", videoEl)

          // 添加事件监听器
          videoEl.addEventListener("play", () => setIsPlaying(true))
          videoEl.addEventListener("pause", () => setIsPlaying(false))
        }
      }
    }

    // 初始尝试查找
    findVideoElement()

    // 如果没有找到，设置一个定时器继续尝试
    const interval = setInterval(() => {
      if (!videoElementRef.current) {
        findVideoElement()
      } else {
        clearInterval(interval)
      }
    }, 500)

    return () => {
      clearInterval(interval)
      // 清理事件监听器
      if (videoElementRef.current) {
        videoElementRef.current.removeEventListener("play", () => setIsPlaying(true))
        videoElementRef.current.removeEventListener("pause", () => setIsPlaying(false))
      }
    }
  }, [])

  // 完全重写handlePlayPause函数，直接操作视频元素
  const handlePlayPause = () => {
    console.log("播放/暂停按钮被点击")

    try {
      // 首先尝试使用视频元素引用
      if (playerRef.current && playerRef.current.containerRef && playerRef.current.containerRef.current) {
        console.log("尝试查找视频元素")
        const videoEl = playerRef.current.containerRef.current.querySelector("video")
        if (videoEl) {
          if (isPlaying) {
            videoEl.pause()
            setIsPlaying(false)
            console.log("视频已暂停")
          } else {
            const playPromise = videoEl.play()

            // 处理播放Promise
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log("播放成功")
                  setIsPlaying(true)
                })
                .catch((error) => {
                  console.error("播放失败:", error)
                  // 尝试再次播放，有时第一次会因为用户交互限制而失败
                  setTimeout(() => {
                    videoEl
                      .play()
                      .then(() => {
                        console.log("第二次尝试播放成功")
                        setIsPlaying(true)
                      })
                      .catch((err) => {
                        console.error("第二次尝试播放失败:", err)
                        setIsPlaying(false)
                      })
                  }, 100)
                })
            }
          }
          return
        }
      }

      // 如果上述方法都失败，回退到使用Remotion API
      console.log("回退到Remotion API")
      if (playerRef.current) {
        if (isPlaying) {
          playerRef.current.pause()
        } else {
          playerRef.current.play()
        }

        // 直接更新状态，不等待事件
        setIsPlaying(!isPlaying)
      }
    } catch (error) {
      console.error("播放/暂停控制出错:", error)

      // 发生错误时，切换当前状态
      setIsPlaying(!isPlaying)
    }
  }

  // 修复时间更新监听
  useEffect(() => {
    if (!playerRef.current) return

    const updateTimeFromPlayer = () => {
      try {
        if (playerRef.current) {
          const newTime = Math.round(playerRef.current.getCurrentFrame())
          if (currentTime !== newTime) {
            setCurrentTime(newTime)
          }
        }
      } catch (error) {
        console.warn("获取当前帧时出错:", error)
      }
    }

    const interval = setInterval(updateTimeFromPlayer, 30)
    return () => clearInterval(interval)
  }, [currentTime])

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time)
    if (playerRef.current) {
      try {
        playerRef.current.seekTo(time)
      } catch (error) {
        console.warn("跳转到指定帧时出错:", error)
      }
    }
  }

  // 修改handleElementSelect函数，确保选中元素后UI正确更新
  const handleElementSelect = (id) => {
    if (id === null) {
      setSelectedElement(null)
      return
    }

    const element = elements.find((el) => el.id === id)
    if (element) {
      // 创建一个新的对象引用，确保React检测到状态变化
      setSelectedElement({ ...element })

      // 确保时间轴显示当前元素的关键帧
      if (element.animations && element.animations.length > 0) {
        // 可选：跳转到第一个关键帧
        // const firstKeyframe = element.animations[0].frame
        // handleTimeUpdate(firstKeyframe)
      }
    }
  }

  // 修改handleElementUpdate函数，确保元素更新后UI正确同步
  const handleElementUpdate = (updatedElement) => {
    // 深拷贝元素对象，确保动画数组等嵌套结构也被完全克隆
    const deepCopyElement = JSON.parse(JSON.stringify(updatedElement))

    // 确保更新是立即的，并触发重新渲染
    setElements((prevElements) => {
      const newElements = prevElements.map((el) => (el.id === deepCopyElement.id ? deepCopyElement : el))
      return newElements
    })

    // 如果更新的是当前选中的元素，也更新selectedElement状态
    if (selectedElement && selectedElement.id === deepCopyElement.id) {
      setSelectedElement(deepCopyElement)
    }
  }

  const handleAddElement = (elementType, position = null) => {
    const defaultPosition = position || { x: 100, y: 100 }

    const newElement = {
      id: `element-${Date.now()}`,
      type: elementType,
      properties:
        elementType === "text"
          ? { text: "新文本", fontSize: 40, color: "#000000" }
          : elementType === "shape"
            ? { shape: "rectangle", width: 100, height: 100, color: "#3b82f6" }
            : { src: "/abstract-animation-element.png", width: 200, height: 200 },
      position: defaultPosition,
      animations: [],
      startFrame: 0,
      endFrame: animationProps.durationInFrames,
    }

    const newElements = [...elements, newElement]
    setElements(newElements)
    setSelectedElement(newElement)

    toast({
      title: "元素已添加",
      description: `已将新${elementType === "text" ? "文本" : elementType === "shape" ? "形状" : "图片"}元素添加到您的合成中`,
    })
  }

  const handleAnimationPropsChange = (newProps) => {
    setAnimationProps({ ...animationProps, ...newProps })
  }

  // 修改handleAddKeyframe函数，确保动画数据被正确保存和更新

  // 替换现有的handleAddKeyframe函数（约在第205行）
  const handleAddKeyframe = (elementId, property, value) => {
    // 创建新的元素数组，深拷贝以确保状态更新
    const updatedElements = elements.map((el) => {
      if (el.id === elementId) {
        // 确保已有animations数组
        const animations = Array.isArray(el.animations) ? [...el.animations] : []

        // 查找是否已存在相同属性和帧的关键帧
        const existingIndex = animations.findIndex((a) => a.property === property && a.frame === currentTime)

        if (existingIndex >= 0) {
          // 更新现有关键帧
          animations[existingIndex] = {
            ...animations[existingIndex],
            value,
          }
        } else {
          // 添加新关键帧
          animations.push({
            property,
            frame: currentTime,
            value,
          })
        }

        // 排序关键帧，确保按时间顺序
        animations.sort((a, b) => {
          if (a.property === b.property) {
            return a.frame - b.frame
          }
          return a.property.localeCompare(b.property)
        })

        // 返回新的元素对象，确保React能检测到更改
        return {
          ...el,
          animations,
        }
      }
      return el
    })

    // 更新状态
    setElements(updatedElements)

    // 更新选中元素的状态
    if (selectedElement && selectedElement.id === elementId) {
      const updatedElement = updatedElements.find((el) => el.id === elementId)
      if (updatedElement) {
        setSelectedElement(updatedElement)
      }
    }

    toast({
      title: "已添加关键帧",
      description: `已在第 ${currentTime} 帧添加 ${property} 关键帧`,
    })
  }

  // 处理元素重新排序
  const handleElementsReorder = (newElements) => {
    setElements(newElements)

    toast({
      title: "元素已重新排序",
      description: "元素顺序已更新",
    })
  }

  // 撤销功能
  const handleUndo = () => {
    if (history.past.length === 0) return

    const previous = history.past[history.past.length - 1]
    const newPast = history.past.slice(0, history.past.length - 1)

    setHistory({
      past: newPast,
      present: previous,
      future: [history.present, ...history.future],
    })

    setElements(previous)

    // 如果当前选中的元素不在新的元素列表中，取消选择
    if (selectedElement && !previous.find((el) => el.id === selectedElement.id)) {
      setSelectedElement(null)
    }
  }

  // 重做功能
  const handleRedo = () => {
    if (history.future.length === 0) return

    const next = history.future[0]
    const newFuture = history.future.slice(1)

    setHistory({
      past: [...history.past, history.present],
      present: next,
      future: newFuture,
    })

    setElements(next)
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-900">
      <Header
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
      />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={20} minSize={15}>
            <ElementsList
              elements={elements}
              onAddElement={handleAddElement}
              onSelectElement={handleElementSelect}
              selectedElementId={selectedElement?.id}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={55}>
            <div className="flex flex-col h-full">
              <div className="flex-1 p-4 flex items-center justify-center bg-[#f8f9fa] dark:bg-zinc-800 rounded-md m-2 border border-zinc-200 dark:border-zinc-700">
                <div className="relative w-full max-w-3xl aspect-video shadow-lg">
                  <Player
                    ref={playerRef}
                    component={AnimationComposition}
                    durationInFrames={animationProps.durationInFrames}
                    fps={animationProps.fps}
                    compositionWidth={animationProps.width}
                    compositionHeight={animationProps.height}
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                    inputProps={{
                      elements,
                      selectedElementId: selectedElement?.id,
                      onElementSelect: handleElementSelect,
                      onElementUpdate: handleElementUpdate,
                      onAddElement: handleAddElement,
                    }}
                    loop
                    autoPlay={false}
                    onTimeUpdate={handleTimeUpdate}
                  />
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="flex flex-col h-full">
              <ControlPanel
                key={selectedElement ? selectedElement.id : "no-selection"}
                selectedElement={selectedElement}
                onElementUpdate={handleElementUpdate}
                onAddKeyframe={handleAddKeyframe}
                currentTime={currentTime}
                animationProps={animationProps}
                onAnimationPropsChange={handleAnimationPropsChange}
                setSelectedElement={setSelectedElement}
              />

              <ExportOptions elements={elements} animationProps={animationProps} playerRef={playerRef} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <Timeline
        durationInFrames={animationProps.durationInFrames}
        fps={animationProps.fps}
        currentTime={currentTime}
        elements={elements}
        onTimeUpdate={handleTimeUpdate}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        selectedElement={selectedElement}
        onElementsReorder={handleElementsReorder}
      />

      <Toaster />
    </div>
  )
}
