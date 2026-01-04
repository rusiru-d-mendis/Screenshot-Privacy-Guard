
import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { detectSensitiveAreas } from './services/geminiService';
import type { Point, DrawingRegion, RectangleRegion } from './types';
import { UploadIcon, SparklesIcon, TrashIcon, DownloadIcon, RectangleIcon, CircleIcon, PencilIcon, UndoIcon, RedoIcon, PointerIcon } from './components/Icons';

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
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStartPoint, setDrawStartPoint] = useState<Point | null>(null);
  const [currentRect, setCurrentRect] = useState<RectangleRegion | null>(null);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [renderedSize, setRenderedSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const calculateSize = () => {
        if (!imageContainerRef.current || !imageRef.current.naturalWidth) {
            setRenderedSize({ width: 0, height: 0 });
            return;
        }

        const container = imageContainerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const imageWidth = imageRef.current.naturalWidth;
        const imageHeight = imageRef.current.naturalHeight;

        if (containerWidth === 0 || containerHeight === 0 || imageWidth === 0 || imageHeight === 0) return;

        const imageAspectRatio = imageWidth / imageHeight;
        const containerAspectRatio = containerWidth / containerHeight;

        let newWidth, newHeight;

        if (imageAspectRatio > containerAspectRatio) {
            newWidth = containerWidth;
            newHeight = containerWidth / imageAspectRatio;
        } else {
            newHeight = containerHeight;
            newWidth = containerHeight * imageAspectRatio;
        }
        
        setRenderedSize({ width: newWidth, height: newHeight });
    };

    calculateSize();

    const image = imageRef.current;
    image.addEventListener('load', calculateSize);
    window.addEventListener('resize', calculateSize);

    return () => {
        image.removeEventListener('load', calculateSize);
        window.removeEventListener('resize', calculateSize);
    };
  }, [imageUrl]);

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

      if (effectType === 'blur') {
        ctx.filter = `blur(${blurAmount}px)`;
        ctx.drawImage(canvas, 0, 0);
      } else if (effectType === 'pixelate') {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          ctx.imageSmoothingEnabled = false;
          const size = pixelationLevel;
          const w = image.naturalWidth;
          const h = image.naturalHeight;
          tempCanvas.width = Math.max(1, w / size);
          tempCanvas.height = Math.max(1, h / size);
          tempCtx.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height);
          ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, w, h);
          ctx.imageSmoothingEnabled = true;
        }
      }
      
      ctx.restore();
      ctx.filter = 'none';
    });

    setProcessedImageUrl(canvas.toDataURL());
  }, [regions, effectType, pixelationLevel, blurAmount]);
  
  useEffect(() => {
    if (imageUrl) {
        imageRef.current.src = imageUrl;
    }
  }, [imageUrl]);

  useEffect(() => {
    const image = imageRef.current;

    const applyEffects = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        redrawCanvas();
      }
    };

    if (image.complete) {
      applyEffects();
    }

    image.addEventListener('load', applyEffects);

    return () => {
      image.removeEventListener('load', applyEffects);
    };
  }, [redrawCanvas]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
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
    link.download = 'ghostsnap-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const getMousePos = (e: React.MouseEvent<HTMLDivElement>): Point | null => {
    const wrapper = imageWrapperRef.current;
    const image = imageRef.current;
    if (!wrapper || !image.src || !image.naturalWidth) return null;
    
    const rect = wrapper.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scale = image.naturalWidth / wrapper.clientWidth;
    
    return { x: mouseX * scale, y: mouseY * scale };
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
    if (!isDrawing) return;
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

  const handleUndo = () => { if (canUndo) setHistoryIndex(historyIndex - 1); };
  const handleRedo = () => { if (canRedo) setHistoryIndex(historyIndex + 1); };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col p-4 md:p-8 font-sans">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">GhostSnap</h1>
        <p className="text-gray-400 mt-2 text-lg">Protect sensitive information with blur, pixelation, and powerful drawing tools.</p>
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
                <li>Upload an image.</li><li>Select a tool, effect, and intensity.</li><li>Click "Auto-detect" or manually draw on the image.</li><li>Switch to the Pointer tool to click/tap regions to delete.</li><li>Download your protected image.</li>
            </ol>
          </div>
        </aside>
        <section className="lg:col-span-2 bg-gray-800/50 rounded-lg p-4 flex items-center justify-center border border-gray-700 min-h-[400px] lg:min-h-0">
          <div ref={imageContainerRef} className={`w-full h-full flex items-center justify-center overflow-hidden ${drawingTool === 'pointer' ? 'cursor-default' : 'cursor-crosshair'}`} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            {!imageUrl ? (
              <div className="text-center text-gray-500"><UploadIcon className="w-16 h-16 mx-auto mb-4" /><p className="text-xl">Your image will appear here</p></div>
            ) : (
              <div ref={imageWrapperRef} className="relative" style={{ width: renderedSize.width, height: renderedSize.height }}>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <img alt="Processed screenshot" src={processedImageUrl ?? ''} className="w-full h-full block" />
                {isDetecting && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-t-transparent border-cyan-400 rounded-full animate-spin"></div>
                    <p className="mt-4 text-lg">Analyzing image...</p>
                  </div>
                )}
                <svg viewBox={`0 0 ${imageRef.current.naturalWidth || 1} ${imageRef.current.naturalHeight || 1}`} className="absolute top-0 left-0 w-full h-full" style={{ overflow: 'visible' }}>
                  {isDrawing && currentRect && (
                      drawingTool === 'rectangle' ? (
                          <rect x={currentRect.x} y={currentRect.y} width={currentRect.width} height={currentRect.height} fill="rgba(34, 211, 238, 0.2)" stroke="rgba(34, 211, 238, 1)" strokeWidth="2" strokeDasharray="4" style={{ vectorEffect: 'non-scaling-stroke' as const }} />
                      ) : (
                          <ellipse cx={currentRect.x + currentRect.width / 2} cy={currentRect.y + currentRect.height / 2} rx={currentRect.width / 2} ry={currentRect.height / 2} fill="rgba(34, 211, 238, 0.2)" stroke="rgba(34, 211, 238, 1)" strokeWidth="2" strokeDasharray="4" style={{ vectorEffect: 'non-scaling-stroke' as const }} />
                      )
                  )}
                  {isDrawing && currentPath.length > 1 && (
                      <path d={currentPath.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(34, 211, 238, 0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ vectorEffect: 'non-scaling-stroke' as const }} />
                  )}
                  {!isDrawing && regions.map((region, index) => {
                      const isPointerMode = drawingTool === 'pointer';
                      const commonProps = {
                          fill: isPointerMode ? "transparent" : "none",
                          stroke: isPointerMode ? 'rgba(239, 68, 68, 1)' : 'rgba(34, 211, 238, 0.5)',
                          strokeWidth: 2,
                          strokeDasharray: isPointerMode ? 'none' : '4 4',
                          className: `transition-colors ${isPointerMode ? 'cursor-pointer' : 'pointer-events-none'}`,
                          style: { vectorEffect: 'non-scaling-stroke' as const },
                          onClick: isPointerMode ? (e: React.MouseEvent) => { e.stopPropagation(); removeRegion(index); } : undefined,
                      };
                      if (region.type === 'rectangle') return <rect key={index} x={region.x} y={region.y} width={region.width} height={region.height} {...commonProps} />;
                      if (region.type === 'ellipse') return <ellipse key={index} cx={region.x + region.width / 2} cy={region.y + region.height / 2} rx={region.width / 2} ry={region.height / 2} {...commonProps} />;
                      if (region.type === 'path') return <path key={index} d={region.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} {...commonProps} />;
                      return null;
                  })}
                </svg>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
