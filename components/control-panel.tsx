"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Plus, Trash2, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

// 全局存储动画属性选择的状态
const animationPropertyCache = new Map()

export function ControlPanel({
  selectedElement,
  onElementUpdate,
  onAddKeyframe,
  currentTime,
  animationProps,
  onAnimationPropsChange,
  setSelectedElement,
}) {
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [propertyValue, setPropertyValue] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [keyframeToDelete, setKeyframeToDelete] = useState(null)
  const [showAnimationTips, setShowAnimationTips] = useState(true)
  const [activeTab, setActiveTab] = useState("properties")
  const { toast } = useToast() // Move toast hook to the top

  // 使用ref跟踪上一次的元素ID，用于检测元素变化
  const prevElementIdRef = useRef(null)

  // 当选中元素变化时，尝试恢复之前保存的动画属性
  useEffect(() => {
    let cachedProperty = null
    let defaultProperty = null
    if (selectedElement) {
      // 如果选中了新元素
      if (prevElementIdRef.current !== selectedElement.id) {
        // 从缓存中获取该元素之前选择的动画属性
        cachedProperty = animationPropertyCache.get(selectedElement.id)

        if (!cachedProperty) {
          // 如果没有缓存，尝试选择一个默认属性
          defaultProperty = getDefaultPropertyForElement(selectedElement)
        }

        // 更新前一个元素ID引用
        prevElementIdRef.current = selectedElement.id
      }
    } else {
      // 如果没有选中元素，重置状态
      prevElementIdRef.current = null
    }

    if (selectedElement && prevElementIdRef.current === selectedElement.id) {
      if (cachedProperty) {
        // 如果有缓存的属性，恢复它
        setSelectedProperty(cachedProperty)
        const value = getPropertyValue(cachedProperty)
        setPropertyValue(value)
      } else if (defaultProperty) {
        setSelectedProperty(defaultProperty)
        const value = getPropertyValue(defaultProperty)
        setPropertyValue(value)
      } else {
        setSelectedProperty(null)
        setPropertyValue(null)
      }
    } else {
      setSelectedProperty(null)
      setPropertyValue(null)
    }
  }, [selectedElement])

  // 当选中的动画属性变化时，保存到缓存中
  useEffect(() => {
    if (selectedElement && selectedProperty) {
      animationPropertyCache.set(selectedElement.id, selectedProperty)
    }
  }, [selectedElement, selectedProperty])

  // 当选中元素或当前时间变化时，更新属性值
  useEffect(() => {
    if (selectedElement && selectedProperty) {
      const value = getPropertyValue(selectedProperty)
      setPropertyValue(value)
    }
  }, [selectedElement, selectedProperty, currentTime])

  // 根据元素类型获取默认动画属性
  const getDefaultPropertyForElement = (element) => {
    // 检查元素是否有动画
    if (element.animations && element.animations.length > 0) {
      // 返回第一个动画属性
      return element.animations[0].property
    }

    // 如果没有动画，根据元素类型返回默认属性
    switch (element.type) {
      case "text":
        return "opacity"
      case "shape":
        return "scale"
      case "image":
        return "opacity"
      default:
        return "opacity"
    }
  }

  // 检查属性是否适用于当前元素类型
  const isPropertySupportedForElement = useCallback((property, element) => {
    // 基本属性对所有元素都适用
    const basicProperties = ["x", "y", "opacity", "scale", "rotation"]
    if (basicProperties.includes(property)) {
      return true
    }

    // 文本特有属性
    if (["fontSize", "color"].includes(property) && element.type === "text") {
      return true
    }

    // 形状和图片特有属性
    if (["width", "height"].includes(property) && (element.type === "shape" || element.type === "image")) {
      return true
    }

    // 形状特有属性
    if (property === "color" && element.type === "shape") {
      return true
    }

    return false
  }, [])

  if (!selectedElement) {
    return (
      <div className="h-full p-4 border-l border-zinc-200 dark:border-zinc-800 flex flex-col overflow-auto">
        <Tabs defaultValue="composition">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="composition">合成</TabsTrigger>
            <TabsTrigger value="elements" disabled>
              元素
            </TabsTrigger>
          </TabsList>

          <TabsContent value="composition" className="mt-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
            <div className="space-y-2">
              <Label htmlFor="width">宽度</Label>
              <Input
                id="width"
                type="number"
                value={animationProps.width}
                onChange={(e) => onAnimationPropsChange({ width: Number.parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">高度</Label>
              <Input
                id="height"
                type="number"
                value={animationProps.height}
                onChange={(e) => onAnimationPropsChange({ height: Number.parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fps">FPS</Label>
              <Input
                id="fps"
                type="number"
                value={animationProps.fps}
                onChange={(e) => onAnimationPropsChange({ fps: Number.parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">时长 (帧)</Label>
              <Input
                id="duration"
                type="number"
                value={animationProps.durationInFrames}
                onChange={(e) => onAnimationPropsChange({ durationInFrames: Number.parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bgColor">背景颜色</Label>
              <div className="flex gap-2">
                <Input
                  id="bgColor"
                  type="color"
                  value={animationProps.backgroundColor || "#ffffff"}
                  onChange={(e) => onAnimationPropsChange({ backgroundColor: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={animationProps.backgroundColor || "#ffffff"}
                  onChange={(e) => onAnimationPropsChange({ backgroundColor: e.target.value })}
                />
              </div>
            </div>

            <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-4">选择一个元素编辑其属性。</div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // 修改updateElementProperty函数，确保属性更新立即生效
  const updateElementProperty = useCallback(
    (property, value) => {
      try {
        // Deep clone to ensure proper state update
        const updatedProperties = JSON.parse(
          JSON.stringify({
            ...selectedElement.properties,
            [property]: value,
          }),
        )

        const updatedElement = {
          ...selectedElement,
          properties: updatedProperties,
        }

        // 调用更新函数
        onElementUpdate(updatedElement)

        // 如果当前正在编辑的动画属性与更新的属性相同，也更新属性值
        if (selectedProperty === property) {
          setPropertyValue(value)
        }

        // 强制更新组件状态，确保UI同步
        setSelectedElement(updatedElement)
      } catch (error) {
        console.error("更新元素属性时出错:", error)
        toast({
          title: "更新失败",
          description: "更新元素属性时出现错误",
          variant: "destructive",
        })
      }
    },
    [selectedElement, selectedProperty, onElementUpdate, toast, setSelectedElement],
  )

  // 修改updateElementPosition函数，确保位置更新立即生效
  const updateElementPosition = useCallback(
    (axis, value) => {
      try {
        if (!selectedElement) return

        // Create a completely new object to ensure React detects the change
        const updatedElement = {
          ...selectedElement,
          position: {
            ...selectedElement.position,
            [axis]: Number(value),
          },
        }

        // 调用更新函数
        onElementUpdate(updatedElement)

        // 如果当前正在编辑的动画属性与更新的位置相同，也更新属性值
        if (selectedProperty === axis) {
          setPropertyValue(Number(value))
        }

        // 强制更新组件状态，确保UI同步
        setSelectedElement(updatedElement)
      } catch (error) {
        console.error("更新元素位置时出错:", error)
        toast({
          title: "更新失败",
          description: "更新元素位置时出现错误",
          variant: "destructive",
        })
      }
    },
    [selectedElement, selectedProperty, onElementUpdate, toast, setSelectedElement],
  )

  const getPropertyValue = useCallback(
    (property) => {
      if (!selectedElement) return null

      // 首先检查当前帧是否有关键帧
      const animation = selectedElement.animations?.find((a) => a.property === property && a.frame === currentTime)

      if (animation) {
        return animation.value
      }

      // 如果是位置属性
      if (property === "x" || property === "y") {
        return selectedElement.position[property]
      }

      // 如果是元素属性
      if (selectedElement.properties && selectedElement.properties[property] !== undefined) {
        return selectedElement.properties[property]
      }

      // 默认值
      if (property === "opacity") return 1
      if (property === "scale") return 1
      if (property === "rotation") return 0
      if (property === "width" && selectedElement.type !== "text") return 100
      if (property === "height" && selectedElement.type !== "text") return 100
      if (property === "fontSize" && selectedElement.type === "text") return 40
      if (property === "color") return "#000000"

      return undefined
    },
    [selectedElement, currentTime],
  )

  // 处理属性值变化
  const handlePropertyValueChange = useCallback((value) => {
    setPropertyValue(value)
  }, [])

  // 添加关键帧
  const handleAddKeyframe = useCallback(() => {
    if (selectedProperty !== null && propertyValue !== null && selectedElement) {
      // 防止添加重复关键帧
      const existingKeyframe = selectedElement.animations?.find(
        (anim) => anim.property === selectedProperty && anim.frame === currentTime,
      )

      // 深拷贝动画数组以确保状态更新
      const animations = selectedElement.animations ? JSON.parse(JSON.stringify(selectedElement.animations)) : []

      if (existingKeyframe) {
        // 如果已存在该帧的关键帧，则更新值
        const updatedAnimations = animations.map((anim) =>
          anim.property === selectedProperty && anim.frame === currentTime ? { ...anim, value: propertyValue } : anim,
        )

        const updatedElement = {
          ...selectedElement,
          animations: updatedAnimations,
        }

        onElementUpdate(updatedElement)
        setSelectedElement(updatedElement)

        toast({
          title: "已更新关键帧",
          description: `已在第 ${currentTime} 帧更新 ${selectedProperty} 关键帧`,
        })
      } else {
        // 添加新关键帧
        const newKeyframe = {
          property: selectedProperty,
          frame: currentTime,
          value: propertyValue,
        }

        animations.push(newKeyframe)

        // 创建更新后的元素
        const updatedElement = {
          ...selectedElement,
          animations: animations,
        }

        onElementUpdate(updatedElement)
        setSelectedElement(updatedElement)

        toast({
          title: "已添加关键帧",
          description: `已在第 ${currentTime} 帧添加 ${selectedProperty} 关键帧`,
        })
      }
    }
  }, [selectedElement, selectedProperty, propertyValue, currentTime, onElementUpdate, toast, setSelectedElement])

  // 删除关键帧
  const handleDeleteKeyframe = useCallback((frame) => {
    setKeyframeToDelete(frame)
    setShowDeleteDialog(true)
  }, [])

  // 确认删除关键帧
  const confirmDeleteKeyframe = useCallback(() => {
    if (!selectedProperty || keyframeToDelete === null) return

    const updatedAnimations = selectedElement.animations.filter(
      (anim) => !(anim.property === selectedProperty && anim.frame === keyframeToDelete),
    )

    onElementUpdate({
      ...selectedElement,
      animations: updatedAnimations,
    })

    toast({
      title: "关键帧已删除",
      description: `已删除第 ${keyframeToDelete} 帧的 ${selectedProperty} 关键帧`,
    })

    setShowDeleteDialog(false)
    setKeyframeToDelete(null)
  }, [selectedElement, selectedProperty, keyframeToDelete, onElementUpdate, toast])

  // 删除所有关键帧
  const handleDeleteAllKeyframes = useCallback(() => {
    if (!selectedProperty) return

    const updatedAnimations = selectedElement.animations.filter((anim) => anim.property !== selectedProperty)

    onElementUpdate({
      ...selectedElement,
      animations: updatedAnimations,
    })

    toast({
      title: "已删除所有关键帧",
      description: `已删除 ${selectedProperty} 的所有关键帧`,
    })
  }, [selectedElement, selectedProperty, onElementUpdate, toast])

  return (
    <div className="h-full p-4 border-l border-zinc-200 dark:border-zinc-800 flex flex-col overflow-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="properties">属性</TabsTrigger>
          <TabsTrigger value="animation">动画</TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="mt-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          <Accordion type="single" collapsible defaultValue="position">
            <AccordionItem value="position">
              <AccordionTrigger>位置</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="positionX">X 坐标</Label>
                    <Input
                      id="positionX"
                      type="number"
                      value={selectedElement.position.x}
                      onChange={(e) => updateElementPosition("x", Number.parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="positionY">Y 坐标</Label>
                    <Input
                      id="positionY"
                      type="number"
                      value={selectedElement.position.y}
                      onChange={(e) => updateElementPosition("y", Number.parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {selectedElement.type === "text" && (
              <AccordionItem value="text">
                <AccordionTrigger>文本</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <Label htmlFor="text">内容</Label>
                    <Input
                      id="text"
                      value={selectedElement.properties.text}
                      onChange={(e) => updateElementProperty("text", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 mt-2">
                    <Label htmlFor="fontSize">字体大小</Label>
                    <Input
                      id="fontSize"
                      type="number"
                      value={selectedElement.properties.fontSize}
                      onChange={(e) => updateElementProperty("fontSize", Number.parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2 mt-2">
                    <Label htmlFor="color">颜色</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={selectedElement.properties.color}
                        onChange={(e) => updateElementProperty("color", e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={selectedElement.properties.color}
                        onChange={(e) => updateElementProperty("color", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    <Label htmlFor="fontWeight">字体粗细</Label>
                    <Select
                      value={selectedElement.properties.fontWeight || "normal"}
                      onValueChange={(value) => updateElementProperty("fontWeight", value)}
                    >
                      <SelectTrigger id="fontWeight">
                        <SelectValue placeholder="Font Weight" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">正常</SelectItem>
                        <SelectItem value="bold">粗体</SelectItem>
                        <SelectItem value="light">细体</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {selectedElement.type === "shape" && (
              <AccordionItem value="shape">
                <AccordionTrigger>形状</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <Label htmlFor="shapeType">形状类型</Label>
                    <Select
                      value={selectedElement.properties.shape}
                      onValueChange={(value) => updateElementProperty("shape", value)}
                    >
                      <SelectTrigger id="shapeType">
                        <SelectValue placeholder="Shape Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rectangle">矩形</SelectItem>
                        <SelectItem value="circle">圆形</SelectItem>
                        <SelectItem value="rounded">圆角</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="width">宽度</Label>
                      <Input
                        id="width"
                        type="number"
                        value={selectedElement.properties.width}
                        onChange={(e) => updateElementProperty("width", Number.parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="height">高度</Label>
                      <Input
                        id="height"
                        type="number"
                        value={selectedElement.properties.height}
                        onChange={(e) => updateElementProperty("height", Number.parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    <Label htmlFor="shapeColor">颜色</Label>
                    <div className="flex gap-2">
                      <Input
                        id="shapeColor"
                        type="color"
                        value={selectedElement.properties.color}
                        onChange={(e) => updateElementProperty("color", e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={selectedElement.properties.color}
                        onChange={(e) => updateElementProperty("color", e.target.value)}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {selectedElement.type === "image" && (
              <AccordionItem value="image">
                <AccordionTrigger>图片</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <Label htmlFor="imageSrc">图片源</Label>
                    <Input
                      id="imageSrc"
                      value={selectedElement.properties.src}
                      onChange={(e) => updateElementProperty("src", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="imageWidth">宽度</Label>
                      <Input
                        id="imageWidth"
                        type="number"
                        value={selectedElement.properties.width}
                        onChange={(e) => updateElementProperty("width", Number.parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imageHeight">高度</Label>
                      <Input
                        id="imageHeight"
                        type="number"
                        value={selectedElement.properties.height}
                        onChange={(e) => updateElementProperty("height", Number.parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="timing">
              <AccordionTrigger>时间</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="startFrame">开始帧</Label>
                    <Input
                      id="startFrame"
                      type="number"
                      value={selectedElement.startFrame}
                      onChange={(e) =>
                        onElementUpdate({
                          ...selectedElement,
                          startFrame: Number.parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endFrame">结束帧</Label>
                    <Input
                      id="endFrame"
                      type="number"
                      value={selectedElement.endFrame}
                      onChange={(e) =>
                        onElementUpdate({
                          ...selectedElement,
                          endFrame: Number.parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="animation" className="mt-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          {showAnimationTips && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>动画提示</AlertTitle>
              <AlertDescription>
                1. 选择属性（如透明度、位置等）
                <br />
                2. 调整时间轴到希望关键帧出现的时间点
                <br />
                3. 设置属性的目标值
                <br />
                4. 点击"添加关键帧"按钮
                <br />
                5. 重复以上步骤添加更多关键帧以创建平滑动画
              </AlertDescription>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowAnimationTips(false)}>
                不再显示
              </Button>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="animationProperty">属性</Label>
            <Select
              value={selectedProperty || ""}
              onValueChange={(value) => {
                setSelectedProperty(value)
                const propValue = getPropertyValue(value)
                setPropertyValue(propValue)
                // 保存到缓存
                animationPropertyCache.set(selectedElement.id, value)
              }}
            >
              <SelectTrigger id="animationProperty">
                <SelectValue placeholder="选择要制作动画的属性" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="x">X 坐标</SelectItem>
                <SelectItem value="y">Y 坐标</SelectItem>
                <SelectItem value="opacity">透明度</SelectItem>
                <SelectItem value="scale">缩放</SelectItem>
                <SelectItem value="rotation">旋转</SelectItem>

                {selectedElement.type === "text" && (
                  <>
                    <SelectItem value="fontSize">字体大小</SelectItem>
                    <SelectItem value="color">颜色</SelectItem>
                  </>
                )}

                {selectedElement.type === "shape" && (
                  <>
                    <SelectItem value="width">宽度</SelectItem>
                    <SelectItem value="height">高度</SelectItem>
                    <SelectItem value="color">颜色</SelectItem>
                  </>
                )}

                {selectedElement.type === "image" && (
                  <>
                    <SelectItem value="width">宽度</SelectItem>
                    <SelectItem value="height">高度</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedProperty && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="propertyValue">
                    {selectedProperty.charAt(0).toUpperCase() + selectedProperty.slice(1)} 值
                  </Label>
                  <div className="text-xs text-zinc-500">帧: {currentTime}</div>
                </div>

                {selectedProperty === "color" ? (
                  <div className="flex gap-2">
                    <Input
                      id="propertyValue"
                      type="color"
                      value={propertyValue || "#000000"}
                      onChange={(e) => handlePropertyValueChange(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={propertyValue || "#000000"}
                      onChange={(e) => handlePropertyValueChange(e.target.value)}
                    />
                  </div>
                ) : selectedProperty === "opacity" || selectedProperty === "scale" ? (
                  <div className="space-y-2">
                    <Slider
                      id="propertyValue"
                      min={0}
                      max={selectedProperty === "opacity" ? 1 : 2}
                      step={0.01}
                      value={[propertyValue !== null ? propertyValue : selectedProperty === "opacity" ? 1 : 1]}
                      onValueChange={(value) => handlePropertyValueChange(value[0])}
                    />
                    <div className="text-center text-sm">
                      {propertyValue !== null
                        ? propertyValue.toFixed(2)
                        : selectedProperty === "opacity"
                          ? "1.00"
                          : "1.00"}
                    </div>
                  </div>
                ) : (
                  <Input
                    id="propertyValue"
                    type="number"
                    value={propertyValue !== null ? propertyValue : 0}
                    onChange={(e) => {
                      const value =
                        selectedProperty === "rotation" ||
                        selectedProperty === "x" ||
                        selectedProperty === "y" ||
                        selectedProperty === "fontSize" ||
                        selectedProperty === "width" ||
                        selectedProperty === "height"
                          ? Number.parseInt(e.target.value)
                          : e.target.value
                      handlePropertyValueChange(value)
                    }}
                  />
                )}
              </div>

              <Button className="w-full mt-2" onClick={handleAddKeyframe}>
                <Plus className="h-4 w-4 mr-2" />
                在当前帧添加关键帧
              </Button>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">已有关键帧</h3>
                  {selectedElement.animations?.some((a) => a.property === selectedProperty) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={handleDeleteAllKeyframes}
                    >
                      删除全部
                    </Button>
                  )}
                </div>
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  {selectedElement.animations
                    ?.filter((a) => a.property === selectedProperty)
                    .sort((a, b) => a.frame - b.frame)
                    .map((keyframe, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 text-sm border-b last:border-b-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <div className="flex items-center gap-2">
                          <div className="font-medium">帧 {keyframe.frame}</div>
                          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-mono">
                            {typeof keyframe.value === "number"
                              ? Number.isInteger(keyframe.value)
                                ? keyframe.value
                                : keyframe.value.toFixed(2)
                              : keyframe.value}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteKeyframe(keyframe.frame)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                  {!selectedElement.animations?.some((a) => a.property === selectedProperty) && (
                    <div className="p-2 text-sm text-zinc-500">该属性没有关键帧</div>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* 删除关键帧确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除关键帧</DialogTitle>
            <DialogDescription>确定要删除第 {keyframeToDelete} 帧的关键帧吗？此操作无法撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDeleteKeyframe}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
