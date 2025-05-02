import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

export interface Service {
  title: string;
  imageUrl: string;
  icon: string;
}

const ProductCard: React.FC<{ service: Service }> = ({ service }) => {
  return (
    <Card className="w-full h-full flex flex-col items-center justify-center p-4 bg-white shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-col items-center">
        <img
          src={service.icon}
          className="bg-green-800 rounded-full"
          alt=""
          onError={(e) => {
            console.error("Icon failed to load:", service.icon);
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <CardTitle className="text-lg font-semibold text-center">
          {service.title}
        </CardTitle>
        <img
          src={service.imageUrl}
          alt={service.title}
          className="w-32 h-32 object-cover rounded-md mb-4"
          onError={(e) => {
            console.error("Icon failed to load:", service.icon);
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </CardHeader>
    </Card>
  );
};

export default ProductCard;
