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
import type { DailyWeather } from "@/lib/weather"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface WeatherForecastChartProps {
  daily: DailyWeather[]
}

export function WeatherForecastChart({ daily }: WeatherForecastChartProps) {
  const labels = daily.length
    ? daily.map((d) => new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }))
    : Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i)
        return d.toLocaleDateString("en-US", { weekday: "short" })
      })

  const data: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Max °C",
        data: daily.map((d) => d.tempMax),
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
        label: "Min °C",
        data: daily.map((d) => d.tempMin),
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
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: { usePointStyle: true, boxWidth: 8 },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}°C`,
        },
      },
    },
    scales: {
      y: {
        grid: { display: false },
        ticks: { maxTicksLimit: 6, callback: (v) => `${v}°` },
      },
      x: { grid: { display: false } },
    },
    elements: {
      point: { radius: 0, hoverRadius: 4 },
      line: { tension: 0.4 },
    },
    interaction: { mode: "nearest", axis: "x", intersect: false },
  }


  return (
    <div className="h-[300px] w-full">
      <Line options={options} data={data} />
    </div>
  )
}
