import { ArrowLeft } from 'lucide-react'

export default function FallbackDesignCanvas({ onBack }) {
  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          className="flex items-center gap-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          Volver
        </button>
        <h2 className="text-2xl font-bold ml-4 flex-grow text-center">
          Diseñador
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h3 className="text-xl font-semibold text-red-500 mb-4">Error al cargar el diseñador</h3>
        <p className="mb-4">Lo sentimos, hubo un problema al cargar las herramientas de diseño.</p>
        <p className="text-gray-600">Por favor, intenta recargar la página o contacta con soporte si el problema persiste.</p>
      </div>
    </div>
  )
}
