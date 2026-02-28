import { Settings } from "lucide-react"

import "./style.css"

function IndexPopup() {
  return (
    <section className="popup w-[360px] h-[360px] flex flex-col">
      <section className="header h-[calc(100%/11)] shrink-0 flex items-center justify-end">
        <div className="px-3">
          <button className="p-1 rounded hover:opacity-70">
            <Settings size={16} />
          </button>
        </div>
      </section>
      <section className="content flex-1">
        <p>Data from background:</p>
      </section>
    </section>
  )
}

export default IndexPopup
