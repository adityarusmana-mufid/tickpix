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
    <div
      data-tauri-drag-region
      className="flex h-10 items-center justify-between bg-[#0f0f1a] border-b-2 border-[#2a2a3e] select-none shrink-0"
    >
      <span className="ml-3 font-pixel text-sm tracking-wider text-[#c0c0d0]">
        TickPix
      </span>
      <div className="flex">
        <button
          className="px-3 h-10 text-sm text-[#c0c0d0] hover:bg-[#2a2a3e] border-l-2 border-[#2a2a3e] font-pixel"
          onClick={handleMinimize}
        >
          −
        </button>
        <button
          className="px-3 h-10 text-sm text-[#c0c0d0] hover:bg-[#2a2a3e] border-l-2 border-[#2a2a3e] font-pixel"
          onClick={handleMaximize}
        >
          □
        </button>
        <button
          className="px-3 h-10 text-sm text-[#c0c0d0] hover:bg-[#2a2a3e] hover:text-red-400 border-l-2 border-[#2a2a3e] font-pixel"
          onClick={handleClose}
        >
          ×
        </button>
      </div>
    </div>
  )
}
