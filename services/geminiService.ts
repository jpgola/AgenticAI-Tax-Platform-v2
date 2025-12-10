import { GoogleGenAI, Chat } from "@google/genai";

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
2. Analyze uploaded document metadata (simulated).
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

export const analyzeDocumentMock = async (fileName: string): Promise<{ text: string, data?: any }> => {
    // In a real app, we would send the image/pdf content to Gemini.
    // Here we simulate an agentic analysis response based on filename.
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing

    if (fileName.toLowerCase().includes('w2') || fileName.toLowerCase().includes('w-2')) {
        return {
            text: "I've analyzed your W-2. It looks like standard employment income. I've extracted your wages and withholdings. Everything seems to match IRS records.",
            data: {
                "Employer EIN": "12-3456789",
                "Wages, Tips": 85000.00,
                "Fed Income Tax": 12500.00,
                "SS Wages": 85000.00,
                "Medicare Wages": 85000.00,
                "State": "CA"
            }
        };
    } else if (fileName.toLowerCase().includes('1099')) {
         return {
            text: "I see a 1099-NEC. Since you have freelance income, I recommend we look into Schedule C deductions for your home office or equipment expenses.",
            data: {
                "Payer Name": "Tech Corp LLC",
                "Payer TIN": "98-7654321",
                "Nonemployee Comp": 15400.00,
                "Fed Tax Withheld": 0.00,
                "State Tax No.": "CA-5542"
            }
        };
    } else {
        return {
            text: "I've processed this document. I'll keep it in your secure Tax Data Vault for reference.",
            data: {
                "Document Date": "2024-03-15",
                "Category": "Uncategorized Expense",
                "Amount": 120.50
            }
        };
    }
};