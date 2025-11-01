import { GoogleGenAI, Type } from "@google/genai";
import { MenuItemType, OrderItemType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const model = 'gemini-2.5-flash';

const formatMenuForPrompt = (menu: MenuItemType[]): string => {
  return menu.map(item => `id: ${item.id}, name: ${item.name}, category: ${item.category}`).join('; ');
};

const formatOrderForPrompt = (order: OrderItemType[]): string => {
  if (order.length === 0) return "Belum ada pesanan.";
  return order.map(item => `${item.name} (Qty: ${item.quantity})`).join(', ');
};

export interface RecommendationResponse {
    recommendationText: string;
    recommendedItemId: number | null;
}

export const getMenuRecommendation = async (
  order: OrderItemType[],
  menu: MenuItemType[],
  userQuery?: string
): Promise<RecommendationResponse> => {
  try {
    const fullMenu = formatMenuForPrompt(menu);
    const currentOrder = formatOrderForPrompt(order);

    let prompt: string;

    if (userQuery) {
        prompt = `Anda adalah "SmartCafé Assistant", seorang barista virtual. Berdasarkan menu kafe dan pertanyaan pelanggan, berikan satu rekomendasi yang paling sesuai.

        Menu yang Tersedia (format: id, nama, kategori): 
        ${fullMenu}
        
        Pertanyaan Pelanggan: "${userQuery}"
        
        Tugas Anda:
        1. Buat kalimat rekomendasi yang singkat dan ramah.
        2. Pilih SATU item dari menu yang paling cocok dengan pertanyaan.
        3. Kembalikan jawaban HANYA dalam format JSON.
        `;
    } else {
        prompt = `Anda adalah "SmartCafé Assistant", seorang barista virtual. Berdasarkan pesanan pelanggan saat ini, berikan satu rekomendasi menu tambahan yang cocok.

        Menu yang Tersedia (format: id, nama, kategori): 
        ${fullMenu}
        
        Pesanan Pelanggan Saat Ini: ${currentOrder}
        
        Tugas Anda:
        1. Jika pesanan kosong, rekomendasikan menu spesial. Jika sudah ada pesanan, rekomendasikan item yang melengkapinya.
        2. Buat kalimat rekomendasi yang natural dan menarik (Contoh: "Anda suka Caffe Latte? Coba deh Pandan Waffle kami, cocok banget!").
        3. Pilih SATU item dari menu untuk direkomendasikan.
        4. Kembalikan jawaban HANYA dalam format JSON.`;
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    recommendationText: {
                        type: Type.STRING,
                        description: "Kalimat rekomendasi yang ramah untuk pelanggan."
                    },
                    recommendedItemId: {
                        type: Type.NUMBER,
                        description: "ID dari item menu yang direkomendasikan."
                    }
                },
                required: ["recommendationText", "recommendedItemId"],
            }
        }
    });
    
    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);

    return {
        recommendationText: parsedResponse.recommendationText,
        recommendedItemId: parsedResponse.recommendedItemId ?? null,
    };

  } catch (error) {
    console.error("Error getting recommendation from Gemini API:", error);
    return {
        recommendationText: "Maaf, asisten AI kami sedang istirahat. Silakan coba lagi nanti.",
        recommendedItemId: null
    };
  }
};
