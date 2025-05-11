"use client"
import { AbsoluteFill, useCurrentFrame } from "remotion"
import { motion } from "framer-motion"
import { useState, useRef, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"

// 参考线组件
const Guideline = ({ position, type }) => {
  return (
    <div
      className={`absolute ${type === "horizontal" ? "w-full h-px" : "h-full w-px"} bg-blue-500 z-50 pointer-events-none`}
      style={{
        [type === "horizontal" ? "top" : "left"]: `${position}px`,
      }}
    />
  )
}

const AnimationElement = ({ element, frame, isSelected, onSelect, onUpdate, allElements }) => {
  const { id, type, properties, position, animations = [] } = element
  const elementRef = useRef(null)
  const [guidelines, setGuidelines] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // 使用useMemo缓存计算的动画值，提高性能
  const currentValues = useMemo(() => {
    // 计算所有动画属性的当前值
    const values = {}

    // 确保animations是数组
    if (Array.isArray(animations)) {
      // 获取所有唯一的动画属性
      const animatedProperties = [...new Set(animations.map((a) => a.property))]

      // 计算每个属性的当前值
      animatedProperties.forEach((prop) => {
        let defaultValue

        // 设置不同属性的默认值
        if (prop === "x") defaultValue = position.x
        else if (prop === "y") defaultValue = position.y
        else if (prop === "opacity") defaultValue = 1
        else if (prop === "scale") defaultValue = 1
        else if (prop === "rotation") defaultValue = 0
        else if (prop === "width") defaultValue = properties.width || 100
        else if (prop === "height") defaultValue = properties.height || 100
        else if (prop === "fontSize") defaultValue = properties.fontSize || 40
        else if (prop === "color") defaultValue = properties.color || "#000000"
        else defaultValue = 0

        values[prop] = getInterpolatedValue(prop, defaultValue)
      })
    }

    return values
  }, [frame, animations, position, properties, element.id])

  // 获取基于关键帧的插值属性
  function getInterpolatedValue(property, defaultValue) {
    try {
      // 确保animations是数组
      if (!Array.isArray(animations)) return defaultValue

      // 过滤出当前属性的关键帧并按帧排序
      const keyframes = animations.filter((a) => a.property === property).sort((a, b) => a.frame - b.frame)

      if (keyframes.length === 0) return defaultValue
      if (keyframes.length === 1) return keyframes[0].value

      // 找到当前帧前后的关键帧
      const beforeKeyframes = keyframes.filter((k) => k.frame <= frame)
      const afterKeyframes = keyframes.filter((k) => k.frame > frame)

      if (beforeKeyframes.length === 0) return keyframes[0].value
      if (afterKeyframes.length === 0) return beforeKeyframes[beforeKeyframes.length - 1].value

      const beforeKeyframe = beforeKeyframes[beforeKeyframes.length - 1]
      const afterKeyframe = afterKeyframes[0]

      // 计算插值进度
      const progress = (frame - beforeKeyframe.frame) / (afterKeyframe.frame - beforeKeyframe.frame)
      const clampedProgress = Math.max(0, Math.min(1, progress))

      // 根据属性类型进行不同的插值
      if (property === "color") {
        // 颜色插值需要特殊处理
        return interpolateColor(beforeKeyframe.value, afterKeyframe.value, clampedProgress)
      }

      // 数值插值 - 使用简单的线性插值
      let startValue = Number.parseFloat(beforeKeyframe.value)
      let endValue = Number.parseFloat(afterKeyframe.value)

      // 处理NaN情况
      if (isNaN(startValue)) startValue = 0
      if (isNaN(endValue)) endValue = 0

      // 确保scale属性不会变成负值
      if (property === "scale" && startValue + (endValue - startValue) * clampedProgress <= 0) {
        return 0.01 // 保持最小缩放值
      }

      return startValue + (endValue - startValue) * clampedProgress
    } catch (error) {
      console.error(`插值错误(${property}):`, error)
      return defaultValue
    }
  }

  // 改进颜色插值函数，处理更多边缘情况
  const interpolateColor = (color1, color2, progress) => {
    // 简单的颜色插值，支持十六进制颜色
    try {
      // 确保颜色格式正确
      if (!color1 || !color2 || typeof color1 !== "string" || typeof color2 !== "string") {
        return color1 || color2 || "#000000"
      }

      // 标准化颜色格式
      const normalizeColor = (color) => {
        // 如果是短格式 (#RGB)，转换为长格式 (#RRGGBB)
        if (color.length === 4) {
          return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
        }
        return color
      }

      color1 = normalizeColor(color1)
      color2 = normalizeColor(color2)

      // 解析颜色
      const r1 = Number.parseInt(color1.slice(1, 3), 16)
      const g1 = Number.parseInt(color1.slice(3, 5), 16)
      const b1 = Number.parseInt(color1.slice(5, 7), 16)

      const r2 = Number.parseInt(color2.slice(1, 3), 16)
      const g2 = Number.parseInt(color2.slice(3, 5), 16)
      const b2 = Number.parseInt(color2.slice(5, 7), 16)

      // 插值
      const r = Math.round(r1 + (r2 - r1) * progress)
      const g = Math.round(g1 + (g2 - g1) * progress)
      const b = Math.round(b1 + (b2 - b1) * progress)

      // 转回十六进制
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
    } catch (e) {
      console.error("颜色插值错误:", e)
      return color1 || color2 || "#000000"
    }
  }

  // 获取当前值（考虑动画）
  const getX = () => (currentValues.x !== undefined ? currentValues.x : position.x)
  const getY = () => (currentValues.y !== undefined ? currentValues.y : position.y)
  const getOpacity = () => (currentValues.opacity !== undefined ? currentValues.opacity : 1)
  const getScale = () => (currentValues.scale !== undefined ? currentValues.scale : 1)
  const getRotation = () => (currentValues.rotation !== undefined ? currentValues.rotation : 0)
  const getWidth = () => (currentValues.width !== undefined ? currentValues.width : properties.width || 100)
  const getHeight = () => (currentValues.height !== undefined ? currentValues.height : properties.height || 100)
  const getFontSize = () => (currentValues.fontSize !== undefined ? currentValues.fontSize : properties.fontSize)
  const getColor = () => (currentValues.color !== undefined ? currentValues.color : properties.color)

  // 计算参考线
  const calculateGuidelines = (currentX, currentY, width, height) => {
    const snapThreshold = 10 // 吸附阈值（像素）
    const newGuidelines = []

    // 元素边界
    const left = currentX
    const right = currentX + width
    const top = currentY
    const bottom = currentY + height
    const centerX = currentX + width / 2
    const centerY = currentY + height / 2

    // 画布中心和边缘参考线
    const canvasGuidelines = [
      { type: "horizontal", position: 0 }, // 顶部
      { type: "horizontal", position: 360 }, // 中心
      { type: "horizontal", position: 720 }, // 底部
      { type: "vertical", position: 0 }, // 左侧
      { type: "vertical", position: 640 }, // 中心
      { type: "vertical", position: 1280 }, // 右侧
    ]

    // 其他元素的参考线
    allElements.forEach((otherElement) => {
      if (otherElement.id === id) return // 跳过自己

      const otherWidth = otherElement.properties.width || 100
      const otherHeight = otherElement.properties.height || 100
      const otherLeft = otherElement.position.x
      const otherRight = otherElement.position.x + otherWidth
      const otherTop = otherElement.position.y
      const otherBottom = otherElement.position.y + otherHeight
      const otherCenterX = otherElement.position.x + otherWidth / 2
      const otherCenterY = otherElement.position.y + otherHeight / 2

      // 添加其他元素的边界作为可能的参考线
      canvasGuidelines.push(
        { type: "horizontal", position: otherTop },
        { type: "horizontal", position: otherBottom },
        { type: "horizontal", position: otherCenterY },
        { type: "vertical", position: otherLeft },
        { type: "vertical", position: otherRight },
        { type: "vertical", position: otherCenterX },
      )
    })

    // 检查是否接近任何参考线
    canvasGuidelines.forEach((guideline) => {
      if (guideline.type === "horizontal") {
        // 检查顶部、中心和底部是否接近水平参考线
        if (
          Math.abs(top - guideline.position) < snapThreshold ||
          Math.abs(centerY - guideline.position) < snapThreshold ||
          Math.abs(bottom - guideline.position) < snapThreshold
        ) {
          newGuidelines.push(guideline)
        }
      } else {
        // 检查左侧、中心和右侧是否接近垂直参考线
        if (
          Math.abs(left - guideline.position) < snapThreshold ||
          Math.abs(centerX - guideline.position) < snapThreshold ||
          Math.abs(right - guideline.position) < snapThreshold
        ) {
          newGuidelines.push(guideline)
        }
      }
    })

    return newGuidelines
  }

  // 吸附到参考线
  const snapToGuidelines = (x, y, width, height) => {
    const snapThreshold = 10
    let snappedX = x
    let snappedY = y

    // 元素边界
    const left = x
    const right = x + width
    const top = y
    const bottom = y + height
    const centerX = x + width / 2
    const centerY = y + height / 2

    // 画布参考点
    const canvasPoints = [
      { type: "horizontal", position: 0 }, // 顶部
      { type: "horizontal", position: 360 }, // 中心
      { type: "horizontal", position: 720 }, // 底部
      { type: "vertical", position: 0 }, // 左侧
      { type: "vertical", position: 640 }, // 中心
      { type: "vertical", position: 1280 }, // 右侧
    ]

    // 其他元素参考点
    allElements.forEach((otherElement) => {
      if (otherElement.id === id) return

      const otherWidth = otherElement.properties.width || 100
      const otherHeight = otherElement.properties.height || 100
      const otherLeft = otherElement.position.x
      const otherRight = otherElement.position.x + otherWidth
      const otherTop = otherElement.position.y
      const otherBottom = otherElement.position.y + otherHeight
      const otherCenterX = otherElement.position.x + otherWidth / 2
      const otherCenterY = otherElement.position.y + otherHeight / 2

      canvasPoints.push(
        { type: "horizontal", position: otherTop },
        { type: "horizontal", position: otherBottom },
        { type: "horizontal", position: otherCenterY },
        { type: "vertical", position: otherLeft },
        { type: "vertical", position: otherRight },
        { type: "vertical", position: otherCenterX },
      )
    })

    // 水平吸附
    canvasPoints
      .filter((p) => p.type === "horizontal")
      .forEach((point) => {
        // 顶部吸附
        if (Math.abs(top - point.position) < snapThreshold) {
          snappedY = point.position
        }
        // 中心吸附
        else if (Math.abs(centerY - point.position) < snapThreshold) {
          snappedY = point.position - height / 2
        }
        // 底部吸附
        else if (Math.abs(bottom - point.position) < snapThreshold) {
          snappedY = point.position - height
        }
      })

    // 垂直吸附
    canvasPoints
      .filter((p) => p.type === "vertical")
      .forEach((point) => {
        // 左侧吸附
        if (Math.abs(left - point.position) < snapThreshold) {
          snappedX = point.position
        }
        // 中心吸附
        else if (Math.abs(centerX - point.position) < snapThreshold) {
          snappedX = point.position - width / 2
        }
        // 右侧吸附
        else if (Math.abs(right - point.position) < snapThreshold) {
          snappedX = point.position - width
        }
      })

    return { x: snappedX, y: snappedY }
  }

  // 处理拖拽开始
  const handleDragStart = (event, info) => {
    setIsDragging(true)

    // 计算鼠标相对于元素的偏移量
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect()
      setDragOffset({
        x: info.point.x - rect.left,
        y: info.point.y - rect.top,
      })
    }

    // 防止事件冒泡，确保只选择当前元素
    event.stopPropagation()
    onSelect(id)
  }

  // 处理拖拽中
  const handleDrag = (event, info) => {
    if (!isDragging) return

    try {
      // 安全地获取合成容器元素
      let compositionElement = null

      // 尝试多种方法找到合成容器
      if (event.currentTarget) {
        // 方法1: 使用closest查找
        compositionElement = event.currentTarget.closest(".composition-container")

        // 方法2: 如果方法1失败，尝试查找父元素中的第一个AbsoluteFill
        if (!compositionElement) {
          let parent = event.currentTarget.parentElement
          while (parent) {
            if (parent.className && parent.className.includes("absolute-fill")) {
              compositionElement = parent
              break
            }
            parent = parent.parentElement
          }
        }
      }

      // 如果仍然找不到合成容器，使用固定偏移量
      if (!compositionElement) {
        // 使用当前位置和鼠标偏移计算新位置
        const newX = position.x + info.delta.x
        const newY = position.y + info.delta.y

        const width = getWidth()
        const height = getHeight()

        // 计算参考线
        const newGuidelines = calculateGuidelines(newX, newY, width, height)
        setGuidelines(newGuidelines)

        // 应用吸附
        const snappedPosition = snapToGuidelines(newX, newY, width, height)

        // 更新元素位置
        onUpdate({
          ...element,
          position: snappedPosition,
        })

        return
      }

      // 如果找到了合成容器，使用正常的位置计算
      const compositionRect = compositionElement.getBoundingClientRect()

      // 计算相对于画布的位置
      const newX = info.point.x - compositionRect.left - dragOffset.x
      const newY = info.point.y - compositionRect.top - dragOffset.y

      const width = getWidth()
      const height = getHeight()

      // 计算参考线
      const newGuidelines = calculateGuidelines(newX, newY, width, height)
      setGuidelines(newGuidelines)

      // 应用吸附
      const snappedPosition = snapToGuidelines(newX, newY, width, height)

      // 更新元素位置
      onUpdate({
        ...element,
        position: snappedPosition,
      })
    } catch (error) {
      console.error("拖拽处理错误:", error)

      // 发生错误时的备用方案：直接使用delta更新位置
      const newX = position.x + info.delta.x
      const newY = position.y + info.delta.y

      onUpdate({
        ...element,
        position: { x: newX, y: newY },
      })
    }
  }

  // 处理拖拽结束
  const handleDragEnd = () => {
    setIsDragging(false)
    setGuidelines([]) // 清除参考线
  }

  // 阻止图片默认拖拽行为
  useEffect(() => {
    const preventImageDrag = (e) => {
      e.preventDefault()
      return false
    }

    // 如果是图片元素，为其添加阻止默认拖拽的事件监听器
    if (type === "image" && elementRef.current) {
      const imgElement = elementRef.current.querySelector("img")
      if (imgElement) {
        imgElement.addEventListener("dragstart", preventImageDrag)
        return () => {
          imgElement.removeEventListener("dragstart", preventImageDrag)
        }
      }
    }
  }, [type])

  return (
    <>
      {/* 参考线 */}
      {isDragging &&
        guidelines.map((guideline, index) => (
          <Guideline
            key={`${guideline.type}-${guideline.position}-${index}`}
            position={guideline.position}
            type={guideline.type}
          />
        ))}

      <motion.div
        ref={elementRef}
        drag
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(id)
        }}
        style={{
          position: "absolute",
          left: getX(),
          top: getY(),
          opacity: getOpacity(),
          transform: `scale(${getScale()}) rotate(${getRotation()}deg)`,
          cursor: "move",
          zIndex: isSelected ? 10 : 1,
          transformOrigin: "center center",
        }}
        className={cn("transition-shadow", isSelected && "outline outline-2 outline-blue-500 shadow-lg")}
        whileDrag={{
          boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)",
          opacity: 0.8,
        }}
        dragElastic={0}
      >
        {type === "text" && (
          <div
            style={{
              fontSize: getFontSize(),
              color: getColor(),
              fontWeight: properties.fontWeight || "normal",
              fontFamily: properties.fontFamily || "sans-serif",
              textAlign: properties.textAlign || "left",
            }}
          >
            {properties.text}
          </div>
        )}

        {type === "shape" && (
          <div
            style={{
              width: getWidth(),
              height: getHeight(),
              backgroundColor: getColor(),
              borderRadius: properties.shape === "circle" ? "50%" : properties.shape === "rounded" ? "8px" : "0",
            }}
          />
        )}

        {type === "image" && (
          <img
            src={properties.src || "/placeholder.svg"}
            alt="动画元素"
            style={{
              width: getWidth(),
              height: getHeight(),
              objectFit: "cover",
            }}
            draggable={false} // 禁用图片默认拖拽
          />
        )}
      </motion.div>
    </>
  )
}

