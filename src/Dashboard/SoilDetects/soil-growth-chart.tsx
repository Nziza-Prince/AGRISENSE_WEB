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
  type ChartData,
  type ChartOptions,
} from "chart.js"
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export function SoilGrowthChart() {
  const chartRef = useRef<ChartJS<"line">>(null);
  const [chartData, setChartData] = useState<ChartData<"line">>({
    datasets: [],
  })
  const [chartOptions, setChartOptions] = useState<ChartOptions<"line">>({})

  useEffect(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    setChartData({
      labels: months,
      datasets: [
        {
          label: "Maize",
          data: [10, 15, 25, 30, 45, 60, 55, 40, 30, 20, 15, 10],
          borderColor: "#16a34a",
          backgroundColor: "rgba(22, 163, 74, 0.1)",
          tension: 0.4,
          borderWidth: 2,
        },
        {
          label: "Potatoes",
          data: [20, 25, 30, 40, 50, 45, 35, 30, 25, 20, 15, 10],
          borderColor: "#0ea5e9",
          backgroundColor: "rgba(14, 165, 233, 0.1)",
          tension: 0.4,
          borderWidth: 2,
        },
        {
          label: "Carrots",
          data: [5, 10, 15, 25, 35, 40, 45, 50, 45, 35, 25, 15],
          borderColor: "#64748b",
          backgroundColor: "rgba(100, 116, 139, 0.1)",
          tension: 0.4,
          borderWidth: 2,
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
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: false,
          },
          ticks: {
            maxTicksLimit: 5,
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
