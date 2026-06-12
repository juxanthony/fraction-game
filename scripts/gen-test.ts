import { generateQuestion } from "@/lib/question-generator/generator";

let failures = 0;
for (let level = 1; level <= 7; level++) {
  for (const diff of [1, 2, 3] as const) {
    for (let i = 0; i < 500; i++) {
      const q = generateQuestion(level, diff);
      if (q.options.length !== 4) { console.log("BAD len", level, diff, q.options); failures++; continue; }
      if (q.correctIndex < 0 || q.correctIndex > 3) { console.log("BAD idx", level, diff, JSON.stringify(q.options), q.correctIndex); failures++; continue; }
      const texts = q.options.map(o => o.text);
      if (new Set(texts).size !== 4) { console.log("DUP", level, diff, texts); failures++; continue; }
      if (q.options[q.correctIndex].errorTag) { console.log("CORRECT HAS TAG", level, diff, texts, q.correctIndex); failures++; }
      if (texts.some(t0 => t0.includes("NaN") || t0.includes("Infinity") || t0 === "")) { console.log("BAD VAL", level, diff, texts); failures++; }
    }
  }
}
console.log(failures === 0 ? "ALL GENERATOR TESTS PASSED (9000 questions)" : `FAILURES: ${failures}`);
