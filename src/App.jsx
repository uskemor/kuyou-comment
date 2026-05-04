import { useEffect, useRef, useState } from 'react'
import styles from './App.module.css'

const MESSAGES = [
  '流れていきました',
  '波に乗って消えていきました',
  '水平線の向こうへ',
  '潮が連れていきました',
]

// 画面状態: 'idle' | 'flowing' | 'done'
export default function App() {
  const canvasRef  = useRef(null)
  const tRef       = useRef(0)
  const rafRef     = useRef(null)

  const [screen, setScreen]     = useState('idle')
  const [text, setText]         = useState('')
  const [floatText, setFloat]   = useState('')
  const [doneMsg, setDoneMsg]   = useState('')
  const [floatVisible, setFloatVisible] = useState(false)
  const [floatFlow, setFloatFlow]       = useState(false)
  const [doneVisible, setDoneVisible]   = useState(false)
  const [formVisible, setFormVisible]   = useState(true)

  // 波アニメーション
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    let W, H

    function resize() {
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width  = W
      canvas.height = H
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    function draw() {
      ctx.clearRect(0, 0, W, H)
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const base   = isDark ? '180,200,220' : '80,120,160'
      for (let layer = 0; layer < 3; layer++) {
        const amp   = 10 - layer * 2
        const speed = 0.004 + layer * 0.0015
        const yBase = H * (0.3 + layer * 0.2)
        const alpha = 0.4 - layer * 0.1
        ctx.beginPath()
        ctx.moveTo(0, H)
        for (let x = 0; x <= W; x += 4) {
          const y = yBase
            + Math.sin(x * 0.015 + tRef.current * speed * 60 + layer) * amp
            + Math.sin(x * 0.025 + tRef.current * speed * 40 + layer * 2) * (amp * 0.5)
          ctx.lineTo(x, y)
        }
        ctx.lineTo(W, H)
        ctx.closePath()
        ctx.fillStyle = `rgba(${base},${alpha})`
        ctx.fill()
      }
      tRef.current++
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  function flow() {
    if (!text.trim()) return
    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]

    // フォームをフェードアウト
    setFormVisible(false)

    setTimeout(() => {
      setFloat(text.trim())
      setScreen('flowing')
      setFloatVisible(false)
      setFloatFlow(false)

      // テキストをフェードイン
      requestAnimationFrame(() => {
        setTimeout(() => setFloatVisible(true), 30)

        // 2秒後に海へ流す
        setTimeout(() => {
          setFloatFlow(true)

          // 2.8秒後に完了メッセージ
          setTimeout(() => {
            setDoneMsg(msg)
            setDoneVisible(true)

            // 3秒後にリセット
            setTimeout(() => {
              setDoneVisible(false)
              setTimeout(() => {
                setText('')
                setFloat('')
                setScreen('idle')
                setFormVisible(true)
              }, 1200)
            }, 3000)
          }, 2800)
        }, 2000)
      })
    }, 700)
  }

  return (
    <div className={styles.wrap}>
      <h1>コメント供養</h1>
      <canvas
        ref={canvasRef}
        className={styles.sea}
        aria-hidden="true"
      />

      {/* フォーム */}
      <div
        className={styles.inner}
        style={{ opacity: formVisible ? 1 : 0, transition: 'opacity 0.6s', display: screen === 'idle' || !formVisible ? 'block' : 'none' }}
      >
        <p className={styles.label}>誰にも言えなかったこと</p>
        <textarea
          className={styles.textarea}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="書いて海に流しましょう"
          maxLength={200}
        />
        <br />
        <button
          className={styles.sendBtn}
          onClick={flow}
          disabled={!text.trim()}
        >
          海に流す
        </button>
      </div>

      {/* 流れるテキスト */}
      {screen === 'flowing' && (
        <div
          className={styles.floatingText}
          style={{
            opacity:   floatVisible && !floatFlow ? 1 : 0,
            transform: floatFlow
              ? 'translate(-50%, 120%) scale(0.7)'
              : 'translate(-50%, -50%)',
            transition: floatFlow
              ? 'transform 3.5s cubic-bezier(0.25,0.46,0.45,0.94), opacity 3s ease-in 0.5s'
              : 'opacity 1s',
          }}
        >
          {floatText}
        </div>
      )}

      {/* 完了メッセージ */}
      <div
        className={styles.doneMsg}
        style={{
          opacity: doneVisible ? 1 : 0,
          display: doneVisible || doneMsg ? 'block' : 'none',
        }}
      >
        {doneMsg}
      </div>
      <footer className={styles.footer}>
        <small>&copy; 2026 uskemor</small>
      </footer>
    </div>
  )
}
