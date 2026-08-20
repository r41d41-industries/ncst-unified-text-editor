const fs = require("fs");
const path = require("path");

function dictPath(userData) {
  return path.join(userData, "custom-dictionary.json");
}

function loadWords(userData) {
  try {
    const raw = fs.readFileSync(dictPath(userData), "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data.words) ? data.words.map(String) : [];
  } catch {
    return [];
  }
}

function saveWords(userData, words) {
  const unique = [...new Set((words || []).map((w) => String(w).trim()).filter(Boolean))];
  fs.writeFileSync(dictPath(userData), JSON.stringify({ words: unique }, null, 2), "utf8");
  return unique;
}

function addWord(userData, word) {
  const trimmed = String(word || "").trim();
  if (!trimmed) return loadWords(userData);
  const words = loadWords(userData);
  if (!words.includes(trimmed)) words.push(trimmed);
  return saveWords(userData, words);
}

function applyToSession(session, words) {
  for (const w of words || []) {
    try {
      session.addWordToSpellCheckerDictionary(String(w));
    } catch {
      /* Chromium may reject empty or odd tokens */
    }
  }
}

module.exports = { dictPath, loadWords, saveWords, addWord, applyToSession };
