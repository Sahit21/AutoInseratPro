import React, { useState } from 'react';
import { AnalysisResult, Platform, ManualData } from '../types';
import { Button } from './Button';

interface ResultsViewProps {
  result: AnalysisResult;
  platform: Platform;
  data: ManualData;
  uploadedImages: string[];
}

export const ResultsView: React.FC<ResultsViewProps> = ({ result, platform, data, uploadedImages }) => {
  const [copiedText, setCopiedText] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  const handleCopyText = () => {
    const text = `${result.ad_text.headline}\n\n${result.ad_text.body}`;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handlePostAd = () => {
    setIsPosting(true);
    setTimeout(() => {
      setIsPosting(false);
      setPostSuccess(true);
    }, 2000);
  };

  const platformName = platform === Platform.MOBILE_DE ? 'Mobile.de' : 'AutoScout24';
  const isMobileDe = platform === Platform.MOBILE_DE;

  const formatCurrency = (val: string) => {
     if(!val) return "- €";
     if(val.includes("€")) return val;
     return `${val} €`;
  }

  if (postSuccess) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-green-100 p-12 text-center animate-fade-in flex flex-col items-center justify-center h-full min-h-[400px]">
        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Erfolgreich übertragen!</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          Ihr Inserat wurde erfolgreich an <strong>{platformName}</strong> gesendet. Sie erhalten in Kürze eine Bestätigungs-E-Mail.
        </p>
        <div className="flex gap-4">
            <Button variant="outline" onClick={() => window.location.reload()}>Neues Inserat</Button>
            <Button onClick={() => setPostSuccess(false)}>Zurück zur Übersicht</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {(result.missing_fields.length > 0 || result.low_confidence_fields.length > 0) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md shadow-sm">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Hinweise zur Datenqualität</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {result.missing_fields.map((field, i) => (
                    <li key={`missing-${i}`}>Fehlendes Feld: {field}</li>
                  ))}
                  {result.low_confidence_fields.map((field, i) => (
                    <li key={`low-${i}`}>Unsicher: {field}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extracted Data Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Extrahierte Daten</h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <DataPoint label="Marke" value={result.extracted_data.make} />
          <DataPoint label="Modell" value={result.extracted_data.model} />
          <DataPoint label="VIN" value={result.extracted_data.vin} />
          <DataPoint label="Erstzulassung" value={result.extracted_data.first_registration} />
          <DataPoint label="Leistung" value={result.extracted_data.power_ps ? `${result.extracted_data.power_kw} kW / ${result.extracted_data.power_ps} PS` : '-'} />
          <DataPoint label="Hubraum" value={result.extracted_data.displacement_ccm ? `${result.extracted_data.displacement_ccm} ccm` : '-'} />
          <DataPoint label="Kraftstoff" value={result.extracted_data.fuel_type} />
          <DataPoint label="HSN / TSN" value={`${result.extracted_data.hsn || '?'} / ${result.extracted_data.tsn || '?'}`} />
        </div>
      </div>

       {/* Ad Preview Card */}
       <div className={`rounded-xl shadow-sm border overflow-hidden ${isMobileDe ? 'border-orange-200' : 'border-yellow-200'}`}>
        <div className={`px-6 py-3 border-b flex justify-between items-center ${isMobileDe ? 'bg-orange-50 border-orange-100' : 'bg-yellow-50 border-yellow-100'}`}>
          <h3 className={`text-lg font-bold ${isMobileDe ? 'text-orange-800' : 'text-yellow-800'}`}>
            Vorschau: {platformName}
          </h3>
          <span className={`text-xs px-2 py-1 rounded font-medium ${isMobileDe ? 'bg-orange-200 text-orange-800' : 'bg-yellow-200 text-yellow-800'}`}>
             Listing Preview
          </span>
        </div>
        <div className="p-6 bg-white">
           <div className="flex flex-col sm:flex-row gap-4">
              {/* Image Area using Uploaded Images */}
              <div className="w-full sm:w-1/3 aspect-[4/3] bg-gray-100 rounded-md overflow-hidden relative border border-gray-200">
                 {uploadedImages.length > 0 ? (
                   <img src={uploadedImages[0]} alt="Car Preview" className="w-full h-full object-cover" />
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs mt-2">Kein Bild</span>
                   </div>
                 )}
                 <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                    1/{Math.max(1, uploadedImages.length)}
                 </div>
              </div>

              {/* Listing Details */}
              <div className="w-full sm:w-2/3 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                     <h4 className={`text-lg font-bold line-clamp-2 ${isMobileDe ? 'text-blue-900' : 'text-black'}`}>
                       {result.ad_text.headline.replace(/^[:\s]+/, '')}
                     </h4>
                  </div>
                  
                  <div className={`text-2xl font-bold mb-4 ${isMobileDe ? 'text-gray-900' : 'text-gray-900'}`}>
                    {formatCurrency(data.price)}
                  </div>

                  <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-sm text-gray-600 mb-4">
                     <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs w-16">EZ</span> 
                        <span className="font-medium">{result.extracted_data.first_registration || '-'}</span>
                     </div>
                     <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs w-16">KM</span> 
                        <span className="font-medium">{data.mileage || '-'}</span>
                     </div>
                     <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs w-16">Leistung</span> 
                        <span className="font-medium">{result.extracted_data.power_ps ? `${result.extracted_data.power_ps} PS` : '-'}</span>
                     </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs w-16">Kraftstoff</span> 
                        <span className="font-medium">{result.extracted_data.fuel_type || '-'}</span>
                     </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex gap-1">
                         <div className="h-2 w-12 bg-gray-200 rounded"></div>
                         <div className="h-2 w-8 bg-gray-200 rounded"></div>
                      </div>
                      <button className={`px-4 py-1.5 rounded text-sm font-medium text-white ${isMobileDe ? 'bg-orange-500 hover:bg-orange-600' : 'bg-yellow-400 text-black hover:bg-yellow-500'}`}>
                        E-Mail
                      </button>
                  </div>
              </div>
           </div>
        </div>
      </div>

      {/* Ad Text Generator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Inseratstext</h3>
          <Button variant="outline" onClick={handleCopyText} className="text-xs py-1 h-8">
            {copiedText ? "Kopiert!" : "Text kopieren"}
          </Button>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Titel</label>
            <div className="p-3 bg-gray-50 rounded-md text-gray-800 font-medium border border-gray-200">
              {result.ad_text.headline}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Beschreibung</label>
            <div className="p-4 bg-gray-50 rounded-md text-gray-700 whitespace-pre-wrap border border-gray-200 text-sm leading-relaxed font-mono">
              {result.ad_text.body}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="sticky bottom-4 z-20">
        <div className="bg-gray-900/90 backdrop-blur-md rounded-xl p-4 shadow-2xl flex items-center justify-between border border-gray-700 max-w-4xl mx-auto text-white">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Nächster Schritt</span>
            <span className="font-medium">Inserat veröffentlichen</span>
          </div>
          <Button 
            onClick={handlePostAd} 
            isLoading={isPosting}
            className={`border-none shadow-lg px-8 ${isMobileDe ? 'bg-orange-600 hover:bg-orange-700' : 'bg-yellow-500 hover:bg-yellow-600 text-black'}`}
          >
            Auf {platformName} posten
          </Button>
        </div>
      </div>

    </div>
  );
};

const DataPoint = ({ label, value }: { label: string; value: string | number | null }) => (
  <div>
    <span className="block text-xs text-gray-500 mb-1">{label}</span>
    <span className="block text-sm font-medium text-gray-900 truncate" title={String(value || '-')}>
      {value || '-'}
    </span>
  </div>
);