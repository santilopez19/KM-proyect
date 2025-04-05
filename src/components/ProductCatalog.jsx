"use client"

import { useState } from "react"
import { Shirt, BadgeIcon as Hoodie, PocketIcon as PantaloneSimple, HardHatIcon as Hat } from "lucide-react"

export default function ProductCatalog({ onSelectGarment }) {
  const [filter, setFilter] = useState("all")

  const products = [
    { id: "tshirt-1", type: "tshirt", name: "Remera Básica", price: 2500, icon: <Shirt size={32} /> },
    { id: "tshirt-2", type: "tshirt", name: "Remera Premium", price: 3200, icon: <Shirt size={32} /> },
    { id: "hoodie-1", type: "hoodie", name: "Buzo Clásico", price: 5000, icon: <Hoodie size={32} /> },
    { id: "hoodie-2", type: "hoodie", name: "Buzo con Capucha", price: 5800, icon: <Hoodie size={32} /> },
    { id: "pants-1", type: "pants", name: "Pantalón Deportivo", price: 4200, icon: <PantaloneSimple size={32} /> },
    { id: "pants-2", type: "pants", name: "Pantalón Cargo", price: 4800, icon: <PantaloneSimple size={32} /> },
    { id: "cap-1", type: "cap", name: "Gorra Plana", price: 1800, icon: <Hat size={32} /> },
    { id: "cap-2", type: "cap", name: "Gorra Trucker", price: 2000, icon: <Hat size={32} /> },
  ]

  const filteredProducts = filter === "all" ? products : products.filter((product) => product.type === filter)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Nuestros Productos</h1>

      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              filter === "all" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter("tshirt")}
            className={`px-4 py-2 text-sm font-medium ${
              filter === "tshirt" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Remeras
          </button>
          <button
            onClick={() => setFilter("hoodie")}
            className={`px-4 py-2 text-sm font-medium ${
              filter === "hoodie" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Buzos
          </button>
          <button
            onClick={() => setFilter("pants")}
            className={`px-4 py-2 text-sm font-medium ${
              filter === "pants" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Pantalones
          </button>
          <button
            onClick={() => setFilter("cap")}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              filter === "cap" ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Gorras
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-48 bg-gray-100 flex items-center justify-center">{product.icon}</div>
            <div className="p-4">
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-gray-600 mb-4">${product.price}</p>
              <div className="flex space-x-2">
                <button
                  className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                  onClick={() => onSelectGarment(product.type)}
                >
                  Personalizar
                </button>
                <button className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors">
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

