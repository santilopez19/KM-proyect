"use client"

import { useState } from "react"
import DesignCanvas from "./components/DesignCanvas"
import { Shirt, BadgeIcon as Hoodie, PocketIcon as PantaloneSimple, HardHatIcon as Hat } from "lucide-react"
import "./App.css" // Import the CSS but we'll override some styles

export default function App() {
  const [selectedGarment, setSelectedGarment] = useState(null)
  const [activeTab, setActiveTab] = useState("home")

  // Create placeholder images for garments
  const createPlaceholderImage = (text) => {
    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 500
    const ctx = canvas.getContext("2d")

    // Fill background
    ctx.fillStyle = "#f0f0f0"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw outline
    ctx.strokeStyle = "#cccccc"
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)

    // Add text
    ctx.fillStyle = "#666666"
    ctx.font = "bold 24px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)

    return canvas.toDataURL()
  }

  const renderHome = () => (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <section className="mb-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Diseñá tu Estilo Personalizado</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Creá prendas únicas con nuestro diseñador online. Agregá textos, imágenes y elegí colores para hacer
            realidad tu visión.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {[
            { id: "tshirt", name: "Remera", icon: <Shirt size={32} /> },
            { id: "hoodie", name: "Buzo", icon: <Hoodie size={32} /> },
            { id: "pants", name: "Pantalón", icon: <PantaloneSimple size={32} /> },
            { id: "cap", name: "Gorra", icon: <Hat size={32} /> },
          ].map((garment) => (
            <div
              key={garment.id}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
              onClick={() => setSelectedGarment(garment.id)}
            >
              <div className="h-48 bg-gray-100 flex items-center justify-center">{garment.icon}</div>
              <div className="p-4 text-center">
                <h3 className="text-lg font-semibold">{garment.name}</h3>
                <button className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors w-full">
                  Diseñar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">¿Cómo Funciona?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-500">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Elegí tu Prenda</h3>
            <p className="text-gray-600">
              Seleccioná entre remeras, buzos, pantalones y gorras para comenzar tu diseño.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-500">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Personalizá</h3>
            <p className="text-gray-600">Agregá textos, imágenes y elegí colores para crear un diseño único.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-500">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Descargá o Compartí</h3>
            <p className="text-gray-600">Guardá tu diseño como imagen o envialo directamente para producción.</p>
          </div>
        </div>
      </section>
    </div>
  )

  const renderHeader = () => (
    <header className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="font-bold text-xl">KM Diseños</div>
          </div>

          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              <li>
                <button
                  className={`px-3 py-2 ${activeTab === "home" ? "text-blue-500 font-medium" : "text-gray-600 hover:text-blue-500"}`}
                  onClick={() => {
                    setActiveTab("home")
                    setSelectedGarment(null)
                  }}
                >
                  Inicio
                </button>
              </li>
              <li>
                <button
                  className={`px-3 py-2 ${activeTab === "design" ? "text-blue-500 font-medium" : "text-gray-600 hover:text-blue-500"}`}
                  onClick={() => {
                    setActiveTab("design")
                    setSelectedGarment("tshirt")
                  }}
                >
                  Diseñar
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )

  const renderFooter = () => (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">KM Diseños</h3>
            <p className="text-gray-300">Personalizamos tus ideas y las convertimos en prendas únicas.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contacto</h3>
            <p className="text-gray-300">Email: info@kmdisenos.com</p>
            <p className="text-gray-300">Teléfono: (123) 456-7890</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Seguinos</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a href="#" className="text-gray-300 hover:text-white">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-6 text-center text-sm text-gray-300">
          &copy; {new Date().getFullYear()} KM Diseños. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )

  return (
    // Override the default App.css styles with a full-width container
    <div className="min-h-screen flex flex-col bg-gray-50" style={{ maxWidth: "100%", padding: 0, margin: 0 }}>
      {renderHeader()}

      <main className="flex-grow">
        {selectedGarment ? (
          <DesignCanvas garment={selectedGarment} onBack={() => setSelectedGarment(null)} />
        ) : (
          renderHome()
        )}
      </main>

      {!selectedGarment && renderFooter()}
    </div>
  )
}

