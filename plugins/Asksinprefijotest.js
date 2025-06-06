import axios from 'axios';
import fetch from 'node-fetch';

const handler = async (msg, { conn, text }) => {
  const chatId = msg.key.remoteJid;

  if (!text) return;

  const name = msg.pushName || 'Usuario';
  const prompt = await getPrompt();
  let result = '';

  await conn.sendMessage(chatId, { react: { text: '🫆', key: msg.key } });

  try {
    result = await luminaiQuery(text, name, prompt);
    result = cleanResponse(result);
  } catch (e) {
    console.error('Error en Luminai:', e);
    try {
      result = await perplexityQuery(text, prompt);
    } catch (e) {
      console.error('Error en Perplexity:', e);
      result = 'Lo siento, no pude generar una respuesta.';
    }
  }

  await conn.sendMessage(chatId, { text: result }, { quoted: msg });
  await conn.sendMessage(chatId, { react: { text: '🪴', key: msg.key } });
};

async function getPrompt() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/elrebelde21/LoliBot-MD/main/src/text-chatgpt.txt');
    return await res.text();
  } catch {
    return 'Eres un asistente inteligente';
  }
}

function cleanResponse(text) {
  return text?.replace(/Maaf,.*|Generated by BLACKBOX\.AI.*|and for API requests.*/g, '').trim();
}

async function luminaiQuery(q, user, prompt) {
  const { data } = await axios.post('https://luminai.my.id', {
    content: q,
    user: user,
    prompt: prompt,
    webSearchMode: true
  });
  return data.result;
}

async function perplexityQuery(q, prompt) {
  const { data } = await axios.get('https://api.perplexity.ai/chat', {
    params: { query: q, context: prompt }
  });
  return data.response;
}

// Activadores del comando
handler.customPrefix = /^ai\s/i; // Detecta "ai <texto>"
handler.command = () => true; // Permite que pase cualquier cosa si se activa el prefix
handler.help = ['ai <pregunta>'];
handler.tags = ['ai'];
handler.register = true;

export default handler;
