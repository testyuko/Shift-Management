import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text) {
      throw new Error('音声テキストが必要です');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // 現在の日付情報を取得
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDate = now.getDate();
    const currentDayOfWeek = now.getDay();

    // AI にJSON出力を要求
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `あなたはシフト入力・削除アシスタントです。ユーザーの自然言語入力を解析して、JSON形式のシフトデータに変換します。

現在の日時情報:
- 今日: ${currentYear}年${currentMonth}月${currentDate}日
- 曜日: ${['日','月','火','水','木','金','土'][currentDayOfWeek]}曜日

出力は必ず以下のJSON形式で返してください（他のテキストは含めないでください）:
{
  "action": "add" または "delete",
  "employeeName": "従業員名（フルネーム）",
  "dates": ["YYYY-MM-DD", ...],
  "startTime": "HH:MM",
  "endTime": "HH:MM",
  "isOff": false
}

変換ルール:
1. アクション判定:
   - 「削除」「消して」「取り消し」などがあれば action: "delete"
   - それ以外は action: "add"
2. 名前: 「中川」だけなら「中川」、「中川太郎」なら「中川太郎」とフルネームを抽出
3. 日付: 
   - "今月の毎週月曜日" → 今月の全ての月曜日の日付を配列で
   - "明日" → 明日の日付（${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(currentDate+1).padStart(2,'0')}）
   - "来週月曜日" → 来週月曜の具体的な日付
   - "全部" → 空配列 []（削除時に全てのシフトを削除する意味）
4. 時刻: 
   - "8時15時" → startTime: "08:00", endTime: "15:00"
   - "9時17時" → startTime: "09:00", endTime: "17:00"
5. 休み: 「休み」「休」と言われたら isOff: true

例:
入力: "中川・今月の毎週月曜日から金曜日まで8時15時"
出力: {"action":"add","employeeName":"中川","dates":["2025-11-04","2025-11-05",...全ての月〜金],"startTime":"08:00","endTime":"15:00","isOff":false}

入力: "田中・明日休み"
出力: {"action":"add","employeeName":"田中","dates":["明日の日付"],"startTime":"","endTime":"","isOff":true}

入力: "中川・今月の月曜日のシフトを削除"
出力: {"action":"delete","employeeName":"中川","dates":["2025-11-04","2025-11-11","2025-11-18","2025-11-25"],"startTime":"","endTime":"","isOff":false}

入力: "田中・全部削除"
出力: {"action":"delete","employeeName":"田中","dates":[],"startTime":"","endTime":"","isOff":false}`
          },
          {
            role: 'user',
            content: `次の入力をJSONに変換してください: ${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'レート制限を超えました。しばらくしてから再度お試しください。' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: '支払いが必要です。Lovable AIワークスペースに資金を追加してください。' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AIゲートウェイエラー');
    }

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data, null, 2));

    // レスポンスからJSONを抽出
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('AIからの応答が空です');
    }

    console.log('AI Content:', content);

    // JSONを抽出（コードブロックで囲まれている場合も対応）
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      const lines = jsonStr.split('\n');
      jsonStr = lines.slice(1, -1).join('\n').trim();
      if (jsonStr.startsWith('json')) {
        jsonStr = jsonStr.substring(4).trim();
      }
    }

    const shiftData = JSON.parse(jsonStr);
    console.log('Parsed shift data:', shiftData);

    // バリデーション
    if (!shiftData.employeeName || !shiftData.dates || !Array.isArray(shiftData.dates)) {
      throw new Error('無効なシフトデータ形式です');
    }

    return new Response(JSON.stringify(shiftData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-shift-voice:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '不明なエラー' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
