"use server";

/**
 * Google Cloud Vision API (OCR) - sadece server tarafında.
 */
import { getGoogleVisionApiKey } from "@/lib/config";

export interface DetectDocumentTextResult {
  success: true;
  text: string;
  language: string;
}

export interface DetectDocumentTextError {
  success: false;
  error: string;
}

export type DetectDocumentTextResponse =
  | DetectDocumentTextResult
  | DetectDocumentTextError;

export async function detectDocumentText(
  imageBase64: string
): Promise<DetectDocumentTextResponse> {
  try {
    const apiKey = getGoogleVisionApiKey();
    if (!apiKey) {
      return {
        success: false,
        error: "GOOGLE_CLOUD_VISION_API_KEY tanımlı değil (.env.local)",
      };
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    const body = {
      requests: [
        {
          image: { content: cleanBase64 },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        },
      ],
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Vision API Error:", res.status, err);
      return {
        success: false,
        error: "OCR işlemi başarısız. Lütfen tekrar deneyin.",
      };
    }

    const data = (await res.json()) as {
      responses?: Array<{
        fullTextAnnotation?: {
          text?: string;
          pages?: Array<{
            property?: {
              detectedLanguages?: Array<{ languageCode?: string }>;
            };
          }>;
        };
        textAnnotations?: Array<{ description?: string }>;
      }>;
    };

    const response = data.responses?.[0];
    const fullText = response?.fullTextAnnotation?.text ?? "";
    const firstAnnotation = response?.textAnnotations?.[0]?.description ?? "";
    const text = fullText || firstAnnotation;

    const language =
      response?.fullTextAnnotation?.pages?.[0]?.property?.detectedLanguages?.[0]
        ?.languageCode ?? "tr";

    return {
      success: true,
      text,
      language,
    };
  } catch (error) {
    console.error("Vision API Error:", error);
    return {
      success: false,
      error: "OCR işlemi başarısız. Lütfen tekrar deneyin.",
    };
  }
}
