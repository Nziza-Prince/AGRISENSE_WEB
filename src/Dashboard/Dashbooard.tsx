import SideBar from './SideBar';
import Navbar from './Navbar';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUp, Leaf } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from "recharts"

interface Card{
  title:string
  metrics:string
  percentage:string
  icon:string
}

const Dashboard = () => {
  const data = [
    { name: "Maize plantations", value: 40, color: "#4D8D6E" },
    { name: "Bean plantations", value: 25, color: "#B5D9C3" },
    { name: "Rice plantations", value: 35, color: "#2D6A4F" },
  ]

  const cropGrowthData = [
    { month: "JAN", maize: 4, rice: 1 },
    { month: "FEB", maize: 6, rice: 3 },
    { month: "MAR", maize: 8, rice: 5 },
    { month: "APR", maize: 10, rice: 6 },
    { month: "MAY", maize: 9, rice: 7 },
    { month: "JUN", maize: 7, rice: 8 },
    { month: "JUL", maize: 6, rice: 8.35, highlight: true },
    { month: "AUG", maize: 7, rice: 7 },
    { month: "SEP", maize: 5, rice: 5 },
    { month: "OCT", maize: 3, rice: 3 },
    { month: "NOV", maize: 2, rice: 4 },
    { month: "DEC", maize: 1, rice: 2 },
  ]

  const activitiesData = [
    { month: "JAN", series1: 1, series2: 0.5 },
    { month: "FEB", series1: 3, series2: 2 },
    { month: "MAR", series1: 5, series2: 3 },
    { month: "APR", series1: 3, series2: 2.5 },
    { month: "MAY", series1: 4.5, series2: 4 },
    { month: "JUN", series1: 7, series2: 5, highlight: true },
  ]

  const cards:Card[] = [
    {title:"Total crops",metrics:"12 Types",percentage:"+2%",icon:'/assets/cardIcon.svg'},
    {title:"Total crops",metrics:"12 Types",percentage:"+2%",icon:'/assets/cardIcon.svg'},
    {title:"Total crops",metrics:"12 Types",percentage:"+2%",icon:'/assets/cardIcon.svg'},
    {title:"Total crops",metrics:"12 Types",percentage:"+2%",icon:'/assets/cardIcon.svg'}

  ]


  return (
    <div className="flex h-screen bg-gray-100">
      <SideBar />
      
      <main className="flex-1 flex flex-col overflow-auto bg-white">
        <Navbar />

    <div className="flex-1 p-6 bg-white">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0B6E4F]">Good Morning !</h1>
          <p className="text-gray-500 md:test-sm">Welcome back to the your current dashboard</p>
        </div>

        <div className="flex items-end gap-2 md:flex-col lg:flex-row">
          <div className="bg-white rounded-lg shadow-sm p-3 flex items-center">
            <span className="text-amber-500 mr-2">★</span>
            <span className="font-semibold">34°C</span>
            <span className="text-gray-500 ml-2 md:text-sm">- Sunny with clear skies</span>
          </div>
          <Button className="px-8 font-bold bg-[#377552] hover:bg-[#2D6A4F]">Explore more</Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Cards section - left side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 w-full lg:w-1/2 mt-12">

       {cards.map(card=>(

          <Card className="border shadow-sm h-[130px]">
            <CardContent className="">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm mb-1">{card.title}</p>
                  <p className="text-lg font-bold">{card.metrics}</p>
                  <p className="text-green-500 text-xs mt-1">
                    <ArrowUp className="inline h-3 w-3 mr-1" />
                    {card.percentage} in good state
                  </p>
                </div>
                <div className="bg-green-100 p-2 rounded-md">
                  <Leaf className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
       ))}
          {/* Total Crops Card */}
        </div>

        {/* Crop Harvest Summary Chart - right side */}
        <Card className="border shadow-sm lg:w-1/2">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Crop Harvest Summary</h2>
              <Tabs defaultValue="year">
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="year">Year</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={0} dataKey="value">
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ paddingLeft: "20px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
    </div>
    </div>
    <div className="flex flex-col lg:flex-row gap-6 mt-6 mx-5 bg-white">
        {/* Crop Growth Monitoring Chart */}
        <Card className="border shadow-sm lg:w-1/2">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Crop Growth Monitoring</h2>
              <Tabs defaultValue="year">
                <TabsList className="bg-gray-100">
                  <TabsTrigger value="year">Year</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-[#4D8D6E] rounded-sm"></div>
                <span className="text-sm text-gray-600">Maize</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-black rounded-sm"></div>
                <span className="text-sm text-gray-600">Rice</span>
              </div>
            </div>

            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cropGrowthData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="maizeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4D8D6E" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4D8D6E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, "dataMax + 1"]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="maize"
                    stroke="#4D8D6E"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rice"
                    stroke="#000000"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  {/* Highlight point */}
                  {cropGrowthData.map((entry, index) =>
                    entry.highlight ? (
                      <g key={`highlight-${index}`}>
                        <circle
                          cx={index * (100 / (cropGrowthData.length - 1)) + "%"}
                          cy={`${100 - (entry.rice / 11) * 100}%`}
                          r={6}
                          fill="#4D8D6E"
                        />
                        <rect
                          x={index * (100 / (cropGrowthData.length - 1)) - 2 + "%"}
                          y={`${100 - (entry.rice / 11) * 100 - 25}%`}
                          width="40"
                          height="20"
                          rx="4"
                          fill="#4D8D6E"
                        />
                        <text
                          x={index * (100 / (cropGrowthData.length - 1)) + 18 + "%"}
                          y={`${100 - (entry.rice / 11) * 100 - 12}%`}
                          textAnchor="middle"
                          fill="white"
                          fontSize="12"
                        >
                          83.5
                        </text>
                      </g>
                    ) : null,
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activities Chart */}
        <Card className="border shadow-sm lg:w-1/2">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Activities</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-[#4D8D6E] rounded-sm"></div>
                  <span className="text-sm text-gray-600">Series1</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-black rounded-sm"></div>
                  <span className="text-sm text-gray-600">Series2</span>
                </div>
              </div>
            </div>

            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activitiesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="series1Gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4D8D6E" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4D8D6E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, "dataMax + 1"]} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="series1"
                    stroke="#4D8D6E"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="url(#series1Gradient)"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="series2"
                    stroke="#000000"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  {/* Highlight point */}
                  {activitiesData.map((entry, index) =>
                    entry.highlight ? (
                      <g key={`highlight-${index}`}>
                        <circle
                          cx={index * (100 / (activitiesData.length - 1)) + "%"}
                          cy={`${100 - (entry.series1 / 8) * 100}%`}
                          r={6}
                          fill="#4D8D6E"
                        />
                        <rect
                          x={index * (100 / (activitiesData.length - 1)) - 2 + "%"}
                          y={`${100 - (entry.series1 / 8) * 100 - 25}%`}
                          width="40"
                          height="20"
                          rx="4"
                          fill="#4D8D6E"
                        />
                        <text
                          x={index * (100 / (activitiesData.length - 1)) + 18 + "%"}
                          y={`${100 - (entry.series1 / 8) * 100 - 12}%`}
                          textAnchor="middle"
                          fill="white"
                          fontSize="12"
                        >
                          7.2
                        </text>
                      </g>
                    ) : null,
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      </main>
    </div>
  );
};

export default Dashboard;