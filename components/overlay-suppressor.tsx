"use client"
import { useEffect } from "react"

const SELECTORS = [
  ".walletlink-ui-container",
  ".wcm-modal",
  "#wcm-modal",
  "#wcm-container",
  "plasma-csui",
  "#wc-modal",
  ".metamask-notification",
  ".phantom-iframe",
]

export function OverlaySuppressor() {
  useEffect(() => {
    const els = SELECTORS.flatMap((sel) => Array.from(document.querySelectorAll<HTMLElement>(sel)))
    els.forEach((el) => {
      el.style.pointerEvents = "none"
      el.style.zIndex = "1"
    })
  }, [])
  return null
}
