import { GoogleGenAI } from "@google/genai";
import { ManualData, AnalysisResult, BackgroundStyle } from "../types";

export const analyzeVehicleDocument = async (
  base64Image: string,
  mimeType: string,
  data: ManualData
): Promise<AnalysisResult> => {
  // Initialize client here to ensure it uses the latest API key from process.env
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
Du bist ein “Autohaus Inserat-Assistent” für den deutschen Markt.

Aufgabe:
1) Lies das angehängte Foto der Zulassungsbescheinigung Teil I (Fahrzeugschein) und extrahiere Fahrzeugdaten.
2) Erstelle daraus einen fertigen Inseratstext (neutral, verkaufsstark, seriös, ohne Übertreibungen).
3) Gib zusätzlich ein Plattform-Payload für (a) MOBILE_DE oder (b) AUTOSCOUT24 aus – je nachdem, was der User ausgewählt hat.

WICHTIGE REGELN (sehr strikt):
- KEINE Halluzinationen: Wenn ein Wert nicht klar erkennbar ist oder nicht im Dokument/Userspezifikation vorkommt, setze ihn auf null und trage ihn in 'missing_fields' ein.
- Schreibe keine personenbezogenen Daten aus dem Fahrzeugschein in den Inseratstext oder ins Payload (z.B. Haltername, Adresse). Falls erkannt: nur in 'redacted_personal_data' aufführen.
- Normalisiere Einheiten: Leistung kW + berechnete PS (PS = kW * 1.35962, gerundet), Hubraum in ccm, Datum als YYYY-MM, VIN in Großbuchstaben ohne Leerzeichen.
- Output muss ausschließlich VALIDE JSON sein.

Qualität Inseratstext:
- Baue den Inseratstext so auf: Titelzeile + Kurzbeschreibung + Faktenliste + Zustand/Service (falls vorhanden) + Hinweis “Irrtümer vorbehalten”.
- Nutze freundlichen Autohaus-Ton, aber ohne Superlative wie “bestes”, “unschlagbar”.
- Wenn User “Anmerkungen” liefert, integriere sie in den Text unter “Hinweise”.

Validierungen:
- VIN: 17 Zeichen (ohne I,O,Q). Wenn abweichend -> 'low_confidence_fields'.
- Erstzulassung darf nicht in der Zukunft liegen.

---
USER INPUTS:
Plattform: ${data.platform}
Kilometerstand: ${data.mileage || 'Nicht angegeben'}
Preis (EUR): ${data.price || 'Auf Anfrage'}
Getriebe: ${data.gearbox || 'Nicht angegeben'}
Farbe: ${data.color || 'Nicht angegeben'}
Unfallfrei: ${data.accidentFree || 'Nicht angegeben'}
Ausstattung/Highlights: ${data.highlights || 'Keine'}
Mängel / Hinweise: ${data.notes || 'Keine'}
Garantie/Textbausteine: ${data.disclaimer || 'Keine'}
---

Formatiere die Antwort strikt nach folgendem JSON Schema:
{
  "extracted_data": {
    "vin": "string or null",
    "hsn": "string or null",
    "tsn": "string or null",
    "first_registration": "YYYY-MM or null",
    "displacement_ccm": "number or null",
    "power_kw": "number or null",
    "power_ps": "number or null",
    "fuel_type": "string or null",
    "make": "string or null",
    "model": "string or null"
  },
  "ad_text": {
    "headline": "string",
    "body": "string (multiline text)"
  },
  "platform_payload": { ...appropriate fields for ${data.platform}... },
  "missing_fields": ["string"],
  "low_confidence_fields": ["string"],
  "redacted_personal_data": ["string"]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response.text) {
      throw new Error("Keine Antwort von Gemini erhalten.");
    }

    const jsonResult: AnalysisResult = JSON.parse(response.text);
    return jsonResult;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};

export const editCarImage = async (
  base64Image: string,
  mimeType: string,
  style: BackgroundStyle,
  logoBase64?: string,
  logoMimeType?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let prompt = "";
  const parts: any[] = [
    {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    }
  ];

  if (style === BackgroundStyle.NEUTRAL) {
    prompt = "Edit this image: Replace the background with a soft, neutral, light-grey studio background. IMPORTANT: The car must be preserved EXACTLY as it is pixel-for-pixel. Do not hallucinate new details on the car. Do not change the car's color, lighting, or reflections. Only change the environment around the car.";
  } else if (style === BackgroundStyle.SHOWROOM) {
    if (logoBase64 && logoMimeType) {
      prompt = "Edit this image: Replace the background with a clean, white, modern showroom wall. Place the provided logo on the wall. IMPORTANT: The car must be preserved EXACTLY as it is pixel-for-pixel. Do not hallucinate new details on the car. Do not change the car's color, lighting, or reflections. Only change the environment around the car.";
      parts.push({
        inlineData: {
          data: logoBase64,
          mimeType: logoMimeType,
        },
      });
    } else {
      prompt = "Edit this image: Replace the background with a clean, white, modern showroom wall. IMPORTANT: The car must be preserved EXACTLY as it is pixel-for-pixel. Do not hallucinate new details on the car. Do not change the car's color, lighting, or reflections. Only change the environment around the car.";
    }
  } else {
    return base64Image;
  }

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
    });

    // Check if we got an image back
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    
    // If no image, check for text (refusal or error)
    const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (textPart) {
        console.warn("Gemini refused or failed to generate image. Reason:", textPart.text);
        throw new Error(`Bild konnte nicht generiert werden: ${textPart.text.substring(0, 100)}...`);
    }

    throw new Error("Kein Bild generiert (Unbekannter Fehler)");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};
