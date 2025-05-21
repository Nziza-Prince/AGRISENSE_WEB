"use client"

import { useEffect, useRef, useState } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export function WeatherForecastChart() {
  const chartRef = useRef<ChartJS>(null)
  const [chartData, setChartData] = useState<ChartData<"line">>({
    datasets: [],
  })
  const [chartOptions, setChartOptions] = useState<ChartOptions<"line">>({})

  useEffect(() => {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"]

    setChartData({
      labels: months,
      datasets: [
        {
          label: "2024",
          data: [6.2, 5.1, 4.8, 7.8, 6.5, 5.9],
          borderColor: "#16a34a",
          backgroundColor: (context) => {
            const ctx = context.chart.ctx
            const gradient = ctx.createLinearGradient(0, 0, 0, 300)
            gradient.addColorStop(0, "rgba(22, 163, 74, 0.5)")
            gradient.addColorStop(1, "rgba(22, 163, 74, 0)")
            return gradient
          },
          tension: 0.4,
          borderWidth: 2,
          fill: true,
        },
        {
          label: "2023",
          data: [5.8, 6.5, 7.2, 5.0, 6.8, 5.5],
          borderColor: "#94a3b8",
          backgroundColor: (context) => {
            const ctx = context.chart.ctx
            const gradient = ctx.createLinearGradient(0, 0, 0, 300)
            gradient.addColorStop(0, "rgba(148, 163, 184, 0.3)")
            gradient.addColorStop(1, "rgba(148, 163, 184, 0)")
            return gradient
          },
          tension: 0.4,
          borderWidth: 2,
          fill: true,
        },
      ],
    })

    setChartOptions({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          align: "end",
          labels: {
            usePointStyle: true,
            boxWidth: 8,
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.parsed.y} mm`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          grid: {
            display: false,
          },
          ticks: {
            maxTicksLimit: 6,
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
      elements: {
        point: {
          radius: 0,
          hoverRadius: 4,
        },
        line: {
          tension: 0.4,
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    })
  }, [])

  return (
    <div className="h-[300px] w-full">
      <Line ref={chartRef} options={chartOptions} data={chartData} />
    </div>
  )
}
