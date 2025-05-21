import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export function YieldChart() {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
    maintainAspectRatio: false,
  }

  const labels = ["Wheat", "Corn", "Soybean", "Rice"]

  const data = {
    labels,
    datasets: [
      {
        label: "Current",
        data: [85, 78, 92, 65],
        backgroundColor: "rgba(34, 197, 94, 0.8)",
      },
      {
        label: "Previous",
        data: [70, 65, 80, 60],
        backgroundColor: "rgba(34, 197, 94, 0.4)",
      },
      {
        label: "Target",
        data: [90, 85, 95, 75],
        backgroundColor: "rgba(100, 116, 139, 0.8)",
      },
    ],
  }

  return (
    <div className="h-64">
      <Bar options={options} data={data} />
    </div>
  )
}