export const AnimationComposition = ({
  elements,
  selectedElementId,
  onElementSelect,
  onElementUpdate,
  onAddElement,
}) => {
  const frame = useCurrentFrame()
  const compositionRef = useRef(null)
  const [dropPosition, setDropPosition] = useState({ x: 0, y: 0 })
  const [isDragOver, setIsDragOver] = useState(false)

  // 处理画布点击事件（取消选择）
  const handleCanvasClick = () => {
    onElementSelect(null)
  }

  // 处理拖拽进入
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)

    // 计算放置位置
    if (compositionRef.current) {
      const rect = compositionRef.current.getBoundingClientRect()
      setDropPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  // 处理拖拽离开
  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  // 处理放置
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)

    // 获取拖拽的元素类型
    const elementType = e.dataTransfer.getData("application/remotion-element-type")

    if (elementType && compositionRef.current) {
      // 计算放置位置
      const rect = compositionRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // 添加新元素
      onAddElement(elementType, { x, y })
    }
  }

  // 监听帧变化，确保动画正确更新
  useEffect(() => {
    // 这个空的useEffect依赖于frame，
    // 确保每当frame变化时组件会重新渲染
    // 这有助于解决动画不更新的问题
  }, [frame])

  return (
    <AbsoluteFill
      ref={compositionRef}
      style={{
        backgroundColor: "white",
        border: isDragOver ? "2px dashed #3b82f6" : "none",
      }}
      onClick={handleCanvasClick}
      className="composition-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {elements.map((element) => (
        <AnimationElement
          key={element.id}
          element={element}
          frame={frame}
          isSelected={element.id === selectedElementId}
          onSelect={onElementSelect}
          onUpdate={onElementUpdate}
          allElements={elements}
        />
      ))}

      {/* 拖拽预览指示器 */}
      {isDragOver && (
        <div
          className="absolute w-8 h-8 rounded-full bg-blue-500 opacity-50 pointer-events-none"
          style={{
            left: dropPosition.x - 16,
            top: dropPosition.y - 16,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </AbsoluteFill>
  )
}
