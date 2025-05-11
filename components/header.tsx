"use client"
import {
  MoonIcon,
  SunIcon,
  SaveIcon,
  FolderOpenIcon,
  UndoIcon,
  RedoIcon,
  SettingsIcon,
  HelpCircleIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from "next-themes"
import { useToast } from "@/components/ui/use-toast"

export function Header({ onUndo, onRedo, canUndo, canRedo }) {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  // 保存项目
  const handleSave = () => {
    try {
      // 获取当前项目状态
      const projectData = JSON.parse(localStorage.getItem("remotionEditorState") || "{}")

      // 更新保存时间
      projectData.lastSaved = new Date().toISOString()

      // 保存到本地存储
      localStorage.setItem("remotionEditorState", JSON.stringify(projectData))

      toast({
        title: "项目已保存",
        description: "您的项目已成功保存到本地",
      })
    } catch (error) {
      toast({
        title: "保存失败",
        description: "保存项目时出现错误",
        variant: "destructive",
      })
    }
  }

  // 打开项目
  const handleOpen = () => {

  }

  // 设置
  const handleSettings = () => {
    toast({
      title: "设置",
      description: "打开设置面板",
    })
  }

  // 帮助
  const handleHelp = () => {
    toast({
      title: "帮助",
      description: "查看使用教程和帮助文档",
    })
  }

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-2">
        <div className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
          rean-editor 动画编辑器
        </div>
      </div>

      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo}
                className={!canUndo ? "opacity-50 cursor-not-allowed" : ""}
              >
                <UndoIcon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>撤销</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRedo}
                disabled={!canRedo}
                className={!canRedo ? "opacity-50 cursor-not-allowed" : ""}
              >
                <RedoIcon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>重做</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleSave} style={{marginRight: 8}}>
                <SaveIcon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>保存项目</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" style={{marginRight: 18}}>
                <a href="https://flowmix.turntip.cn">文档编辑</a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>flowmix/docx多模态文档编辑器</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" style={{marginRight: 18}}>
                <a href="https://mindlink.turntip.cn">AI文档</a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>灵语AI文档编辑器</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" style={{marginRight: 18}}>
                <a href="https://mute.turntip.cn">多维表格</a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>flowmix/mute多维表格</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>切换主题</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </header>
  )
}
