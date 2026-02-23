import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ManualData, Platform, AnalysisResult, BackgroundStyle } from '../types';
import { analyzeVehicleDocument, editCarImage } from '../services/geminiService';
import { Input, TextArea, Select } from './Input';
import { Button } from './Button';
import { ResultsView } from './ResultsView';
import { useAuth } from '../context/AuthContext';

// Default initial state
const initialData: ManualData = {
  platform: Platform.MOBILE_DE,
  mileage: '',
  price: '',
  gearbox: '',
  color: '',
  highlights: '',
  notes: '',
  disclaimer: '',
  accidentFree: ''
};

export const MainApp: React.FC = () => {
  const { signOut } = useAuth();
  const [formData, setFormData] = useState<ManualData>(initialData);
  
  // Doc Image (Vehicle Reg)
  const [selectedDocImage, setSelectedDocImage] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  
  // Car Images (Photos of the car)
  const [carImages, setCarImages] = useState<string[]>([]);
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyle>(BackgroundStyle.ORIGINAL);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  
  // Settings
  const [logoImage, setLogoImage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isApiKeyReady, setIsApiKeyReady] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const docInputRef = useRef<HTMLInputElement>(null);
  const carImagesInputRef = useRef<HTMLInputElement>(null);
  const carCameraInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsApiKeyReady(hasKey);
      } else {
        setIsApiKeyReady(true);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      setIsApiKeyReady(true);
      setError(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler for Vehicle Registration Document
  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedDocImage(reader.result as string);
        setResult(null); 
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler for Car Photos
  const handleCarImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages: string[] = [];
      Array.from(e.target.files).forEach((file: File) => {
        const url = URL.createObjectURL(file);
        newImages.push(url);
      });
      setCarImages(prev => [...prev, ...newImages]);
      setProcessedImages([]); // Reset processed images when new images are added
    }
  };

  // Handler for Logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCarImage = (index: number) => {
    setCarImages(prev => prev.filter((_, i) => i !== index));
    setProcessedImages(prev => prev.filter((_, i) => i !== index));
  };

  const fileToGenerativePart = async (file: File): Promise<{ mimeType: string; data: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve({
          mimeType: file.type,
          data: base64String,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Helper to resize and convert blob URL to base64
  const blobUrlToBase64 = async (blobUrl: string): Promise<{ mimeType: string; data: string }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 1024; // Resize to max 1024px for speed
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress to JPEG 0.8
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const base64String = dataUrl.split(',')[1];
            resolve({
                mimeType: 'image/jpeg',
                data: base64String
            });
        };
        img.onerror = reject;
        img.src = blobUrl;
    });
  };

  const handleProcessImages = async () => {
    if (carImages.length === 0) return;
    if (backgroundStyle === BackgroundStyle.ORIGINAL) {
        setProcessedImages([]);
        return;
    }

    setIsProcessingImages(true);
    setError(null);
    const newProcessedImages: string[] = [];

    try {
        let logoData: { mimeType: string; data: string } | undefined;
        if (backgroundStyle === BackgroundStyle.SHOWROOM && logoImage) {
             // Convert data URL to base64 parts
             const [prefix, base64] = logoImage.split(',');
             const mime = prefix.match(/:(.*?);/)?.[1] || 'image/png';
             logoData = { mimeType: mime, data: base64 };
        }

        const processImagePromise = async (imageUrl: string) => {
            try {
                const { data, mimeType } = await blobUrlToBase64(imageUrl);
                return await editCarImage(
                    data, 
                    mimeType, 
                    backgroundStyle, 
                    logoData?.data, 
                    logoData?.mimeType
                );
            } catch (e) {
                console.error("Failed to process image:", imageUrl, e);
                return imageUrl; // Fallback to original if failed
            }
        };

        const results = await Promise.all(carImages.map(img => processImagePromise(img)));
        setProcessedImages(results);
    } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Fehler bei der Bildbearbeitung: ${errorMessage}`);
    } finally {
        setIsProcessingImages(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!docFile) {
      setError("Bitte laden Sie zuerst ein Foto des Fahrzeugscheins hoch.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const imagePart = await fileToGenerativePart(docFile);
      const analysisResult = await analyzeVehicleDocument(imagePart.data, imagePart.mimeType, formData);
      setResult(analysisResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404")) {
        setIsApiKeyReady(false);
        setError("API Zugriff verweigert oder Model nicht gefunden. Bitte wählen Sie einen gültigen API Key.");
      } else {
        setError(errorMessage || "Ein unbekannter Fehler ist aufgetreten.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [docFile, formData]);

  if (!isApiKeyReady) {
    // Non-blocking check, just let the app render
  }

  return (
    <div className="min-h-screen pb-12">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">AI</div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">AutoInserat <span className="text-blue-600">Pro</span></h1>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                title="Einstellungen"
             >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
             </button>
             <button 
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-red-600 underline"
             >
                Logout
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5 space-y-6">

            {/* 1. Car Images */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">1. Fahrzeugbilder</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{carImages.length} Bilder</span>
              </div>
              
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                ref={carImagesInputRef}
                onChange={handleCarImagesChange}
              />
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                className="hidden" 
                ref={carCameraInputRef}
                onChange={handleCarImagesChange}
              />
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                 {(processedImages.length > 0 ? processedImages : carImages).map((src, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeCarImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                 ))}
                 
                 {/* Add Buttons */}
                 <div className="col-span-1 flex flex-col gap-2">
                    <button 
                        onClick={() => carImagesInputRef.current?.click()}
                        className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-500 hover:text-blue-600 p-2"
                    >
                        <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-[10px] font-medium">Galerie</span>
                    </button>
                    <button 
                        onClick={() => carCameraInputRef.current?.click()}
                        className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-500 hover:text-blue-600 p-2"
                    >
                        <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="text-[10px] font-medium">Kamera</span>
                    </button>
                 </div>
              </div>

              {/* Background Selection */}
              {carImages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hintergrund-Optimierung (AI)</label>
                    <div className="flex flex-col gap-2">
                        <select 
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={backgroundStyle}
                            onChange={(e) => setBackgroundStyle(e.target.value as BackgroundStyle)}
                        >
                            <option value={BackgroundStyle.ORIGINAL}>Original beibehalten</option>
                            <option value={BackgroundStyle.NEUTRAL}>Neutraler Studio-Hintergrund</option>
                            <option value={BackgroundStyle.SHOWROOM}>Showroom mit Logo & Wand</option>
                        </select>
                        
                        {backgroundStyle !== BackgroundStyle.ORIGINAL && (
                            <Button 
                                onClick={handleProcessImages} 
                                isLoading={isProcessingImages}
                                variant="secondary"
                                className="w-full text-sm py-2"
                                disabled={isProcessingImages}
                            >
                                {isProcessingImages ? 'Bearbeite Bilder...' : 'Hintergrund anwenden'}
                            </Button>
                        )}
                    </div>
                </div>
              )}
            </div>

            {/* 2. Manual Data (Now Second) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Fahrzeugdetails</h2>
              <div className="space-y-4">
                <Select
                  label="Zielplattform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  options={[
                    { label: 'Mobile.de', value: Platform.MOBILE_DE },
                    { label: 'AutoScout24', value: Platform.AUTOSCOUT24 },
                  ]}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Kilometerstand" 
                    name="mileage" 
                    placeholder="z.B. 45.000 km" 
                    value={formData.mileage} 
                    onChange={handleInputChange} 
                  />
                  <Input 
                    label="Preis (€)" 
                    name="price" 
                    placeholder="z.B. 19.990" 
                    value={formData.price} 
                    onChange={handleInputChange} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Getriebe"
                    name="gearbox"
                    value={formData.gearbox}
                    onChange={handleInputChange}
                    options={[
                      { label: 'Bitte wählen', value: '' },
                      { label: 'Automatik', value: 'Automatik' },
                      { label: 'Schaltgetriebe', value: 'Schaltgetriebe' },
                      { label: 'Halbautomatik', value: 'Halbautomatik' },
                    ]}
                  />
                  <Select
                    label="Unfallfrei"
                    name="accidentFree"
                    value={formData.accidentFree}
                    onChange={handleInputChange}
                    options={[
                      { label: 'Bitte wählen', value: '' },
                      { label: 'Ja', value: 'Ja' },
                      { label: 'Nein', value: 'Nein' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <Input 
                    label="Farbe" 
                    name="color" 
                    placeholder="z.B. Schwarz Metallic" 
                    value={formData.color} 
                    onChange={handleInputChange} 
                  />
                </div>

                <TextArea
                  label="Ausstattung / Highlights"
                  name="highlights"
                  placeholder="• Sitzheizung&#10;• Navi&#10;• 8-fach bereift"
                  value={formData.highlights}
                  onChange={handleInputChange}
                />
                <TextArea
                  label="Bekannte Mängel"
                  name="notes"
                  placeholder="z.B. Kratzer an der Stoßstange, Klimaanlage defekt..."
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* 3. Vehicle Doc (Now Third) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Fahrzeugschein (Teil I)</h2>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleDocFileChange} 
                className="hidden" 
                ref={docInputRef} 
              />
              {!selectedDocImage ? (
                <div 
                  onClick={() => docInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors"
                >
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">Schein hochladen</p>
                </div>
              ) : (
                <div className="relative group">
                  <img src={selectedDocImage} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-gray-200" />
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <button onClick={() => docInputRef.current?.click()} className="text-white bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm backdrop-blur-sm">Ändern</button>
                  </div>
                </div>
              )}

              <div className="mt-6 border-t border-gray-100 pt-6">
                <Button 
                  onClick={handleSubmit} 
                  disabled={!docFile} 
                  isLoading={isLoading} 
                  className="w-full justify-center text-lg py-3"
                >
                  {isLoading ? 'Analysiere...' : 'Inserat generieren'}
                </Button>
                {error && (
                  <div className="mt-3 text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            {!result && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-xl border border-dashed border-gray-300 min-h-[500px]">
                <div className="rounded-full bg-blue-50 p-6 mb-4">
                   <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                   </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900">Bereit zur Analyse</h3>
                <p className="mt-2 text-gray-500 max-w-sm">
                  1. Schein hochladen <br/> 2. Daten ergänzen <br/> 3. Fotos hinzufügen
                </p>
              </div>
            )}

            {isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-xl border border-gray-200 min-h-[500px]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
                <h3 className="text-xl font-medium text-gray-900">KI analysiert Dokument...</h3>
              </div>
            )}

            {result && (
              <ResultsView 
                result={result} 
                platform={formData.platform} 
                data={formData} 
                uploadedImages={processedImages.length > 0 ? processedImages : carImages} 
              />
            )}
          </div>
          
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative animate-fade-in">
            <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h2 className="text-xl font-bold mb-6 text-gray-900">Einstellungen</h2>
            
            <div className="space-y-4">
               {/* API Key Section */}
               {window.aistudio && (
                 <div className="pb-4 border-b border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Google AI Studio API Key</label>
                    <Button onClick={handleSelectKey} variant="outline" className="w-full justify-center">
                      {isApiKeyReady ? 'API Key wechseln' : 'API Key auswählen'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Für die Nutzung der AI-Funktionen erforderlich.
                    </p>
                 </div>
               )}

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Händler-Logo (für Showroom)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoChange} 
                    className="hidden" 
                    ref={logoInputRef} 
                  />
                  <div className="flex items-center gap-4">
                      <div 
                        onClick={() => logoInputRef.current?.click()}
                        className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 overflow-hidden bg-gray-50"
                      >
                         {logoImage ? (
                             <img src={logoImage} alt="Logo" className="w-full h-full object-contain" />
                         ) : (
                             <div className="text-center p-2">
                                <svg className="w-8 h-8 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span className="text-xs text-gray-500">Upload</span>
                             </div>
                         )}
                      </div>
                      <div className="flex-1">
                          <p className="text-sm text-gray-600 mb-2">
                              Laden Sie Ihr Firmenlogo hoch. Es wird automatisch an der Wand im "Showroom"-Hintergrund platziert.
                          </p>
                          {logoImage && (
                              <button 
                                onClick={() => setLogoImage(null)}
                                className="text-xs text-red-600 hover:underline"
                              >
                                Logo entfernen
                              </button>
                          )}
                      </div>
                  </div>
               </div>
            </div>

            <div className="mt-8 flex justify-end">
               <Button onClick={() => setIsSettingsOpen(false)}>Fertig</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
