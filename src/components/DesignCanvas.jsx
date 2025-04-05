"use client"

import { useEffect, useRef, useState } from "react"
import { fabric } from "fabric" // Correct import for fabric.js
import {
  Bold,
  Italic,
  Trash2,
  Type,
  ImageIcon,
  Download,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Palette,
  RotateCcw,
  Move,
  ArrowLeft,
  Pencil,
  Eraser,
  RotateCw,
  CuboidIcon as Cube,
  User,
} from "lucide-react"

export default function DesignCanvas({ garment, onBack }) {
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const canvasContainerRef = useRef(null)
  const [canvas, setCanvas] = useState(null)
  const [text, setText] = useState("")
  const [fontSize, setFontSize] = useState(20)
  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(false)
  const [textColor, setTextColor] = useState("#000000")
  const [garmentColor, setGarmentColor] = useState("#ffffff")
  const [hasSelection, setHasSelection] = useState(false)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [zoom, setZoom] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [drawingMode, setDrawingMode] = useState(false)
  const [brushColor, setBrushColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState(5)
  const [is3DView, setIs3DView] = useState(false)
  const [rotationAngle, setRotationAngle] = useState(0)
  const [showMannequin, setShowMannequin] = useState(false)
  const [selectedObject, setSelectedObject] = useState(null)
  const [backgroundImage, setBackgroundImage] = useState(null)

  // Define garment images with correct paths for your project structure
  const images = {
    tshirt: "/tshirt.png",
    hoodie: "/hoodie.png",
    pants: "/pants.png",
    cap: "/cap.png",
  }

  // Save canvas state to history
  const saveToHistory = (canvasInstance) => {
    if (!canvasInstance) return

    try {
      // Get current canvas state
      const json = canvasInstance.toJSON(["selectable", "hasControls", "hasBorders"])

      // If we're not at the end of the history, remove future states
      if (historyIndex < history.length - 1) {
        setHistory(history.slice(0, historyIndex + 1))
      }

      // Add new state to history
      setHistory([...history.slice(0, historyIndex + 1), json])
      setHistoryIndex(historyIndex + 1)
    } catch (err) {
      console.error("Error saving to history:", err)
    }
  }

  // Initialize canvas
  useEffect(() => {
    // Make sure fabric is available before creating canvas
    if (typeof window === "undefined" || !window.fabric) {
      console.error("Fabric.js not loaded properly")
      setError("Error loading design tools")
      setIsLoading(false)
      return
    }

    try {
      // Dispose of any existing canvas
      if (canvas) {
        canvas.dispose()
      }

      // Create canvas with larger dimensions
      const newCanvas = new fabric.Canvas(canvasRef.current, {
        width: 600,
        height: 700,
        backgroundColor: "#f8f8f8",
        preserveObjectStacking: true,
        isDrawingMode: false,
        selection: true, // Enable selection
        selectionBorderColor: "rgba(0,0,255,0.3)",
        selectionLineWidth: 1,
        interactive: true, // Ensure canvas is interactive
        hoverCursor: "pointer", // Show pointer cursor on hover
        moveCursor: "move", // Show move cursor when moving objects
      })

      // Set up the drawing brush
      const pencilBrush = new fabric.PencilBrush(newCanvas)
      pencilBrush.color = brushColor
      pencilBrush.width = brushSize
      newCanvas.freeDrawingBrush = pencilBrush

      // Event listeners for object selection
      newCanvas.on("selection:created", (e) => {
        console.log("Selection created:", e.selected)
        setHasSelection(true)
        setSelectedObject(e.selected[0])
      })

      newCanvas.on("selection:updated", (e) => {
        console.log("Selection updated:", e.selected)
        setHasSelection(true)
        setSelectedObject(e.selected[0])
      })

      newCanvas.on("selection:cleared", () => {
        console.log("Selection cleared")
        setHasSelection(false)
        setSelectedObject(null)
      })

      // Event listener for object modifications
      newCanvas.on("object:modified", (e) => {
        console.log("Object modified:", e.target)
        saveToHistory(newCanvas)
      })

      newCanvas.on("object:added", (e) => {
        console.log("Object added:", e.target)
        saveToHistory(newCanvas)
      })

      // Mouse events for debugging
      newCanvas.on("mouse:down", (options) => {
        console.log("Mouse down:", options.e)
        if (options.target) {
          console.log("Clicked on object:", options.target)
        } else {
          console.log("Clicked on canvas")
        }
      })

      newCanvas.on("object:moving", (options) => {
        console.log("Object moving:", options.target)
      })

      setCanvas(newCanvas)

      // Load the selected garment template
      if (garment && images[garment]) {
        setIsLoading(true)
        setError(null)

        console.log("Loading image:", images[garment]) // Debug log

        fabric.Image.fromURL(
          images[garment],
          (img) => {
            if (!img) {
              console.error("Image is null or undefined")
              setError("Failed to load garment image")
              setIsLoading(false)
              return
            }

            console.log("Image loaded successfully:", img) // Debug log

            // Scale the image to fit the canvas
            const scale = Math.min(newCanvas.width / img.width, newCanvas.height / img.height) * 0.8
            img.scale(scale)

            // Center the image on the canvas
            img.set({
              left: newCanvas.width / 2,
              top: newCanvas.height / 2,
              originX: "center",
              originY: "center",
              selectable: false,
              evented: false,
              excludeFromExport: false,
            })

            // Set the image as the canvas background
            newCanvas.setBackgroundImage(img, newCanvas.renderAll.bind(newCanvas), {
              crossOrigin: "anonymous",
            })

            // Store reference to background image
            setBackgroundImage(img)

            // Apply initial color
            applyGarmentColor(newCanvas, garmentColor)

            // Save initial state to history
            saveToHistory(newCanvas)
            setIsLoading(false)
          },
          { crossOrigin: "anonymous" },
        )
      }

      return () => {
        newCanvas.dispose()
      }
    } catch (err) {
      console.error("Error initializing canvas:", err)
      setError("Failed to initialize design canvas")
      setIsLoading(false)
    }
  }, [garment]) // Only re-initialize when garment changes

  // Update brush when color or size changes
  useEffect(() => {
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor
      canvas.freeDrawingBrush.width = brushSize
    }
  }, [canvas, brushColor, brushSize])

  // Toggle drawing mode
  useEffect(() => {
    if (canvas) {
      canvas.isDrawingMode = drawingMode

      // Update cursor style
      if (drawingMode) {
        canvas.defaultCursor = "crosshair"
        if (canvasContainerRef.current) {
          canvasContainerRef.current.classList.add("drawing")
        }
      } else {
        canvas.defaultCursor = "default"
        if (canvasContainerRef.current) {
          canvasContainerRef.current.classList.remove("drawing")
        }
      }

      canvas.renderAll()
    }
  }, [canvas, drawingMode])

  // Apply color to garment
  const applyGarmentColor = (canvasInstance, color) => {
    if (!canvasInstance) return

    const bgImage = canvasInstance.backgroundImage
    if (bgImage) {
      bgImage.filters = [
        new fabric.Image.filters.BlendColor({
          color: color,
          mode: "tint",
          opacity: 0.5,
        }),
      ]
      bgImage.applyFilters()
      canvasInstance.renderAll()
    }
  }

  // Change garment color
  const changeGarmentColor = (color) => {
    setGarmentColor(color)
    applyGarmentColor(canvas, color)
    saveToHistory(canvas)
  }

  // Remove selected object
  const removeSelected = () => {
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      // Make sure we're not removing the background image
      if (activeObject !== canvas.backgroundImage) {
        console.log("Removing object:", activeObject)
        canvas.remove(activeObject)
        canvas.discardActiveObject()
        canvas.renderAll()
        setHasSelection(false)
        setSelectedObject(null)
        saveToHistory(canvas)
      } else {
        console.log("Attempted to remove background image, ignoring")
      }
    }
  }

  // Add text to design
  const addText = () => {
    if (!canvas || !text.trim()) return

    try {
      // Create text object with proper settings for movement
      const textObject = new fabric.IText(text, {
        left: canvas.width / 2,
        top: canvas.height / 2,
        fontSize: fontSize,
        fill: textColor,
        fontWeight: bold ? "bold" : "normal",
        fontStyle: italic ? "italic" : "normal",
        originX: "center",
        originY: "center",
        selectable: true,
        editable: true,
        hasControls: true,
        hasBorders: true,
        lockUniScaling: false,
        transparentCorners: false,
        cornerColor: "rgba(0,0,255,0.5)",
        borderColor: "#2196F3",
        cornerSize: 10,
        padding: 5,
        cornerStyle: "circle",
        borderDashArray: [3, 3],
      })

      // Add the text to the canvas
      canvas.add(textObject)

      // Explicitly set as active object
      canvas.setActiveObject(textObject)
      canvas.renderAll()

      // Log for debugging
      console.log("Added text object:", textObject)
      console.log("Is selectable:", textObject.selectable)

      setText("")
      saveToHistory(canvas)
    } catch (err) {
      console.error("Error adding text:", err)
    }
  }

  // Upload image
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file || !canvas) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        fabric.Image.fromURL(event.target.result, (img) => {
          // Resize image if it's too large
          if (img.width > 200) {
            img.scaleToWidth(200)
          }

          img.set({
            left: canvas.width / 2,
            top: canvas.height / 2,
            originX: "center",
            originY: "center",
            selectable: true,
            hasControls: true,
            hasBorders: true,
            cornerColor: "rgba(0,0,255,0.5)",
            borderColor: "#2196F3",
            cornerSize: 10,
            padding: 5,
            cornerStyle: "circle",
          })

          canvas.add(img)
          canvas.setActiveObject(img)
          canvas.renderAll()

          // Log for debugging
          console.log("Added image:", img)
          console.log("Is selectable:", img.selectable)

          saveToHistory(canvas)
        })
      } catch (err) {
        console.error("Error uploading image:", err)
      }
    }
    reader.readAsDataURL(file)

    // Reset file input
    e.target.value = null
  }

  // Download design
  const downloadDesign = () => {
    if (!canvas) return
    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2, // Higher resolution
    })
    const link = document.createElement("a")
    link.href = dataURL
    link.download = `${garment}-design.png`
    link.click()
  }

  // Undo action
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)

      try {
        canvas.loadFromJSON(history[newIndex], () => {
          // Restore background image if needed
          if (canvas.backgroundImage !== backgroundImage) {
            canvas.setBackgroundImage(backgroundImage, canvas.renderAll.bind(canvas))
          }
          canvas.renderAll()
        })
      } catch (err) {
        console.error("Error during undo:", err)
      }
    }
  }

  // Redo action
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)

      try {
        canvas.loadFromJSON(history[newIndex], () => {
          // Restore background image if needed
          if (canvas.backgroundImage !== backgroundImage) {
            canvas.setBackgroundImage(backgroundImage, canvas.renderAll.bind(canvas))
          }
          canvas.renderAll()
        })
      } catch (err) {
        console.error("Error during redo:", err)
      }
    }
  }

  // Zoom in
  const zoomIn = () => {
    if (zoom < 2) {
      const newZoom = zoom + 0.1
      setZoom(newZoom)
      canvas.setZoom(newZoom)
      canvas.renderAll()
    }
  }

  // Zoom out
  const zoomOut = () => {
    if (zoom > 0.5) {
      const newZoom = zoom - 0.1
      setZoom(newZoom)
      canvas.setZoom(newZoom)
      canvas.renderAll()
    }
  }

  // Bring selected object to front
  const bringToFront = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.bringToFront(activeObject)
      canvas.renderAll()
      saveToHistory(canvas)
    }
  }

  // Send selected object to back
  const sendToBack = () => {
    if (!canvas) return
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.sendToBack(activeObject)
      canvas.renderAll()
      saveToHistory(canvas)
    }
  }

  // Toggle drawing mode
  const toggleDrawingMode = () => {
    setDrawingMode(!drawingMode)
  }

  // Clear all drawings
  const clearCanvas = () => {
    if (!canvas) return

    try {
      // Keep the background image but remove all objects
      const bgImage = canvas.backgroundImage

      // Remove all objects except background
      const objects = canvas.getObjects()
      objects.forEach((obj) => {
        canvas.remove(obj)
      })

      // Make sure background is still there
      if (!canvas.backgroundImage && bgImage) {
        canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas))
      }

      // Apply color
      applyGarmentColor(canvas, garmentColor)

      canvas.renderAll()
      saveToHistory(canvas)
    } catch (err) {
      console.error("Error clearing canvas:", err)
    }
  }

  // Toggle 3D view
  const toggle3DView = () => {
    setIs3DView(!is3DView)
    setShowMannequin(false)
  }

  // Toggle mannequin view
  const toggleMannequinView = () => {
    setShowMannequin(!showMannequin)
    if (!is3DView) setIs3DView(true)
  }

  // Rotate 3D view
  const rotate3D = (direction) => {
    const newAngle = direction === "left" ? rotationAngle - 15 : rotationAngle + 15
    setRotationAngle(newAngle)
  }

  // Get 3D transform style
  const get3DStyle = () => {
    if (!is3DView) return {}

    return {
      transform: `perspective(1000px) rotateY(${rotationAngle}deg)`,
      transition: "transform 0.5s ease",
    }
  }

  // Add a simple shape for testing
  const addTestShape = () => {
    if (!canvas) return

    try {
      const rect = new fabric.Rect({
        left: canvas.width / 2,
        top: canvas.height / 2,
        fill: "red",
        width: 50,
        height: 50,
        originX: "center",
        originY: "center",
        selectable: true,
        hasControls: true,
        hasBorders: true,
      })

      canvas.add(rect)
      canvas.setActiveObject(rect)
      canvas.renderAll()
      saveToHistory(canvas)

      console.log("Added test shape:", rect)
    } catch (err) {
      console.error("Error adding test shape:", err)
    }
  }

  // Fix canvas issues
  const fixCanvas = () => {
    if (!canvas) return

    try {
      // Re-enable selection on all objects
      canvas.getObjects().forEach((obj) => {
        obj.set({
          selectable: true,
          hasControls: true,
          hasBorders: true,
          evented: true,
        })
      })

      // Make sure background is not selectable
      if (canvas.backgroundImage) {
        canvas.backgroundImage.set({
          selectable: false,
          evented: false,
        })
      }

      canvas.renderAll()
      console.log("Canvas fixed, all objects should be selectable now")
    } catch (err) {
      console.error("Error fixing canvas:", err)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-2">
      <div className="flex items-center mb-4">
        <button
          className="flex items-center gap-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          Volver
        </button>
        <h2 className="text-2xl font-bold ml-4 flex-grow text-center">
          Diseñando{" "}
          {garment === "tshirt" ? "Remera" : garment === "hoodie" ? "Buzo" : garment === "pants" ? "Pantalón" : "Gorra"}
        </h2>
      </div>

      {/* New Layout with central canvas and tools on the sides */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left Sidebar - Tools */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow-md p-3 order-2 md:order-1 flex flex-col">
          <h3 className="font-semibold text-lg mb-3 border-b pb-2">Herramientas</h3>

          {/* Accordion for tools */}
          <div className="space-y-3 flex-grow overflow-y-auto">
            {/* Text tools */}
            <div className="border rounded-md p-2">
              <h4 className="font-medium mb-2 flex items-center gap-1">
                <Type size={16} /> Texto
              </h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Escribí tu texto"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm"
                />

                <div className="flex gap-1 items-center">
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="border rounded-md p-1 w-14 text-sm"
                    min="8"
                    max="72"
                  />
                  <button
                    className={`p-1 rounded-md ${bold ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                    onClick={() => setBold(!bold)}
                    title="Negrita"
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    className={`p-1 rounded-md ${italic ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                    onClick={() => setItalic(!italic)}
                    title="Cursiva"
                  >
                    <Italic size={14} />
                  </button>
                  <div className="flex items-center">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-6 h-6 border rounded cursor-pointer"
                      title="Color de texto"
                    />
                  </div>
                </div>

                <button
                  className="w-full px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors text-sm"
                  onClick={addText}
                >
                  Agregar Texto
                </button>
              </div>
            </div>

            {/* Drawing tools */}
            <div className="border rounded-md p-2">
              <h4 className="font-medium mb-2 flex items-center gap-1">
                <Pencil size={16} /> Dibujo
              </h4>
              <div className="space-y-2">
                <div className="flex gap-1 items-center">
                  <button
                    className={`p-1 rounded-md ${drawingMode ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                    onClick={toggleDrawingMode}
                    title={drawingMode ? "Desactivar dibujo" : "Activar dibujo"}
                  >
                    {drawingMode ? <Move size={14} /> : <Pencil size={14} />}
                  </button>
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-6 h-6 border rounded cursor-pointer"
                    title="Color de pincel"
                  />
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="flex-grow"
                    title="Tamaño de pincel"
                  />
                  <span className="text-xs">{brushSize}px</span>
                </div>
                <button
                  className="w-full px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors text-sm"
                  onClick={clearCanvas}
                >
                  <Eraser size={14} className="inline mr-1" /> Limpiar Todo
                </button>
              </div>
            </div>

            {/* Image upload */}
            <div className="border rounded-md p-2">
              <h4 className="font-medium mb-2 flex items-center gap-1">
                <ImageIcon size={16} /> Imágenes
              </h4>
              <button
                className="w-full px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors text-sm"
                onClick={() => fileInputRef.current.click()}
              >
                Subir Imagen
              </button>
              <input ref={fileInputRef} type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
            </div>

            {/* Garment color */}
            <div className="border rounded-md p-2">
              <h4 className="font-medium mb-2 flex items-center gap-1">
                <Palette size={16} /> Color de la Prenda
              </h4>
              <div className="flex flex-wrap gap-1">
                {[
                  "#ffffff",
                  "#000000",
                  "#ff0000",
                  "#0000ff",
                  "#ffff00",
                  "#00ff00",
                  "#ff00ff",
                  "#00ffff",
                  "#808080",
                ].map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded-full border ${garmentColor === color ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => changeGarmentColor(color)}
                    title={`Color ${color}`}
                  />
                ))}
                <input
                  type="color"
                  value={garmentColor}
                  onChange={(e) => changeGarmentColor(e.target.value)}
                  className="w-6 h-6 border rounded cursor-pointer"
                  title="Color personalizado"
                />
              </div>
            </div>

            {/* Debug tools */}
            <div className="border rounded-md p-2 bg-gray-50">
              <h4 className="font-medium mb-2 flex items-center gap-1">Herramientas de prueba</h4>
              <div className="space-y-2">
                <button
                  className="w-full px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-md transition-colors text-sm"
                  onClick={addTestShape}
                >
                  Agregar forma de prueba
                </button>
                <button
                  className="w-full px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors text-sm"
                  onClick={fixCanvas}
                >
                  Arreglar selección
                </button>
              </div>
            </div>
          </div>

          {/* Bottom buttons */}
          <div className="mt-3 space-y-2">
            <button
              className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors flex items-center justify-center gap-2"
              onClick={downloadDesign}
            >
              <Download size={16} /> Descargar Diseño
            </button>
            <button
              className={`w-full px-3 py-2 ${is3DView ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"} rounded-md transition-colors flex items-center justify-center gap-2`}
              onClick={toggle3DView}
            >
              <Cube size={16} /> {is3DView ? "Vista Normal" : "Vista 3D"}
            </button>
            <button
              className={`w-full px-3 py-2 ${showMannequin ? "bg-purple-500 hover:bg-purple-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"} rounded-md transition-colors flex items-center justify-center gap-2`}
              onClick={toggleMannequinView}
            >
              <User size={16} /> {showMannequin ? "Ocultar Maniquí" : "Ver en Maniquí"}
            </button>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-grow bg-white rounded-lg shadow-md p-4 order-1 md:order-2">
          <div
            ref={canvasContainerRef}
            className={`canvas-container bg-gray-100 rounded-lg p-2 mb-4 overflow-hidden mx-auto ${drawingMode ? "drawing" : ""}`}
            style={{ maxWidth: "700px" }}
          >
            {isLoading && (
              <div className="flex items-center justify-center h-[700px] w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-[700px] w-full">
                <div className="text-red-500">{error}</div>
              </div>
            )}

            <canvas ref={canvasRef} className={isLoading ? "hidden" : "block mx-auto"} />
          </div>

          {/* Canvas controls */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              className="p-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Deshacer"
            >
              <Undo size={16} />
            </button>
            <button
              className="p-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Rehacer"
            >
              <Redo size={16} />
            </button>
            <button
              className="p-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              onClick={zoomIn}
              title="Acercar"
            >
              <ZoomIn size={16} />
            </button>
            <button
              className="p-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              onClick={zoomOut}
              title="Alejar"
            >
              <ZoomOut size={16} />
            </button>
            <button
              className={`p-2 rounded-md ${hasSelection ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              onClick={bringToFront}
              disabled={!hasSelection}
              title="Traer al frente"
            >
              <Move size={16} />
            </button>
            <button
              className={`p-2 rounded-md ${hasSelection ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              onClick={sendToBack}
              disabled={!hasSelection}
              title="Enviar atrás"
            >
              <RotateCcw size={16} />
            </button>
            <button
              className={`p-2 rounded-md ${hasSelection ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              onClick={removeSelected}
              disabled={!hasSelection}
              title="Eliminar elemento"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Right sidebar - Preview */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow-md p-3 order-3">
          <div className="flex justify-between items-center mb-3 border-b pb-2">
            <h3 className="font-semibold text-lg">Vista Previa</h3>
            {is3DView && (
              <div className="flex gap-1">
                <button
                  className="p-1 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                  onClick={() => rotate3D("left")}
                  title="Rotar izquierda"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  className="p-1 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                  onClick={() => rotate3D("right")}
                  title="Rotar derecha"
                >
                  <RotateCw size={14} />
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 rounded-lg p-2 mb-3 w-full aspect-square flex items-center justify-center perspective-container">
              {isLoading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              ) : error ? (
                <div className="text-red-500">Error loading preview</div>
              ) : canvas ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  {showMannequin ? (
                    <div className="mannequin-container" style={get3DStyle()}>
                      <div className="mannequin">
                        {/* Simple mannequin shape */}
                        <div className="mannequin-head"></div>
                        <div className="mannequin-body">
                          <img
                            src={canvas.toDataURL({ format: "png" || "/placeholder.svg" }) || "/placeholder.svg"}
                            alt="Diseño en maniquí"
                            className="mannequin-clothing"
                          />
                        </div>
                        <div className="mannequin-legs"></div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={canvas.toDataURL({ format: "png" || "/placeholder.svg" }) || "/placeholder.svg"}
                      alt="Vista previa del diseño"
                      className="max-w-full max-h-full object-contain shadow-lg"
                      style={get3DStyle()}
                    />
                  )}
                  {is3DView && (
                    <div className="absolute bottom-1 left-0 right-0 text-center text-xs text-gray-500">
                      Rotación: {rotationAngle}°
                    </div>
                  )}
                </div>
              ) : (
                <div>No preview available</div>
              )}
            </div>
            <div className="text-sm text-gray-600 space-y-1 w-full">
              <p>
                <strong>Prenda:</strong>{" "}
                {garment === "tshirt"
                  ? "Remera"
                  : garment === "hoodie"
                    ? "Buzo"
                    : garment === "pants"
                      ? "Pantalón"
                      : "Gorra"}
              </p>
              <p>
                <strong>Color:</strong>{" "}
                <span
                  className="inline-block w-4 h-4 rounded-full align-middle mr-1"
                  style={{ backgroundColor: garmentColor }}
                ></span>{" "}
                {garmentColor}
              </p>
              <p>
                <strong>Elementos:</strong> {canvas ? canvas.getObjects().length : 0}
              </p>
              <p className="text-xs italic mt-2">
                {drawingMode
                  ? "Modo dibujo activado. Haz clic y arrastra para dibujar."
                  : "Haz clic en cualquier elemento para seleccionarlo y modificarlo."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

