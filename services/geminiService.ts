import { GoogleGenAI, Chat } from "@google/genai";
import { TaxFormType } from "../types";

// Initialize the Gemini client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// System instruction for the Tax Expert Agent
const SYSTEM_INSTRUCTION = `
You are AgenticAI, a world-class tax expert and filing assistant.
Your goal is to help users file their taxes accurately, maximize deductions, and ensure compliance with IRS regulations.
You are professional, precise, and reassuring.

Capabilities:
1. Explain tax concepts simply.
2. Analyze uploaded document metadata.
3. Suggest potential deductions based on user input.
4. Warn about audit risks.

Always maintain a helpful and secure tone. If you are unsure about a specific tax law, advise the user to consult a CPA for that specific edge case.
Keep responses concise and easy to read.
`;

export const createTaxChatSession = async (userContext?: string): Promise<Chat | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  // Append user context to system instruction if provided
  const instructionWithContext = userContext 
    ? `${SYSTEM_INSTRUCTION}\n\nCURRENT USER TAX DATA:\n${userContext}` 
    : SYSTEM_INSTRUCTION;

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: instructionWithContext,
        temperature: 0.7,
      },
    });
    return chat;
  } catch (error) {
    console.error("Failed to create chat session:", error);
    return null;
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        if (typeof reader.result === 'string') {
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            resolve(reader.result.split(',')[1]);
        } else {
            reject(new Error('Failed to read file'));
        }
    };
    reader.onerror = error => reject(error);
  });
};

export const analyzeDocument = async (file: File): Promise<{ text: string, data?: any, type: string, confidence: number }> => {
    const ai = getAiClient();
    if (!ai) {
        throw new Error("AI Client not configured");
    }

    try {
        const base64Data = await fileToBase64(file);
        
        const prompt = `
        You are an intelligent document processing engine for US Tax Forms. 
        Analyze the attached document image or PDF.
        
        1. CLASSIFY the document into one of these types: ${Object.values(TaxFormType).join(', ')}. If it is not a recognized tax form, classify as "Unknown".
        
        2. EXTRACT relevant data fields based on the document type.
           - W-2: Employer EIN, Wages, Tips, Fed Income Tax, SS Wages, Medicare Wages, State.
           - 1099-NEC: Payer Name, Payer TIN, Nonemployee Comp, Fed Tax Withheld, State Tax No.
           - 1099-DIV: Payer Name, Total Ordinary Dividends, Qualified Dividends, Federal Income Tax Withheld.
           - 1099-INT: Payer Name, Interest Income, Federal Income Tax Withheld.
           - Receipt: Merchant, Date, Amount, Category.
           - Schedule K-1: Entity Name, Ordinary Business Income, Net Rental Real Estate Income.
        
        3. RETURN a JSON object with this structure:
        {
            "type": "Classified Type",
            "confidence": 0.95,
            "summary": "Short description of the document contents.",
            "data": {
                "Field Name": "Value" 
            }
        }
        
        Rules:
        - For monetary values, return them as numbers (e.g. 1050.50), do not include '$' or commas.
        - For IDs (EIN, TIN, Zip), return as strings.
        - If a field is not found, do not invent it. Omit it or use null.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: file.type, data: base64Data } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: 'application/json'
            }
        });

        const responseText = response.text || "{}";
        const result = JSON.parse(responseText);

        return {
            text: result.summary || "Document processed successfully.",
            data: result.data || {},
            type: result.type || "Unknown",
            confidence: result.confidence || 0.5
        };

    } catch (error) {
        console.error("IDP Analysis Error:", error);
        return {
            text: "Failed to analyze document.",
            data: {},
            type: "Unknown",
            confidence: 0
        };
    }
};