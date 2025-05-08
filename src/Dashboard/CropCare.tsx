import React from 'react';
import SideBar from './SideBar';
import Navbar from './Navbar';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUp, Calendar, Leaf, Scale } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from "recharts"

const CropCare = () => {
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


  return (
    <div className="flex h-screen bg-gray-100">
      <SideBar />
      
      <main className="flex-1 flex flex-col overflow-auto bg-white">
        <Navbar />

        <h1>CropCare</h1>

       </main>
    </div>
  );
};

export default CropCare;