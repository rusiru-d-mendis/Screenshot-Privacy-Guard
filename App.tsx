
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { detectSensitiveAreas } from './services/geminiService';
import type { Point, DrawingRegion, RectangleRegion } from './types';
import { UploadIcon, SparklesIcon, TrashIcon, DownloadIcon, CrossIcon, RectangleIcon, CircleIcon, PencilIcon, UndoIcon, RedoIcon, PointerIcon } from './components/Icons';

type DrawingTool = 'rectangle' | 'ellipse' | 'freehand' | 'pointer';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<DrawingRegion[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const regions = history[historyIndex];

  const [effectType, setEffectType] = useState<'blur' | 'pixelate'>('blur');
  const [pixelationLevel, setPixelationLevel] = useState<number>(20);
  const [blurAmount, setBlurAmount] = useState<number>(20);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('pointer');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStartPoint, setDrawStartPoint] = useState<Point | null>(null);
  const [currentRect, setCurrentRect] = useState<RectangleRegion | null>(null);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  const updateRegions = useCallback((updater: (prevRegions: DrawingRegion[]) => DrawingRegion[]) => {
    setHistory(prevHistory => {
      const currentRegions = prevHistory[historyIndex];
      const newRegions = updater(currentRegions);
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      return [...newHistory, newRegions];
    });
    setHistoryIndex(prevIndex => prevIndex + 1);
  }, [historyIndex]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image.src || image.naturalWidth === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    regions.forEach(region => {
      ctx.save();

      // Create clipping path
      ctx.beginPath();
      if (region.type === 'rectangle' || region.type === 'ellipse') {
        if (region.type === 'ellipse') {
          ctx.ellipse(region.x + region.width / 2, region.y + region.height / 2, region.width / 2, region.height / 2, 0, 0, 2 * Math.PI);
        } else {
          ctx.rect(region.x, region.y, region.width, region.height);
        }
      } else if (region.type === 'path' && region.points.length > 1) {
        ctx.moveTo(region.points[0].x, region.points[0].y);
        for (let i = 1; i < region.points.length; i++) {
          ctx.lineTo(region.points[i].x, region.points[i].y);
        }
        ctx.closePath();
      }
      ctx.clip();

      // Apply effect within clipping path
      if (effectType === 'blur') {
        ctx.filter = `blur(${blurAmount}px)`;
        ctx.drawImage(canvas, 0, 0);
      } else if (effectType === 'pixelate') {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const points = region.type === 'path' ? region.points : [ {x: region.x, y: region.y}, {x: region.x + region.width, y: region.y + region.height} ];
        points.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
        const rect = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

        if (rect.width > 0 && rect.height > 0) {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                ctx.imageSmoothingEnabled = false;
                const size = pixelationLevel;
                tempCanvas.width = Math.max(1, rect.width / size);
                tempCanvas.height = Math.max(1, rect.height / size);
                tempCtx.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, tempCanvas.width, tempCanvas.height);
                ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, rect.x, rect.y, rect.width, rect.height);
                ctx.imageSmoothingEnabled = true;
            }
        }
      }
      
      ctx.restore();
      ctx.filter = 'none';
    });

    setProcessedImageUrl(canvas.toDataURL());
  }, [regions, effectType, pixelationLevel, blurAmount]);
  
  useEffect(() => {
    const image = imageRef.current;
    const handleLoad = () => {
        redrawCanvas();
    };
    image.addEventListener('load', handleLoad);

    if (imageUrl) {
        redrawCanvas();
    }

    return () => {
        image.removeEventListener('load', handleLoad);
    };
  }, [redrawCanvas, imageUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      imageRef.current.src = url;
      setHistory([[]]);
      setHistoryIndex(0);
      setError(null);
    } else {
      setError("Please select a valid image file.");
      setImageFile(null);
      setImageUrl(null);
      setProcessedImageUrl(null);
      setHistory([[]]);
      setHistoryIndex(0);
    }
  };

  const handleAutoDetect = async () => {
    if (!imageFile) return;
    setIsDetecting(true);
    setError(null);
    try {
      const detectedRegions = await detectSensitiveAreas(imageFile);
      const image = imageRef.current;
      const absoluteRegions: DrawingRegion[] = detectedRegions.map(r => ({
        type: 'rectangle',
        x: r.x * image.naturalWidth,
        y: r.y * image.naturalHeight,
        width: r.width * image.naturalWidth,
        height: r.height * image.naturalHeight,
      }));
      updateRegions(prev => [...prev, ...absoluteRegions]);
    } catch (err) {
      setError("Failed to detect sensitive areas. Please try again."); console.error(err);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleReset = () => { updateRegions(() => []); };
  
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'privacy-screenshot.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const getMousePos = (e: React.MouseEvent<HTMLDivElement>): Point | null => {
    const container = imageContainerRef.current;
    const image = imageRef.current;
    if (!container || !image.src) return null;
    const rect = container.getBoundingClientRect();
    const scaleX = image.naturalWidth / container.clientWidth;
    const scaleY = image.naturalHeight / container.clientHeight;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageUrl || drawingTool === 'pointer') return;
    e.preventDefault();
    const pos = getMousePos(e);
    if (pos) {
      setIsDrawing(true);
      setDrawStartPoint(pos);
      if (drawingTool === 'freehand') {
        setCurrentPath([pos]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStartPoint) return;
    const pos = getMousePos(e);
    if (pos) {
      if (drawingTool === 'freehand') {
        setCurrentPath(prev => [...prev, pos]);
      } else {
        const x = Math.min(drawStartPoint.x, pos.x);
        const y = Math.min(drawStartPoint.y, pos.y);
        const width = Math.abs(drawStartPoint.x - pos.x);
        const height = Math.abs(drawStartPoint.y - pos.y);
        setCurrentRect({ type: 'rectangle', x, y, width, height });
      }
    }
  };

  const handleMouseUp = () => {
    if (drawingTool === 'freehand') {
      if (currentPath.length > 1) {
        updateRegions(prev => [...prev, { type: 'path', points: currentPath }]);
      }
    } else if (currentRect && currentRect.width > 5 && currentRect.height > 5) {
      updateRegions(prev => [...prev, { ...currentRect, type: drawingTool === 'pointer' ? 'rectangle' : drawingTool }]);
    }
    setIsDrawing(false);
    setDrawStartPoint(null);
    setCurrentRect(null);
    setCurrentPath([]);
  };

  const removeRegion = (index: number) => {
    updateRegions(prev => prev.filter((_, i) => i !== index));
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = () => {
    if (canUndo) setHistoryIndex(historyIndex - 1);
  };
  const handleRedo = () => {
    if (canRedo) setHistoryIndex(historyIndex + 1);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col p-4 md:p-8 font-sans">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
          Screenshot Privacy Guard
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          Protect sensitive information with blur, pixelation, and powerful drawing tools.
        </p>
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside className="lg:col-span-1 bg-gray-800/50 rounded-lg p-6 flex flex-col border border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 border-b border-gray-600 pb-4">Controls</h2>
          
          <div className="flex flex-col space-y-4">
            <label htmlFor="file-upload" className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2">
              <UploadIcon />{imageFile ? "Change Image" : "Upload Image"}
            </label>
            <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          
            <button onClick={handleAutoDetect} disabled={!imageFile || isDetecting} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
              {isDetecting ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <SparklesIcon />} Auto-detect PII
            </button>
            
            <div className="bg-gray-700/50 p-3 rounded-lg space-y-4">
              {/* Drawing Tool & Effect Style */}
              <div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-300">Tool</h3>
                  <div className="flex bg-gray-900 rounded-lg p-1 space-x-1">
                      {[{ tool: 'pointer', icon: <PointerIcon /> }, { tool: 'rectangle', icon: <RectangleIcon /> }, { tool: 'ellipse', icon: <CircleIcon /> }, { tool: 'freehand', icon: <PencilIcon /> }].map(({ tool, icon }) => (
                          <button key={tool} onClick={() => setDrawingTool(tool as DrawingTool)} className={`w-1/4 rounded-md py-2 text-sm font-medium transition-colors flex justify-center items-center ${drawingTool === tool ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{icon}</button>
                      ))}
                  </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-300">Effect Style</h3>
                <div className="flex bg-gray-900 rounded-lg p-1">
                  <button onClick={() => setEffectType('blur')} className={`w-1/2 rounded-md py-2 text-sm font-medium transition-colors ${effectType === 'blur' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Blur</button>
                  <button onClick={() => setEffectType('pixelate')} className={`w-1/2 rounded-md py-2 text-sm font-medium transition-colors ${effectType === 'pixelate' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Pixelate</button>
                </div>
                <div className="mt-3">
                  {effectType === 'blur' ? (
                    <div><label htmlFor="blur-amount" className="block text-sm font-medium text-gray-300 mb-2 flex justify-between"><span>Blur Intensity</span><span className="font-mono">{blurAmount}px</span></label><input id="blur-amount" type="range" min="2" max="50" value={blurAmount} onChange={(e) => setBlurAmount(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" /></div>
                  ) : (
                    <div><label htmlFor="pixelation-level" className="block text-sm font-medium text-gray-300 mb-2 flex justify-between"><span>Pixel Size</span><span className="font-mono">{pixelationLevel}px</span></label><input id="pixelation-level" type="range" min="4" max="50" value={pixelationLevel} onChange={(e) => setPixelationLevel(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" /></div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex space-x-4">
                  <button onClick={handleUndo} disabled={!canUndo} className="w-1/2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"><UndoIcon />Undo</button>
                  <button onClick={handleRedo} disabled={!canRedo} className="w-1/2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"><RedoIcon />Redo</button>
                </div>
                <button onClick={handleReset} disabled={!imageFile || regions.length === 0} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"><TrashIcon />Reset</button>
                <button onClick={handleDownload} disabled={!imageFile || regions.length === 0} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"><DownloadIcon />Download</button>
            </div>
            {error && <p className="text-red-400 text-center">{error}</p>}
          </div>
          
          <div className="mt-auto pt-6 text-gray-400 text-sm">
            <h3 className="font-semibold text-lg text-gray-200 mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-2">
                <li>Upload an image.</li>
                <li>Select a drawing tool, effect, and intensity.</li>
                <li>Click "Auto-detect" or manually draw on the image.</li>
                <li>Switch to the Pointer tool (hand icon) to click/tap regions to delete.</li>
                <li>Download your protected image.</li>
            </ol>
          </div>
        </aside>

        <section className="lg:col-span-2 bg-gray-800/50 rounded-lg p-4 flex items-center justify-center border border-gray-700 min-h-[400px] lg:min-h-0">
          <div ref={imageContainerRef} className={`w-full h-full relative flex items-center justify-center overflow-hidden ${drawingTool === 'pointer' ? 'cursor-default' : 'cursor-crosshair'}`} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            {!imageUrl ? (
              <div className="text-center text-gray-500"><UploadIcon className="w-16 h-16 mx-auto mb-4" /><p className="text-xl">Your image will appear here</p></div>
            ) : (
              <>
                <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" style={{ display: 'none' }} />
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                    <img alt="Processed screenshot" src={processedImageUrl ?? ''} className="max-w-full max-h-full object-contain" />
                </div>
                {isDetecting && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-t-transparent border-cyan-400 rounded-full animate-spin"></div><p className="mt-4 text-lg">Analyzing image...</p>
                  </div>
                )}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {currentRect && (<div className="absolute border-2 border-dashed border-cyan-400 bg-cyan-400/20" style={{ left: `${(currentRect.x / imageRef.current.naturalWidth) * 100}%`, top: `${(currentRect.y / imageRef.current.naturalHeight) * 100}%`, width: `${(currentRect.width / imageRef.current.naturalWidth) * 100}%`, height: `${(currentRect.height / imageRef.current.naturalHeight) * 100}%`, borderRadius: drawingTool === 'ellipse' ? '50%' : '0' }}/>)}
                    {currentPath.length > 1 && (<svg width="100%" height="100%" viewBox={`0 0 ${imageRef.current.naturalWidth} ${imageRef.current.naturalHeight}`} style={{position: 'absolute', top: 0, left: 0}}><polyline points={currentPath.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(0, 255, 255, 0.5)" strokeWidth="2" /></svg>)}
                </div>
                {!isDrawing && regions.map((region, index) => {
                  const getBoundingBox = () => {
                      if (region.type === 'path') {
                          if (region.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
                          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                          region.points.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
                          return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
                      }
                      return region;
                  };
                  const box = getBoundingBox();
                  const isPointerMode = drawingTool === 'pointer';
                  const regionClasses = isPointerMode 
                    ? "border-2 border-solid border-red-500 cursor-pointer" 
                    : "border-2 border-dashed border-cyan-400/50 pointer-events-none";

                  return (
                   <div 
                     key={index} 
                     className={`absolute transition-colors ${regionClasses}`}
                     style={{ left: `${(box.x / imageRef.current.naturalWidth) * 100}%`, top: `${(box.y / imageRef.current.naturalHeight) * 100}%`, width: `${(box.width / imageRef.current.naturalWidth) * 100}%`, height: `${(box.height / imageRef.current.naturalHeight) * 100}%` }}
                     onClick={isPointerMode ? (e) => { e.stopPropagation(); removeRegion(index); } : undefined}
                   />
                  )
                })}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
