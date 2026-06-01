import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, ZoomOut, RotateCcw, RotateCw } from 'lucide-react'

export default function ImageCropper({ image, onComplete, onCancel, aspect = 1 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleDone = async () => {
    if (!croppedAreaPixels) return
    const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation)
    onComplete(croppedImage)
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-white/10">
        <h3 className="text-white font-medium">Rasmni kesish</h3>
        <button onClick={onCancel} className="text-white/70 hover:text-white p-2">
          <X size={20} />
        </button>
      </div>

      {/* Cropper */}
      <div className="flex-1 relative">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          cropShape="rect"
          showGrid={true}
          style={{
            containerStyle: {
              background: '#000',
            },
            cropAreaStyle: {
              border: '2px solid #3b82f6',
            },
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-black/50 backdrop-blur-sm px-4 py-4 border-t border-white/10 space-y-4">
        {/* Zoom Slider */}
        <div className="flex items-center gap-3">
          <ZoomOut size={18} className="text-white/70 flex-shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <ZoomOut size={18} className="text-white/70 flex-shrink-0 rotate-180" />
        </div>

        {/* Rotate Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setRotation((r) => r - 90)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <RotateCcw size={16} /> 90°
          </button>
          <button
            onClick={() => setRotation((r) => r + 90)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <RotateCw size={16} /> 90°
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleDone}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  )
}

function getRadianAngle(degree) {
  return (degree * Math.PI) / 180
}

// Bounding box size of an image after rotation
function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation)
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

// Helper function to create cropped (and optionally rotated) image
async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  const rotRad = getRadianAngle(rotation)
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation)

  // Draw the rotated image onto a bounding-box-sized canvas
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.translate(-image.width / 2, -image.height / 2)
  ctx.drawImage(image, 0, 0)

  // Extract the crop area (pixelCrop is relative to the rotated bounding box)
  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height)

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  ctx.putImageData(data, 0, 0)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/jpeg', 0.95)
  })
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}
