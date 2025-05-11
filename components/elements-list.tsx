"use client"

import { Text, Square, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function ElementsList({ elements, onAddElement, onSelectElement, selectedElementId, onDragElement }) {
  const [draggedElementType, setDraggedElementType] = useState(null)

  // 处理元素拖拽开始
  const handleDragStart = (e, elementType) => {
    setDraggedElementType(elementType)

    // 设置拖拽数据
    e.dataTransfer.setData("application/remotion-element-type", elementType)

    // 设置拖拽图像
    const dragIcon = document.createElement("div")
    dragIcon.className = "bg-blue-500 text-white p-2 rounded"
    dragIcon.textContent = elementType === "text" ? "文本" : elementType === "shape" ? "形状" : "图片"
    document.body.appendChild(dragIcon)
    e.dataTransfer.setDragImage(dragIcon, 0, 0)

    // 延迟移除拖拽图像元素
    setTimeout(() => {
      document.body.removeChild(dragIcon)
    }, 0)
  }

  // 处理拖拽结束
  const handleDragEnd = () => {
    setDraggedElementType(null)
  }

  return (
    <div className="flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="font-semibold mb-2">元素</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddElement("text")}
            className="flex items-center gap-1"
            draggable
            onDragStart={(e) => handleDragStart(e, "text")}
            onDragEnd={handleDragEnd}
          >
            <Text className="h-4 w-4" />
            文本
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddElement("shape")}
            className="flex items-center gap-1"
            draggable
            onDragStart={(e) => handleDragStart(e, "shape")}
            onDragEnd={handleDragEnd}
          >
            <Square className="h-4 w-4" />
            形状
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddElement("image")}
            className="flex items-center gap-1"
            draggable
            onDragStart={(e) => handleDragStart(e, "image")}
            onDragEnd={handleDragEnd}
          >
            <ImageIcon className="h-4 w-4" />
            图片
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <Accordion type="single" collapsible defaultValue="elements">
          <AccordionItem value="elements" className="border-b-0">
            <AccordionTrigger className="py-2 px-3 hover:no-underline">组合元素</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1">
                {elements.length === 0 && (
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 p-3">暂无元素。添加一个元素开始创作。</div>
                )}

                {elements.map((element) => (
                  <div
                    key={element.id}
                    className={cn(
                      "flex items-center gap-2 rounded-md p-2 text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      element.id === selectedElementId && "bg-zinc-100 dark:bg-zinc-800",
                    )}
                    onClick={() => onSelectElement(element.id)}
                  >
                    {element.type === "text" && (
                      <>
                        <Text className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {element.properties.text.substring(0, 20)}
                          {element.properties.text.length > 20 && "..."}
                        </span>
                      </>
                    )}

                    {element.type === "shape" && (
                      <>
                        <Square className="h-4 w-4 flex-shrink-0" />
                        <span>
                          {element.properties.shape.charAt(0).toUpperCase() + element.properties.shape.slice(1)}
                        </span>
                      </>
                    )}

                    {element.type === "image" && (
                      <>
                        <ImageIcon className="h-4 w-4 flex-shrink-0" />
                        <span>图片</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
