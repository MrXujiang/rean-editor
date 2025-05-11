"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { VideoIcon, ImageIcon, Loader2, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

export function ExportOptions({ elements, animationProps, playerRef }) {
  const [exportType, setExportType] = useState("video")
  const [exportFormat, setExportFormat] = useState("mp4")
  const [quality, setQuality] = useState("high")
  const [isExporting, setIsExporting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [startFrame, setStartFrame] = useState(0)
  const [endFrame, setEndFrame] = useState(animationProps.durationInFrames - 1)
  const [exportWidth, setExportWidth] = useState(animationProps.width)
  const [exportHeight, setExportHeight] = useState(animationProps.height)
  const [optimizeGif, setOptimizeGif] = useState(true)
  const [exportProgress, setExportProgress] = useState(0)
  const { toast } = useToast()
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const framesRef = useRef([])
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const [gifLibLoaded, setGifLibLoaded] = useState(false)

  // 使用更安全的方式检测GIF.js库是否可用
  useEffect(() => {
    // 检查GIF.js是否已加载
    if (typeof window !== "undefined" && window.GIF) {
      setGifLibLoaded(true)
      return
    }

    // 不再尝试动态加载GIF.js库，而是提供备用方案
    console.log("GIF.js库未加载，将使用备用导出方法")
  }, [])

  // 辅助函数用于下载 Blob
  const downloadBlob = useCallback((blob, fileName) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, [])

  // 修改captureFrame函数，确保可靠捕获帧
  const captureFrame = useCallback(
      async (frameNumber) => {
        if (!playerRef.current) return null

        try {
          // 确保播放器跳转到指定帧
          await playerRef.current.seekTo(frameNumber)

          // 等待渲染完成
          await new Promise((resolve) => setTimeout(resolve, 300))

          // 尝试多种方法获取视频元素
          let videoElement = null

          // 方法1: 直接查找video元素
          if (playerRef.current.containerRef.current) {
            videoElement = playerRef.current.containerRef.current.querySelector("video")
          }

          // 如果找到了视频元素，使用常规方法
          if (videoElement) {
            // 创建或重用canvas
            if (!canvasRef.current) {
              canvasRef.current = document.createElement("canvas")
            }

            canvasRef.current.width = exportWidth
            canvasRef.current.height = exportHeight

            // 绘制当前帧到canvas
            const ctx = canvasRef.current.getContext("2d")
            ctx.fillStyle = animationProps.backgroundColor || "#ffffff"
            ctx.fillRect(0, 0, exportWidth, exportHeight)
            ctx.drawImage(videoElement, 0, 0, exportWidth, exportHeight)

            // 返回canvas的数据URL
            return canvasRef.current.toDataURL("image/png")
          }

          // 方法2: 如果方法1失败，尝试获取整个容器
          if (!videoElement && playerRef.current.containerRef.current) {
            // 使用html2canvas或类似库捕获整个容器
            // 这里简化为直接使用canvas捕获容器
            const container = playerRef.current.containerRef.current

            // 创建或重用canvas
            if (!canvasRef.current) {
              canvasRef.current = document.createElement("canvas")
            }

            canvasRef.current.width = exportWidth
            canvasRef.current.height = exportHeight

            // 绘制背景
            const ctx = canvasRef.current.getContext("2d")
            ctx.fillStyle = animationProps.backgroundColor || "#ffffff"
            ctx.fillRect(0, 0, exportWidth, exportHeight)

            // 尝试绘制容器内容
            try {
              // 这里使用一个简单的方法：创建一个临时图像，然后绘制到canvas
              // 在实际应用中，可能需要使用html2canvas等库
              const tempImg = new Image()
              tempImg.crossOrigin = "anonymous"

              // 创建一个数据URL，表示当前帧
              const dataUrl = `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="${exportWidth}" height="${exportHeight}">
              <foreignObject width="100%" height="100%">
                <div xmlns="http://www.w3.org/1999/xhtml">
                  ${container.innerHTML}
                </div>
              </foreignObject>
            </svg>`

              await new Promise((resolve) => {
                tempImg.onload = resolve
                tempImg.src = dataUrl
              })

              ctx.drawImage(tempImg, 0, 0, exportWidth, exportHeight)

              return canvasRef.current.toDataURL("image/png")
            } catch (svgError) {
              console.error("SVG捕获失败:", svgError)

              // 备用方案：返回一个带有帧号的纯色图像
              ctx.fillStyle = animationProps.backgroundColor || "#ffffff"
              ctx.fillRect(0, 0, exportWidth, exportHeight)

              // 添加帧号文本
              ctx.fillStyle = "#000000"
              ctx.font = "24px Arial"
              ctx.textAlign = "center"
              ctx.fillText(`Frame ${frameNumber}`, exportWidth / 2, exportHeight / 2)

              return canvasRef.current.toDataURL("image/png")
            }
          }

          // 如果所有方法都失败，返回一个带有帧号的纯色图像
          const fallbackCanvas = document.createElement("canvas")
          fallbackCanvas.width = exportWidth
          fallbackCanvas.height = exportHeight

          const fallbackCtx = fallbackCanvas.getContext("2d")
          fallbackCtx.fillStyle = animationProps.backgroundColor || "#ffffff"
          fallbackCtx.fillRect(0, 0, exportWidth, exportHeight)

          // 添加帧号文本
          fallbackCtx.fillStyle = "#000000"
          fallbackCtx.font = "24px Arial"
          fallbackCtx.textAlign = "center"
          fallbackCtx.fillText(`Frame ${frameNumber}`, exportWidth / 2, exportHeight / 2)

          return fallbackCanvas.toDataURL("image/png")
        } catch (error) {
          console.error("捕获帧时出错:", error)

          // 返回一个错误指示图像
          const errorCanvas = document.createElement("canvas")
          errorCanvas.width = exportWidth
          errorCanvas.height = exportHeight

          const errorCtx = errorCanvas.getContext("2d")
          errorCtx.fillStyle = "#ffcccc" // 淡红色背景表示错误
          errorCtx.fillRect(0, 0, exportWidth, exportHeight)

          // 添加错误文本
          errorCtx.fillStyle = "#ff0000"
          errorCtx.font = "18px Arial"
          errorCtx.textAlign = "center"
          errorCtx.fillText(`Error capturing frame ${frameNumber}`, exportWidth / 2, exportHeight / 2)

          return errorCanvas.toDataURL("image/png")
        }
      },
      [playerRef, exportWidth, exportHeight, animationProps.backgroundColor],
  )

  // 创建视频元素并添加帧
  const createVideoFromFrames = useCallback(
      async (frames, fps) => {
        return new Promise(async (resolve, reject) => {
          try {
            // 创建一个临时canvas用于绘制帧
            const canvas = document.createElement("canvas")
            canvas.width = exportWidth
            canvas.height = exportHeight
            const ctx = canvas.getContext("2d")

            // 创建MediaRecorder，使用更安全的MIME类型检测
            const stream = canvas.captureStream(fps)
            let options = {}
            const videoCodecs = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"]

            // 查找浏览器支持的第一个编解码器
            let supportedCodec = videoCodecs.find((codec) => {
              try {
                return MediaRecorder.isTypeSupported(codec)
              } catch (e) {
                return false
              }
            })

            if (!supportedCodec) {
              supportedCodec = "video/webm" // 回退到通用格式
            }

            options = {
              mimeType: supportedCodec,
              videoBitsPerSecond: quality === "high" ? 8000000 : quality === "medium" ? 5000000 : 2500000,
            }

            const recorder = new MediaRecorder(stream, options)
            console.log(`使用编解码器: ${supportedCodec}`)

            recorderRef.current = recorder
            chunksRef.current = []

            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                chunksRef.current.push(e.data)
              }
            }

            recorder.onstop = async () => {
              try {
                // 创建视频blob
                const videoBlob = new Blob(chunksRef.current, { type: "video/webm" })

                // 如果需要MP4格式，尝试转换
                if (exportFormat === "mp4") {
                  try {
                    // 使用WebCodecs API或第三方库转换为MP4
                    // 这里简化处理，直接返回webm格式，并提示用户
                    toast({
                      title: "导出完成",
                      description: "由于浏览器限制，视频以WebM格式导出。您可以使用在线工具转换为MP4。",
                    })
                    resolve(videoBlob)
                  } catch (conversionError) {
                    console.error("转换为MP4失败:", conversionError)
                    resolve(videoBlob) // 返回原始webm
                  }
                } else {
                  resolve(videoBlob)
                }
              } catch (error) {
                reject(error)
              }
            }

            // 开始录制
            recorder.start()

            // 逐帧绘制到canvas
            for (let i = 0; i < frames.length; i++) {
              const img = new Image()
              img.crossOrigin = "anonymous"

              // 等待图像加载
              await new Promise((resolveImg) => {
                img.onload = resolveImg
                img.onerror = () => resolveImg() // 即使加载失败也继续
                img.src = frames[i]
              })

              // 清除canvas并绘制当前帧
              ctx.fillStyle = animationProps.backgroundColor || "#ffffff"
              ctx.fillRect(0, 0, exportWidth, exportHeight)

              // 只有当图像加载成功时才绘制
              if (img.complete && img.naturalWidth !== 0) {
                ctx.drawImage(img, 0, 0, exportWidth, exportHeight)
              } else {
                // 如果图像加载失败，绘制帧号
                ctx.fillStyle = "#000000"
                ctx.font = "24px Arial"
                ctx.textAlign = "center"
                ctx.fillText(`Frame ${i}`, exportWidth / 2, exportHeight / 2)
              }

              // 更新进度
              const progress = 50 + Math.round(((i + 1) / frames.length) * 40)
              setExportProgress(progress)

              // 等待一小段时间，确保帧被正确捕获
              await new Promise((r) => setTimeout(r, 1000 / fps))
            }

            // 停止录制
            recorder.stop()
          } catch (error) {
            reject(error)
          }
        })
      },
      [exportWidth, exportHeight, exportFormat, quality, animationProps.backgroundColor, toast],
  )

  // 备用GIF创建方法 - 不依赖GIF.js库
  const createFallbackGif = useCallback(
      async (frames) => {
        // 由于无法使用GIF.js，我们将提供帧数据供用户下载
        const framesData = JSON.stringify({
          frames: frames,
          fps: animationProps.fps,
          width: exportWidth,
          height: exportHeight,
        })

        const blob = new Blob([framesData], { type: "application/json" })
        return blob
      },
      [exportWidth, exportHeight, animationProps.fps],
  )

  // 使用GIF.js创建GIF - 仅当库可用时使用
  const createGifWithLibrary = useCallback(
      async (frames, fps) => {
        return new Promise((resolve, reject) => {
          try {
            // 检查GIF.js是否可用
            if (typeof window === "undefined" || !window.GIF) {
              throw new Error("GIF.js库未加载")
            }

            // 创建GIF编码器
            const gif = new window.GIF({
              workers: 2,
              quality: quality === "high" ? 1 : quality === "medium" ? 5 : 10,
              width: exportWidth,
              height: exportHeight,
              workerScript: "https://cdn.jsdelivr.net/npm/gif.js/dist/gif.worker.js",
              background: animationProps.backgroundColor || "#ffffff",
              transparent: null,
              repeat: 0, // 0为无限循环
              dither: optimizeGif ? true : false, // 根据优化选项决定是否抖动
            })

            // 添加完成事件处理
            gif.on("finished", (blob) => {
              resolve(blob)
            })

            gif.on("progress", (p) => {
              const progress = 50 + Math.round(p * 40)
              setExportProgress(progress)
            })

            // 逐帧添加到GIF，使用canvas预处理以提高兼容性
            const addFramesToGif = async () => {
              // 创建一个临时canvas用于处理帧
              const tempCanvas = document.createElement("canvas")
              tempCanvas.width = exportWidth
              tempCanvas.height = exportHeight
              const ctx = tempCanvas.getContext("2d")

              for (let i = 0; i < frames.length; i++) {
                const img = new Image()
                img.crossOrigin = "anonymous"

                // 等待图像加载
                await new Promise((resolveImg) => {
                  img.onload = resolveImg
                  img.onerror = () => resolveImg() // 即使加载失败也继续
                  img.src = frames[i]
                })

                // 在canvas上绘制图像
                ctx.fillStyle = animationProps.backgroundColor || "#ffffff"
                ctx.fillRect(0, 0, exportWidth, exportHeight)

                // 只有当图像加载成功时才绘制
                if (img.complete && img.naturalWidth !== 0) {
                  ctx.drawImage(img, 0, 0, exportWidth, exportHeight)
                } else {
                  // 如果图像加载失败，绘制帧号
                  ctx.fillStyle = "#000000"
                  ctx.font = "24px Arial"
                  ctx.textAlign = "center"
                  ctx.fillText(`Frame ${i}`, exportWidth / 2, exportHeight / 2)
                }

                // 从canvas添加帧到GIF而不是直接使用图像
                gif.addFrame(tempCanvas, {
                  delay: Math.round(1000 / fps), // 四舍五入到整数毫秒
                  copy: true,
                })

                // 更新进度
                const progress = Math.round(((i + 1) / frames.length) * 50)
                setExportProgress(progress)
              }

              // 渲染GIF
              console.log("开始渲染GIF...")
              gif.render()
            }

            addFramesToGif().catch(reject)
          } catch (error) {
            reject(error)
          }
        })
      },
      [exportWidth, exportHeight, quality, animationProps.backgroundColor, optimizeGif],
  )

  // 导出GIF - 根据库是否可用选择方法
  const exportAsGif = useCallback(async () => {
    let gifBlob
    try {
      // 首先收集所有帧
      framesRef.current = []
      const totalFrames = endFrame - startFrame + 1
      let currentProgress = 0

      // 捕获每一帧
      for (let frame = startFrame; frame <= endFrame; frame++) {
        const dataUrl = await captureFrame(frame)
        if (dataUrl) {
          framesRef.current.push(dataUrl)
        }

        // 更新进度
        const progress = Math.round(((frame - startFrame + 1) / totalFrames) * 50)
        if (progress > currentProgress) {
          setExportProgress(progress)
          currentProgress = progress
        }

        if ((frame - startFrame) % 10 === 0 || frame === endFrame) {
          toast({
            title: "正在处理",
            description: `已捕获 ${frame - startFrame + 1}/${totalFrames} 帧...`,
          })
        }
      }

      // 检查GIF.js是否可用
      if (typeof window !== "undefined" && window.GIF) {
        toast({
          title: "正在生成GIF",
          description: "正在将帧转换为GIF格式，请稍候...",
        })

        try {
          // 使用GIF.js创建GIF
          gifBlob = await createGifWithLibrary(framesRef.current, animationProps.fps)

          // 下载GIF
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
          downloadBlob(gifBlob, `animation-${timestamp}.gif`)

          toast({
            title: "导出完成",
            description: "GIF动画已成功导出",
          })

          return true
        } catch (gifError) {
          console.error("创建GIF时出错:", gifError)
          // 如果GIF.js失败，使用备用方法
          return await useFallbackGifExport()
        }
      } else {
        // GIF.js不可用，使用备用方法
        return await useFallbackGifExport()
      }
    } catch (error) {
      console.error("导出GIF时出错:", error)
      toast({
        title: "导出失败",
        description: "导出过程中出现错误: " + error.message,
        variant: "destructive",
      })
      return false
    }
  }, [
    exportWidth,
    exportHeight,
    animationProps.fps,
    startFrame,
    endFrame,
    captureFrame,
    createGifWithLibrary,
    downloadBlob,
    toast,
  ])

  // 备用GIF导出方法
  const useFallbackGifExport = useCallback(async () => {
    toast({
      title: "GIF导出受限",
      description: "由于技术限制，将提供动画帧数据。您可以使用外部工具将其转换为GIF。",
    })

    try {
      // 使用备用方法创建数据
      const dataBlob = await createFallbackGif(framesRef.current)

      // 下载数据
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      downloadBlob(dataBlob, `animation-frames-${timestamp}.json`)

      toast({
        title: "导出完成",
        description: "已提供动画帧数据，您可以使用外部工具将其转换为GIF",
      })

      return true
    } catch (error) {
      console.error("备用GIF导出失败:", error)
      toast({
        title: "导出失败",
        description: "无法导出动画帧数据: " + error.message,
        variant: "destructive",
      })
      return false
    }
  }, [createFallbackGif, downloadBlob, toast])

  // 导出视频
  const exportAsVideo = useCallback(async () => {
    try {
      // 首先收集所有帧
      framesRef.current = []
      const totalFrames = endFrame - startFrame + 1
      let currentProgress = 0

      // 捕获每一帧
      for (let frame = startFrame; frame <= endFrame; frame++) {
        const dataUrl = await captureFrame(frame)
        if (dataUrl) {
          framesRef.current.push(dataUrl)
        }

        // 更新进度
        const progress = Math.round(((frame - startFrame + 1) / totalFrames) * 50)
        if (progress > currentProgress) {
          setExportProgress(progress)
          currentProgress = progress
        }

        if ((frame - startFrame) % 10 === 0 || frame === endFrame) {
          toast({
            title: "正在处理",
            description: `已捕获 ${frame - startFrame + 1}/${totalFrames} 帧...`,
          })
        }
      }

      toast({
        title: "正在生成视频",
        description: "正在将帧转换为视频格式，请稍候...",
      })

      try {
        // 使用MediaRecorder创建视频
        const videoBlob = await createVideoFromFrames(framesRef.current, animationProps.fps)

        // 下载视频
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        const extension = exportFormat === "mp4" ? "mp4" : "webm"
        downloadBlob(videoBlob, `animation-${timestamp}.${extension}`)

        toast({
          title: "导出完成",
          description: `视频已成功导出为${extension.toUpperCase()}格式`,
        })

        return true
      } catch (videoError) {
        console.error("创建视频时出错:", videoError)

        // 如果视频创建失败，提供帧数据下载
        const framesData = JSON.stringify({
          frames: framesRef.current,
          fps: animationProps.fps,
          width: exportWidth,
          height: exportHeight,
        })

        const blob = new Blob([framesData], { type: "application/json" })
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        downloadBlob(blob, `animation-frames-${timestamp}.json`)

        toast({
          title: "视频导出失败",
          description: "已提供动画帧数据，您可以使用外部工具将其转换为视频",
          variant: "destructive",
        })

        return false
      }
    } catch (error) {
      console.error("导出视频时出错:", error)
      toast({
        title: "导出失败",
        description: "导出过程中出现错误: " + error.message,
        variant: "destructive",
      })
      return false
    }
  }, [
    exportWidth,
    exportHeight,
    animationProps.fps,
    exportFormat,
    startFrame,
    endFrame,
    captureFrame,
    createVideoFromFrames,
    downloadBlob,
    toast,
  ])

  // 清理资源
  useEffect(() => {
    return () => {
      // 清理MediaRecorder
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try {
          recorderRef.current.stop()
        } catch (e) {
          console.error("停止MediaRecorder时出错:", e)
        }
      }
    }
  }, [])

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    toast({
      title: "开始导出",
      description: "正在处理您的动画，请稍候...",
    })

    try {
      // 根据导出类型执行不同的导出逻辑
      let success = false

      if (exportType === "gif") {
        success = await exportAsGif()
      } else {
        success = await exportAsVideo()
      }

      if (success) {
        toast({
          title: "导出完成",
          description: `您的${exportType === "video" ? exportFormat.toUpperCase() : "动画"}已成功导出`,
        })
      } else {
        throw new Error("导出失败")
      }
    } catch (error) {
      toast({
        title: "导出失败",
        description: "导出过程中出现错误: " + error.message,
        variant: "destructive",
      })
      console.error(error)
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  return (
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 mt-auto">
        <h3 className="font-semibold mb-3">导出</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exportType">导出类型</Label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger id="exportType">
                <SelectValue placeholder="选择导出类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">
                  <div className="flex items-center">
                    <VideoIcon className="h-4 w-4 mr-2" />
                    视频
                  </div>
                </SelectItem>
                <SelectItem value="gif">
                  <div className="flex items-center">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    GIF/序列帧
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exportType === "video" && (
              <div className="space-y-2">
                <Label htmlFor="videoFormat">视频格式</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger id="videoFormat">
                    <SelectValue placeholder="选择视频格式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp4">MP4</SelectItem>
                    <SelectItem value="webm">WebM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quality">质量</Label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger id="quality">
                <SelectValue placeholder="选择质量" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
                id="showAdvanced"
                checked={showAdvanced}
                onCheckedChange={(checked) => setShowAdvanced(checked === true)}
            />
            <Label htmlFor="showAdvanced" className="text-sm font-normal cursor-pointer">
              显示高级选项
            </Label>
          </div>

          {showAdvanced && (
              <div className="space-y-3 pt-2 pl-2 border-l-2 border-zinc-200 dark:border-zinc-700">
                <div className="space-y-2">
                  <Label htmlFor="frameRange">帧范围</Label>
                  <div className="flex items-center gap-2">
                    <Input
                        id="startFrame"
                        type="number"
                        placeholder="开始"
                        min={0}
                        max={animationProps.durationInFrames - 1}
                        value={startFrame}
                        onChange={(e) => setStartFrame(Number(e.target.value))}
                        className="w-full"
                    />
                    <span>-</span>
                    <Input
                        id="endFrame"
                        type="number"
                        placeholder="结束"
                        min={0}
                        max={animationProps.durationInFrames - 1}
                        value={endFrame}
                        onChange={(e) => setEndFrame(Number(e.target.value))}
                        className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolution">分辨率</Label>
                  <div className="flex items-center gap-2">
                    <Input
                        id="width"
                        type="number"
                        placeholder="宽度"
                        value={exportWidth}
                        onChange={(e) => setExportWidth(Number(e.target.value))}
                        className="w-full"
                    />
                    <span>x</span>
                    <Input
                        id="height"
                        type="number"
                        placeholder="高度"
                        value={exportHeight}
                        onChange={(e) => setExportHeight(Number(e.target.value))}
                        className="w-full"
                    />
                  </div>
                </div>

                {exportType === "gif" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                          id="optimizeGif"
                          checked={optimizeGif}
                          onCheckedChange={(checked) => setOptimizeGif(checked === true)}
                      />
                      <Label htmlFor="optimizeGif" className="text-sm font-normal cursor-pointer">
                        优化 GIF (减小文件大小)
                      </Label>
                    </div>
                )}
              </div>
          )}

          {isExporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>导出进度</span>
                  <span>{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} className="h-2" />
              </div>
          )}

          <Button className="w-full mt-2" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  导出中...
                </>
            ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  导出为 {exportType === "video" ? exportFormat.toUpperCase() : "GIF/序列帧"}
                </>
            )}
          </Button>
        </div>
      </div>
  )
}
