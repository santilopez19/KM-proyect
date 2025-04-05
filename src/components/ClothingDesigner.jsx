"use client"

import { useEffect, useRef, useState } from "react"
import { fabric } from "fabric"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import {
  Bold,
  Italic,
  Trash2,
  Type,
  ImageIcon,
  Download,
  Undo,
  Redo,
  Palette,
  RotateCcw,
  Move,
  ArrowLeft,
  Pencil,
  Eraser,
  CuboidIcon as Cube,
  MousePointer,
} from "lucide-react"

export default function ClothingDesigner({ garment = "tshirt", onBack }) {
  // Canvas references
  const canvasRef = useRef(null)
  const threeContainerRef = useRef(null)
  const fileInputRef = useRef(null)

  // Fabric.js state
  const [canvas, setCanvas] = useState(null)
  const [hasSelection, setHasSelection] = useState(false)
  const [selectedObject, setSelectedObject] = useState(null)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Design state
  const [text, setText] = useState("")
  const [fontSize, setFontSize] = useState(20)
  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(false)
  const [textColor, setTextColor] = useState("#000000")
  const [garmentColor, setGarmentColor] = useState("#ffffff")
  const [drawingMode, setDrawingMode] = useState(false)
  const [brushColor, setBrushColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState(5)

  // 3D state
  const [show3D, setShow3D] = useState(false)
  const [renderer, setRenderer] = useState(null)
  const [scene, setScene] = useState(null)
  const [camera, setCamera] = useState(null)
  const [controls, setControls] = useState(null)
  const [mannequin, setMannequin] = useState(null)
  const [textureCanvas, setTextureCanvas] = useState(null)

  // Define garment images
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
      const json = canvasInstance.toJSON(["selectable", "hasControls", "hasBorders"])

      if (historyIndex < history.length - 1) {
        setHistory(history.slice(0, historyIndex + 1))
      }

      setHistory([...history.slice(0, historyIndex + 1), json])
      setHistoryIndex(historyIndex + 1)
    } catch (err) {
      console.error("Error saving to history:", err)
    }
  }

  // Initialize fabric.js canvas
  useEffect(() => {
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

      // Create new canvas with larger dimensions
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 600,
        height: 700,
        backgroundColor: "#f8f8f8",
        preserveObjectStacking: true,
        selection: true,
        selectionBorderColor: "rgba(0,0,255,0.3)",
        centeredScaling: true,
      })

      // Set up drawing brush
      const pencilBrush = new fabric.PencilBrush(fabricCanvas)
      pencilBrush.color = brushColor
      pencilBrush.width = brushSize
      fabricCanvas.freeDrawingBrush = pencilBrush

      // Event listeners for selection
      fabricCanvas.on("selection:created", (e) => {
        setSelectedObject(e.selected[0]);
      });

      fabricCanvas.on("selection:updated", (e) => {
        setSelectedObject(e.selected[0]);
      });

      fabricCanvas.on("selection:cleared", () => {
        setSelectedObject(null);
      });

      // Event listeners for modifications
      fabricCanvas.on("object:modified", () => {
        saveToHistory(fabricCanvas);
      });

      fabricCanvas.on("object:added", () => {
        saveToHistory(fabricCanvas);
      });

      fabricCanvas.on("object:removed", () => {
        console.log("Object removed")
        saveToHistory(fabricCanvas)
        updateTexture(fabricCanvas)
      })

      // Debug events
      fabricCanvas.on("mouse:down", (options) => {
        console.log("Mouse down:", options.e.type)
        if (options.target) {
          console.log("Clicked on object:", options.target)
        }
      })

      fabricCanvas.on("object:moving", (options) => {
        console.log("Object moving:", options.target)
        updateTexture(fabricCanvas)
      })

      setCanvas(fabricCanvas)

      // Load garment image
      if (garment && images[garment]) {
        setIsLoading(true)

        fabric.Image.fromURL(
          images[garment],
          (img) => {
            if (!img) {
              console.error("Image is null or undefined")
              setError("Failed to load garment image")
              setIsLoading(false)
              return
            }

            // Scale image to fit canvas
            const scale = Math.min(fabricCanvas.width / img.width, fabricCanvas.height / img.height) * 0.8
            img.scale(scale)

            // Center image on canvas
            img.set({
              left: fabricCanvas.width / 2,
              top: fabricCanvas.height / 2,
              originX: "center",
              originY: "center",
              selectable: false,
              evented: false,
              excludeFromExport: false,
            })

            // Set as background
            fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas), {
              crossOrigin: "anonymous",
            });
            

            // Apply color
            applyGarmentColor(fabricCanvas, garmentColor)

            // Save initial state
            saveToHistory(fabricCanvas)
            setIsLoading(false)

            // Initialize 3D scene after canvas is ready
            initThreeJS(fabricCanvas)
          },
          { crossOrigin: "anonymous" },
        )
      }

      return () => {
        fabricCanvas.dispose()
      }
    } catch (err) {
      console.error("Error initializing canvas:", err)
      setError("Failed to initialize design canvas")
      setIsLoading(false)
    }
  }, [garment])

  // Update brush when color or size changes
  useEffect(() => {
    if (canvas) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize;
    }
    
  }, [canvas, brushColor, brushSize])

  useEffect(() => {
    if (canvas && canvas.isDrawingMode) {
      const pencilBrush = new fabric.PencilBrush(canvas);
      pencilBrush.color = brushColor;
      pencilBrush.width = brushSize;
      canvas.freeDrawingBrush = pencilBrush;
      canvas.renderAll();
    }
  }, [canvas, brushColor, brushSize]);

  // Toggle drawing mode
  const toggleDrawingMode = () => {
    if (!canvas) return;

    setDrawingMode(!drawingMode);
    canvas.isDrawingMode = !drawingMode;
    canvas.defaultCursor = !drawingMode ? "default" : "crosshair";

    if (canvas.isDrawingMode) {
      const pencilBrush = new fabric.PencilBrush(canvas);
      pencilBrush.color = brushColor;
      pencilBrush.width = brushSize;
      canvas.freeDrawingBrush = pencilBrush;
    }

    canvas.renderAll();
  };

  // Initialize Three.js scene
  const initThreeJS = (fabricCanvas) => {
    if (!threeContainerRef.current) return

    try {
      // Create scene
      const newScene = new THREE.Scene()
      newScene.background = new THREE.Color(0xf0f0f0)

      // Create camera
      const newCamera = new THREE.PerspectiveCamera(
        45,
        threeContainerRef.current.clientWidth / threeContainerRef.current.clientHeight,
        0.1,
        1000,
      )
      newCamera.position.set(0, 0, 5)

      // Create renderer
      const newRenderer = new THREE.WebGLRenderer({ antialias: true })
      newRenderer.setSize(threeContainerRef.current.clientWidth, threeContainerRef.current.clientHeight)
      newRenderer.setPixelRatio(window.devicePixelRatio)
      threeContainerRef.current.innerHTML = ""
      threeContainerRef.current.appendChild(newRenderer.domElement)

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
      newScene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(1, 1, 1)
      newScene.add(directionalLight)

      // Create orbit controls
      const newControls = new OrbitControls(newCamera, newRenderer.domElement)
      newControls.enableDamping = true
      newControls.dampingFactor = 0.05

      // Create mannequin based on garment type
      let newMannequin

      if (garment === "tshirt" || garment === "hoodie") {
        // Create torso
        const torsoGeometry = new THREE.CylinderGeometry(1, 0.8, 2, 32)
        const torsoMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd })
        newMannequin = new THREE.Mesh(torsoGeometry, torsoMaterial)

        // Create head
        const headGeometry = new THREE.SphereGeometry(0.5, 32, 32)
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd })
        const head = new THREE.Mesh(headGeometry, headMaterial)
        head.position.y = 1.5
        newMannequin.add(head)

        // Create arms
        const armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 32)
        const armMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd })

        const leftArm = new THREE.Mesh(armGeometry, armMaterial)
        leftArm.position.set(-1.2, 0, 0)
        leftArm.rotation.z = Math.PI / 3
        newMannequin.add(leftArm)

        const rightArm = new THREE.Mesh(armGeometry, armMaterial)
        rightArm.position.set(1.2, 0, 0)
        rightArm.rotation.z = -Math.PI / 3
        newMannequin.add(rightArm)
      } else if (garment === "pants") {
        // Create legs
        const legGeometry = new THREE.CylinderGeometry(0.4, 0.3, 3, 32)
        const legMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd })

        const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
        leftLeg.position.set(-0.5, -0.5, 0)

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
        rightLeg.position.set(0.5, -0.5, 0)

        newMannequin = new THREE.Group()
        newMannequin.add(leftLeg, rightLeg)
      } else if (garment === "cap") {
        // Create head for cap
        const headGeometry = new THREE.SphereGeometry(1, 32, 32)
        const headMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd })
        newMannequin = new THREE.Mesh(headGeometry, headMaterial)
      }

      // Add mannequin to scene
      newScene.add(newMannequin)

      // Create texture from canvas
      const textureCanvas = document.createElement("canvas")
      textureCanvas.width = fabricCanvas.width
      textureCanvas.height = fabricCanvas.height
      setTextureCanvas(textureCanvas)

      // Create texture material
      const texture = new THREE.CanvasTexture(textureCanvas)
      const textureMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      })

      // Create garment mesh
      let garmentMesh

      if (garment === "tshirt" || garment === "hoodie") {
        // Create t-shirt/hoodie as a simple plane in front of torso
        const shirtGeometry = new THREE.PlaneGeometry(2, 2)
        garmentMesh = new THREE.Mesh(shirtGeometry, textureMaterial)
        garmentMesh.position.z = 1.01 // Slightly in front of mannequin
        newMannequin.add(garmentMesh)
      } else if (garment === "pants") {
        // Create pants as two planes
        const pantsGeometry = new THREE.PlaneGeometry(1.5, 3)
        garmentMesh = new THREE.Mesh(pantsGeometry, textureMaterial)
        garmentMesh.position.z = 0.5
        newMannequin.add(garmentMesh)
      } else if (garment === "cap") {
        // Create cap as a curved plane on top of head
        const capGeometry = new THREE.SphereGeometry(1.05, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
        garmentMesh = new THREE.Mesh(capGeometry, textureMaterial)
        garmentMesh.rotation.x = Math.PI
        garmentMesh.position.y = 0.1
        newMannequin.add(garmentMesh)
      }

      // Update state
      setScene(newScene)
      setCamera(newCamera)
      setRenderer(newRenderer)
      setControls(newControls)
      setMannequin(newMannequin)

      // Initial texture update
      updateTexture(fabricCanvas)

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate)

        if (newControls) {
          newControls.update()
        }

        if (newRenderer && newScene && newCamera) {
          newRenderer.render(newScene, newCamera)
        }
      }

      animate()

      // Handle resize
      const handleResize = () => {
        if (!threeContainerRef.current || !newCamera || !newRenderer) return

        const width = threeContainerRef.current.clientWidth
        const height = threeContainerRef.current.clientHeight

        newCamera.aspect = width / height
        newCamera.updateProjectionMatrix()

        newRenderer.setSize(width, height)
      }

      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
      }
    } catch (err) {
      console.error("Error initializing Three.js:", err)
    }
  }

  // Update 3D texture from canvas
  const updateTexture = (fabricCanvas) => {
    if (!textureCanvas || !scene || !fabricCanvas) return

    try {
      const ctx = textureCanvas.getContext("2d")

      // Clear canvas
      ctx.clearRect(0, 0, textureCanvas.width, textureCanvas.height)

      // Draw fabric canvas to texture canvas
      ctx.drawImage(fabricCanvas.lowerCanvasEl, 0, 0, fabricCanvas.width, fabricCanvas.height)

      // Find the mesh with the texture
      scene.traverse((object) => {
        if (object.material && object.material.map) {
          object.material.map.needsUpdate = true
        }
      })
    } catch (err) {
      console.error("Error updating texture:", err)
    }
  }

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
      updateTexture(canvasInstance)
    }
  }

  // Change garment color
  const changeGarmentColor = (color) => {
    setGarmentColor(color)
    applyGarmentColor(canvas, color)
    saveToHistory(canvas)
  }

  // Add text to design
  const addText = () => {
    if (!canvas || !text.trim()) return;

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
      hasControls: true,
      hasBorders: true,
    });

    canvas.add(textObject);
    canvas.setActiveObject(textObject);
    canvas.renderAll();
  };

  // Upload image
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target.result, (img) => {
        img.set({
          left: canvas.width / 2,
          top: canvas.height / 2,
          originX: "center",
          originY: "center",
          selectable: true,
          hasControls: true,
          hasBorders: true,
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  // Remove selected object
  const removeSelected = () => {
    if (!canvas) return

    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      if (activeObject !== canvas.backgroundImage) {
        canvas.remove(activeObject)
        canvas.discardActiveObject()
        canvas.renderAll()
        setHasSelection(false)
        saveToHistory(canvas)
        updateTexture(canvas)
      }
    }
  }

  // Clear all objects
  const clearCanvas = () => {
    if (!canvas) return

    try {
      const bgImage = canvas.backgroundImage

      canvas.getObjects().forEach((obj) => {
        canvas.remove(obj)
      })

      canvas.renderAll()
      saveToHistory(canvas)
      updateTexture(canvas)
    } catch (err) {
      console.error("Error clearing canvas:", err)
    }
  }

  // Download design
  const downloadDesign = () => {
    if (!canvas) return

    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    })

    const link = document.createElement("a")
    link.href = dataURL
    link.download = `${garment}-design.png`
    link.click()
  }

  // Toggle 3D view
  const toggle3DView = () => {
    setShow3D(!show3D)
  }

  // Reset 3D view
  const reset3DView = () => {
    if (controls) {
      controls.reset()
    }
  }

  // Undo action
  const undo = () => {
    if (historyIndex > 0 && canvas) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)

      try {
        canvas.loadFromJSON(history[newIndex], () => {
          canvas.renderAll()
          updateTexture(canvas)
        })
      } catch (err) {
        console.error("Error during undo:", err)
      }
    }
  }

  // Redo action
  const redo = () => {
    if (historyIndex < history.length - 1 && canvas) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)

      try {
        canvas.loadFromJSON(history[newIndex], () => {
          canvas.renderAll()
          updateTexture(canvas)
        })
      } catch (err) {
        console.error("Error during redo:", err)
      }
    }
  }

  // Fix selection issues
  const fixSelection = () => {
    if (!canvas) return;

    try {
      canvas.getObjects().forEach((obj) => {
        obj.set({
          selectable: true,
          hasControls: true,
          hasBorders: true,
          evented: true, // Allow interaction with the object
        });
      });

      if (canvas.backgroundImage) {
        canvas.backgroundImage.set({
          selectable: false, // Prevent selection of the background image
          evented: false,
        });
      }

      canvas.renderAll();
    } catch (err) {
      console.error("Error fixing selection:", err);
    }
  };

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

      <div className="flex flex-col md:flex-row gap-4">
        {/* Left Sidebar - Tools */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow-md p-3 order-2 md:order-1 flex flex-col">
          <h3 className="font-semibold text-lg mb-3 border-b pb-2">Herramientas</h3>

          <div className="space-y-3 flex-grow overflow-y-auto">
            {/* Selection tool */}
            <div className="border rounded-md p-2">
              <h4 className="font-medium mb-2 flex items-center gap-1">
                <MousePointer size={16} /> Selección
              </h4>
              <div className="space-y-2">
                <button
                  className="w-full px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors text-sm"
                  onClick={fixSelection}
                >
                  Habilitar Selección
                </button>
              </div>
            </div>

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
          </div>

          {/* Bottom buttons */}
          <div className="mt-3 space-y-2">
            <button
              className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors flex items-center justify-center gap-2"
              onClick={removeSelected}
              disabled={!hasSelection}
            >
              <Trash2 size={16} /> Eliminar Selección
            </button>

            <button
              className="w-full px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors flex items-center justify-center gap-2"
              onClick={clearCanvas}
            >
              <Eraser size={16} /> Limpiar Todo
            </button>

            <button
              className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors flex items-center justify-center gap-2"
              onClick={downloadDesign}
            >
              <Download size={16} /> Descargar Diseño
            </button>

            <button
              className={`w-full px-3 py-2 ${show3D ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"} rounded-md transition-colors flex items-center justify-center gap-2`}
              onClick={toggle3DView}
            >
              <Cube size={16} /> {show3D ? "Vista 2D" : "Vista 3D"}
            </button>
          </div>
        </div>

        {/* Center - Canvas/3D View */}
        <div className="flex-grow bg-white rounded-lg shadow-md p-4 order-1 md:order-2">
          <div className="flex justify-between mb-2">
            <div className="flex gap-2">
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
            </div>

            {show3D && (
              <button
                className="p-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                onClick={reset3DView}
                title="Reiniciar vista 3D"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>

          <div className="relative" style={{ height: "600px" }}>
            {/* 2D Canvas */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${show3D ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
              {isLoading && (
                <div className="flex items-center justify-center h-full w-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}

              {error && (
                <div className="flex items-center justify-center h-full w-full">
                  <div className="text-red-500">{error}</div>
                </div>
              )}

              <div className="canvas-container bg-gray-100 rounded-lg p-2 h-full flex items-center justify-center">
                <canvas ref={canvasRef} className={isLoading ? "hidden" : "block"} />
              </div>
            </div>

            {/* 3D View */}
            <div
              ref={threeContainerRef}
              className={`absolute inset-0 transition-opacity duration-300 ${show3D ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              style={{
                backgroundColor: "#f0f0f0",
                borderRadius: "0.5rem",
                overflow: "hidden",
              }}
            >
              {/* Three.js will render here */}
              <div className="absolute bottom-2 left-2 right-2 text-center text-sm text-gray-600 bg-white bg-opacity-70 p-1 rounded">
                Haz clic y arrastra para rotar el maniquí. Usa la rueda del ratón para hacer zoom.
              </div>
            </div>
          </div>

          <div className="mt-2 text-center text-sm text-gray-600">
            {show3D
              ? "Vista 3D: Puedes rotar el maniquí para ver tu diseño desde diferentes ángulos"
              : "Vista 2D: Puedes agregar texto, imágenes y dibujar sobre la prenda"}
          </div>
        </div>

        {/* Right sidebar - Info */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow-md p-3 order-3">
          <h3 className="font-semibold text-lg mb-3 border-b pb-2">Información</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">Prenda</h4>
              <p className="text-gray-600">
                {garment === "tshirt"
                  ? "Remera"
                  : garment === "hoodie"
                    ? "Buzo"
                    : garment === "pants"
                      ? "Pantalón"
                      : "Gorra"}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-1">Color</h4>
              <div className="flex items-center">
                <span
                  className="inline-block w-6 h-6 rounded-full mr-2 border"
                  style={{ backgroundColor: garmentColor }}
                ></span>
                <span className="text-gray-600">{garmentColor}</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-1">Elementos</h4>
              <p className="text-gray-600">{canvas ? canvas.getObjects().length : 0}</p>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-2">Instrucciones</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-1">
                  <span className="text-blue-500 mt-0.5">
                    <Type size={14} />
                  </span>
                  <span>Agrega texto personalizado a tu diseño</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-blue-500 mt-0.5">
                    <ImageIcon size={14} />
                  </span>
                  <span>Sube imágenes para incluir en tu diseño</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-blue-500 mt-0.5">
                    <Pencil size={14} />
                  </span>
                  <span>Dibuja libremente sobre la prenda</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-blue-500 mt-0.5">
                    <Cube size={14} />
                  </span>
                  <span>Visualiza tu diseño en 3D</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

