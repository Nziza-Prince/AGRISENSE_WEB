import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface YieldChartProps {
  /** Category labels (e.g. soil types or crops). */
  labels?: string[]
  /** Values per label. */
  values?: number[]
  seriesLabel?: string
}

export function YieldChart({
  labels = ["Wheat", "Corn", "Soybean", "Rice"],
  values = [85, 78, 92, 65],
  seriesLabel = "Count",
}: YieldChartProps) {
  const options = {
    responsive: true,
    plugins: { legend: { position: "bottom" as const } },
    scales: { y: { beginAtZero: true } },
    maintainAspectRatio: false,
  }

  const data = {
    labels: labels.length ? labels : ["", "", "", ""],
    datasets: [
      {
        label: seriesLabel,
        data: labels.length ? values : [0, 0, 0, 0],
        backgroundColor: "rgba(34, 197, 94, 0.8)",
      },
    ],
  }

  return (
    <div className="h-64">
      <Bar options={options} data={data} />
    </div>
  )
}
