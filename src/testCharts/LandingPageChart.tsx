import { LabelList, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
const chartData = [
  { crop: "Maize", harvest: 40, fill: "#4ade80" }, // Tailwind green-400
  { crop: "Bean", harvest: 25, fill: "#facc15" }, // Tailwind yellow-400
  { crop: "Rice", harvest: 35, fill: "#60a5fa" }, // Tailwind blue-400
]
const chartConfig = {
  harvest: {
    label: "Harvest",
  },
  maize: {
    label: "Maize",
    color: "hsl(var(--chart-1))",
  },
  bean: {
    label: "Bean",
    color: "hsl(var(--chart-2))",
  },
  rice: {
    label: "Rice",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const LandingPageChart = () => {
  return (
    <div>
      <Card>

        <CardContent >
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px] [&_.recharts-text]:fill-background"
          >
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent nameKey="harvest" hideLabel />}
              />
              <Pie data={chartData} dataKey="harvest">
                <LabelList
                  dataKey="crop"
                  position="inside"
                  stroke="none"
                  style={{ fill: "black", fontSize: 12 }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandingPageChart;
