/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';

 
let faceapi: any = null;
 
let canvasModule: any = null;

let modelsLoaded = false;

export async function initFaceApi() {
  if (modelsLoaded && faceapi) return;
  
  if (!faceapi) {
    // Dynamically import to avoid Next.js static build evaluation crashes (TextEncoder is not a constructor)
    faceapi = await import('@vladmandic/face-api');
    canvasModule = await import('canvas');
    
    // Monkey patch nodejs environment
    faceapi.env.monkeyPatch({ 
      Canvas: canvasModule.Canvas as any, 
      Image: canvasModule.Image as any, 
      ImageData: canvasModule.ImageData as any 
    });
  }

  const modelsPath = path.join(process.cwd(), 'public', 'models');
  
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
    faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath)
  ]);
  
  modelsLoaded = true;
}

export async function processImageForFaces(imageUrl: string) {
  await initFaceApi();
  
  try {
    // Fetch image as buffer
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Load image into canvas Image object
    const img = new canvasModule.Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = buffer;
    });
    
    // Create canvas
    const canvas = new canvasModule.Canvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    // Detect all faces
    const detections = await faceapi.detectAllFaces(canvas as any)
      .withFaceLandmarks()
      .withFaceDescriptors();
      
    return detections.map((d: any) => ({
      descriptor: Array.from(d.descriptor),
      box: d.detection.box,
      score: d.detection.score
    }));
    
  } catch (error) {
    console.error('Error processing image for faces:', error);
    throw error;
  }
}
