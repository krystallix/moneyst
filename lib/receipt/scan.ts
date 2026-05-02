import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
// ─── Types ────────────────────────────────────────────────────────────────────

export type SuggestedSplit = {
    category_id: string;
    category_name: string;
    amount: number;
    /** Actual item name from receipt, e.g. "Ayam Goreng", "Deodorant", "PPN 10%" */
    reason: string;
};

export type ReceiptAnalysis = {
    merchant_name: string | null;
    date: string | null;        // YYYY-MM-DD
    time: string | null;        // HH:MM:SS
    total_amount: number | null;
    currency: string;
    items: { name: string; amount: number }[] | null;
    location: string | null;
    notes: string | null;
    suggested_splits: SuggestedSplit[] | null;
};

export type CategoryHint = {
    id: string;
    name: string;
    type: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const VERCEL_AI_KEY = process.env.EXPO_PUBLIC_VERCEL_AI ?? '';
const VISION_MODEL = 'openai/gpt-4o';
const VERCEL_AI_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions';

// ─── Analyze locally (no upload needed) ──────────────────────────────────────

/**
 * Analyze a LOCAL receipt image using base64 encoding.
 * Passes the user's category list so the AI can recommend splits
 * (e.g. tax → Tax category, service charge → Service category).
 * Does NOT upload anything — that happens later on save.
 */
export async function analyzeReceiptLocally(
    imageUri: string,
    categories: CategoryHint[]
): Promise<ReceiptAnalysis> {
    // Read local image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
    });
    const expenseCats = categories.filter(c => c.type === 'expense');
    const categoryJson = JSON.stringify(expenseCats.map(c => ({ id: c.id, name: c.name })));

    const prompt = `You are a financial receipt analyzer for a budgeting app.

Analyze this receipt image and return a JSON object.
Default currency is IDR unless clearly stated otherwise.

The user has the following expense categories in their app (you MUST only use these — do not invent new ones):
${categoryJson}

Return ONLY a valid JSON object with NO markdown fences, NO explanation:
{
  "merchant_name": string | null,
  "date": "YYYY-MM-DD" | null,
  "time": "HH:MM:SS" | null,
  "total_amount": number | null,
  "currency": "IDR",
  "items": [{ "name": string, "amount": number }] | null,
  "location": string | null,
  "notes": string | null,
  "suggested_splits": [
    {
      "category_id": "<exact id from category list above>",
      "category_name": "<category name>",
      "amount": <number>,
      "reason": "<actual item name from receipt, e.g. Ayam Goreng, Deodorant Rexona, PPN 10%>"
    }
  ] | null
}

Rules for suggested_splits:
- Create ONE split entry PER LINE ITEM visible on the receipt.
- Also create one split for EACH additional charge shown (PPN/pajak, Service Charge, Tip, Delivery Fee, etc.).
- All split amounts MUST sum to total_amount exactly.
- For the "reason" field, use the ACTUAL item or charge name exactly as it appears on the receipt.
- For "category_id" and "category_name": read the category names from the list above, then pick the category whose name BEST matches the nature of the item or charge. You MUST use only ids and names from the provided list — never invent a category.
  Example: if the list has a category named "Pajak & Layanan", use that for PPN/Service Charge. If it has "Makanan & Minuman", use that for food items. Match by reading the actual names.
- If only 1 item with no extra charges → return null for suggested_splits.
- Never guess amounts not clearly visible on the receipt.`;

    console.log('[Receipt] Categories sent to AI:', categoryJson);
    console.log('[Receipt] Calling vision AI with base64 image...');

    const res = await fetch(VERCEL_AI_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${VERCEL_AI_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: VISION_MODEL,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
                    ],
                },
            ],
            max_tokens: 2000,
        }),
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error('[Receipt] Vision API error:', res.status, errText);
        throw new Error(`Vision API error ${res.status}: ${errText}`);
    }

    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? '{}';
    console.log('[Receipt] AI response:', content.slice(0, 400));

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
        const parsed = JSON.parse(cleaned) as ReceiptAnalysis;
        return { ...parsed, currency: parsed.currency ?? 'IDR' };
    } catch {
        throw new Error('Could not parse receipt JSON from AI response');
    }
}

// ─── Upload (called at save time, after user confirms) ────────────────────────

/**
 * Upload a receipt image to Supabase Storage.
 * Called AFTER the user confirms the transaction.
 * Uses FileSystem.uploadAsync — fetch()+FormData cannot upload file:// URIs in RN.
 */
export async function uploadReceiptImage(
    userId: string,
    imageUri: string
): Promise<string> {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const rand = Math.random().toString(36).slice(2, 8);
    const filename = `${ts}-${rand}.jpg`;
    const storagePath = `${userId}/receipt/${filename}`;

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) throw new Error('Supabase env vars not set');

    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token ?? supabaseKey;

    // Android: ImagePicker URIs may live in a temp dir that FileSystem can't
    // access directly. Copy to app-owned cacheDirectory first.
    const stableUri = `${FileSystem.cacheDirectory}receipt-${rand}.jpg`;
    await FileSystem.copyAsync({ from: imageUri, to: stableUri });
    console.log('[Receipt] Copied to cache:', stableUri);

    console.log('[Receipt] Uploading to storage:', storagePath);

    const uploadUrl = `${supabaseUrl}/storage/v1/object/moneyst/${storagePath}`;

    const result = await FileSystem.uploadAsync(uploadUrl, stableUri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        mimeType: 'image/jpeg',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'x-upsert': 'false',
        },
    });

    // Clean up local copy regardless of outcome
    FileSystem.deleteAsync(stableUri, { idempotent: true }).catch(() => {});

    if (result.status < 200 || result.status >= 300) {
        console.error('[Receipt] Upload error:', result.status, result.body);
        throw new Error(`Upload failed (${result.status}): ${result.body}`);
    }

    const { data: publicData } = supabase.storage.from('moneyst').getPublicUrl(storagePath);
    console.log('[Receipt] Uploaded:', publicData.publicUrl);
    return publicData.publicUrl;
}

// ─── Insert splits ────────────────────────────────────────────────────────────

export async function insertTransactionSplits(
    splits: Array<{
        transaction_id: string;
        category_id: string | null;
        amount: number;
        description?: string;
    }>
) {
    if (!splits.length) return;
    const { error } = await supabase.schema('moneyst').from('transaction_splits').insert(splits);
    if (error) throw error;
}

// ─── Merchant helpers ─────────────────────────────────────────────────────────

export async function resolveOrCreateMerchant(
    userId: string,
    merchantName: string
): Promise<string | null> {
    if (!merchantName?.trim()) return null;

    const { data: existing } = await supabase
        .schema('moneyst').from('merchants').select('id')
        .eq('user_id', userId).ilike('name', merchantName.trim())
        .limit(1).maybeSingle();

    if (existing) return existing.id;

    const { data: created, error } = await supabase
        .schema('moneyst').from('merchants')
        .insert({ user_id: userId, name: merchantName.trim() })
        .select('id').single();

    if (error) return null;
    return created.id;
}
