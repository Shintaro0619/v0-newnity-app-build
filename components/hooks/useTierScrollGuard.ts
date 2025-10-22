"use client"
import { useEffect, useLayoutEffect, useRef } from "react"
import type React from "react"

/**
 * Tiers 配下の"入力中"に state 変化（=再レンダ）しても、スクロール位置を復元する。
 * - capture で input/focus をフック -> 直前の scrollY を記録
 * - 直後のレイアウトで scrollY を戻す
 */
export function useTierScrollGuard(containerRef: React.RefObject<HTMLElement>, deps: any[]) {
  const lastY = useRef(0)
  const editing = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onBeforeInput = () => {
      editing.current = true
      lastY.current = window.scrollY
    }
    // 入力/フォーカスの両方で監視（capture で先に拾う）
    el.addEventListener("input", onBeforeInput, { capture: true })
    el.addEventListener("focusin", onBeforeInput, { capture: true })
    return () => {
      el.removeEventListener("input", onBeforeInput, { capture: true })
      el.removeEventListener("focusin", onBeforeInput, { capture: true })
    }
  }, [containerRef])

  useLayoutEffect(() => {
    // Tiers 内で編集中にだけ復元
    const el = containerRef.current
    if (!el || !editing.current) return
    if (document.activeElement && el.contains(document.activeElement)) {
      // 2フレーム待ってレイアウト確定後に戻す（StrictMode対策）
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: lastY.current })
          editing.current = false
        })
      })
    } else {
      editing.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
