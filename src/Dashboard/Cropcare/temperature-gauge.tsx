"use client"

import { useEffect, useRef } from "react"

interface TemperatureGaugeProps {
  value: number
  min?: number
  max?: number
}

export function TemperatureGauge({ value, min = 0, max = 40 }: TemperatureGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set dimensions
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    // Draw background circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = "#f1f5f9"
    ctx.fill()

    // Draw temperature arc
    const startAngle = Math.PI
    const endAngle = 2 * Math.PI
    const valueAngle = startAngle + ((value - min) / (max - min)) * (endAngle - startAngle)

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, valueAngle)
    ctx.lineWidth = 20
    ctx.strokeStyle = "#16a34a"
    ctx.stroke()

    // Draw inner circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 30, 0, 2 * Math.PI)
    ctx.fillStyle = "white"
    ctx.fill()

    // Draw temperature text
    ctx.font = "bold 32px Arial"
    ctx.fillStyle = "#1e293b"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${value}°`, centerX, centerY - 10)

    // Draw label
    ctx.font = "14px Arial"
    ctx.fillStyle = "#64748b"
    ctx.fillText("Field Temperature", centerX, centerY + 20)
  }, [value, min, max])

  return (
    <div className="flex justify-center">
      <canvas ref={canvasRef} width={200} height={200} className="max-w-full" />
    </div>
  )
}
