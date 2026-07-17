import { getCurrentWindow } from '@tauri-apps/api/window'

let win: ReturnType<typeof getCurrentWindow> | null = null
function getWin() {
  if (!win) {
    try { win = getCurrentWindow() } catch { return null }
  }
  return win
}

export default function TitleBar() {
  const handleMinimize = () => getWin()?.minimize()
  const handleMaximize = async () => {
    const w = getWin()
    if (!w) return
    const max = await w.isMaximized()
    if (max) w.unmaximize()
    else w.maximize()
  }
  const handleClose = () => getWin()?.close()

  return (
    <div className="flex h-10 items-center justify-between bg-[#a4c263] border-b-2 border-[#835a4d] select-none shrink-0">
      <div
        className="flex-1 self-stretch flex items-center cursor-default"
        onMouseDown={(e) => {
          const w = getWin()
          if (w) w.startDragging()
        }}
      >
        <span className="ml-3 font-pixel text-sm tracking-wider text-[#3a3028]">
          TickPix
        </span>
      </div>
      <div className="flex shrink-0">
        <button
          className="px-3 h-10 text-sm text-[#3a3028] hover:bg-[#c5996c] border-l-2 border-[#835a4d] font-pixel"
          onClick={handleMinimize}
        >
          −
        </button>
        <button
          className="px-3 h-10 text-sm text-[#3a3028] hover:bg-[#c5996c] border-l-2 border-[#835a4d] font-pixel"
          onClick={handleMaximize}
        >
          □
        </button>
        <button
          className="px-3 h-10 text-sm text-[#3a3028] hover:bg-[#c5996c] hover:text-[#3a3028] border-l-2 border-[#835a4d] font-pixel"
          onClick={handleClose}
        >
          ×
        </button>
      </div>
    </div>
  )
}
