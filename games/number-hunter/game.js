// game.js — O4 Sayı Avcısı (PRD): saf Canvas, nesne havuzlu yükselen balonlar.
// Kaçırma cezası yok (yeni soru gelmez, balon tepeden yeniden başlar); 10 doğru = seviye tamam.
// Soru türü seçilebilir (toplama/çıkarma/çarpma — seviyenin izin verdikleri).
import { makeQuestion, opsForLevel, TARGET_CORRECT, finalize } from "./questions.js";
import { starsFromCorrect } from "../../shared/difficulty.js";
import { sfx } from "../../shared/audio.js";

// Higgsfield balon sprite'ları (build'e dahil)
const spriteMods = import.meta.glob("./assets/balloon-*.png", { eager: true, import: "default", query: "?url" });
const SPRITES = Object.entries(spriteMods)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => {
    const img = new Image();
    img.src = url;
    return img;
  });

export default {
  id: "number-hunter",
  maxLevel: 20,
  start(container, { level, onWin }) {
    const allowed = opsForLevel(level);
    let op = allowed[0];
    let question = null;
    let correctCount = 0;
    let paused = false;
    let raf = 0;
    let lastTs = 0;

    // op seçici
    const opRow = document.createElement("div");
    opRow.className = "hint";
    const opNames = { add: "+", sub: "−", mul: "×" };
    for (const o of allowed) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = opNames[o];
      b.style.cssText = "min-width:56px;min-height:44px;padding:4px 12px";
      b.addEventListener("click", () => {
        op = o;
        question = null; // yeni türde soru
        [...opRow.children].forEach((c) => (c.style.background = ""));
        b.style.background = "var(--success)";
        b.style.color = "#fff";
      });
      opRow.append(b);
    }
    opRow.firstChild.style.background = "var(--success)";
    opRow.firstChild.style.color = "#fff";

    const statusEl = document.createElement("div");
    statusEl.className = "hint";
    statusEl.style.fontSize = "1.1rem";

    // Büyük soru şeridi: çocuk için tek net gösterim
    const questionEl = document.createElement("div");
    questionEl.setAttribute("role", "status");
    questionEl.style.cssText =
      "font-size:clamp(2.6rem,11vw,4.2rem);font-weight:900;text-align:center;color:var(--fg);letter-spacing:2px";

    const wrap = document.createElement("div");
    wrap.style.cssText = "position:relative;width:min(96vw,560px);flex:1;max-height:70vh";
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;touch-action:none;display:block";
    wrap.append(canvas);
    container.append(opRow, questionEl, wrap, statusEl);

    let W = 0;
    let H = 0;
    function resize() {
      const r = wrap.getBoundingClientRect();
      W = r.width;
      H = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // zoom/ekran değişiminde taze okunur
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const ctx = canvas.getContext("2d");
    resize();
    const onResize = () => resize();
    window.addEventListener("resize", onResize); // tek dinleyici kuralı: resize'ı oyun dinler

    // nesne havuzu: 8 balon
    const POOL = 8;
    const balloons = Array.from({ length: POOL }, (_, i) => ({
      active: false,
      x: 0,
      y: 0,
      speed: 0,
      label: "",
      sprite: SPRITES[i % SPRITES.length],
      r: 30,
    }));

    function newQuestion() {
      question = makeQuestion(level);
      questionEl.textContent = question.text; // "1 + 4 = ?" — büyük ve tek
      statusEl.textContent = `🎈 ${correctCount} / ${TARGET_CORRECT}`;
      distributeAnswers();
    }

    function spawn(b) {
      b.active = true;
      b.r = Math.min(W, H) * 0.09 + 14;
      b.x = b.r + Math.random() * Math.max(1, W - 2 * b.r);
      b.y = H + b.r;
      b.speed = (45 + level * 15 + Math.random() * 25) * (H / 500); // px/sn: 1. seviyede de akıcı tırmanış
      b.sprite = SPRITES[Math.floor(Math.random() * SPRITES.length)];
    }

    function distributeAnswers() {
      // doğru cevap tam 1 balonda; diğer 7 balona tekrarsız çeldiriciler
      const labels = new Set([question.answer]);
      let d = 1;
      while (labels.size < POOL) {
        labels.add(Math.max(0, question.answer + (d % 2 === 0 ? d / 2 : -((d - 1) / 2))));
        labels.add(Math.max(0, question.answer + Math.ceil(d / 2)));
        d += 1;
        if (d > 12) { // güvence: geniş aralık
          let x = 20;
          while (labels.size < POOL) labels.add(x++);
        }
      }
      labels.delete(question.answer);
      const distractors = [...labels].slice(0, POOL - 1);
      const idx = Math.floor(Math.random() * POOL);
      let k = 0;
      balloons.forEach((b, i) => {
        b.label = String(i === idx ? question.answer : distractors[k++]);
      });
    }

    function update(ts) {
      raf = requestAnimationFrame(update);
      if (paused) {
        lastTs = ts;
        return;
      }
      const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0);
      lastTs = ts;
      ctx.clearRect(0, 0, W, H);
      // gökyüzü arka planı (hafif degrade)
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#dff1ff");
      grad.addColorStop(1, "#fdf6ec");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      if (!question) newQuestion();
      for (const b of balloons) {
        if (!b.active) {
          if (Math.random() < 0.035) spawn(b);
          continue;
        }
        b.y -= b.speed * dt;
        if (b.y < -b.r) {
          b.active = false; // kaçtı — ceza yok
          continue;
        }
        // balon sprite + etiket
        if (b.sprite.complete) ctx.drawImage(b.sprite, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
        else {
          ctx.fillStyle = "#e74c3c";
          ctx.beginPath();
          ctx.ellipse(b.x, b.y, b.r * 0.85, b.r, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#fff";
        ctx.font = `800 ${Math.round(b.r * 0.62)}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = Math.max(3, b.r * 0.12);
        ctx.strokeStyle = "rgb(0 0 0 / 0.4)";
        ctx.strokeText(b.label, b.x, b.y);
        ctx.fillStyle = "#fff";
        ctx.fillText(b.label, b.x, b.y);
      }
    }
    raf = requestAnimationFrame(update);

    function onTap(e) {
      if (paused || !question) return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      for (const b of balloons) {
        if (!b.active) continue;
        if ((x - b.x) ** 2 + (y - b.y) ** 2 <= (b.r * 1.15) ** 2) {
          b.active = false;
          if (Number(b.label) === question.answer) {
            correctCount += 1;
            sfx.correct();
            statusEl.textContent = `🎈 ${correctCount} / ${TARGET_CORRECT}`;
            if (correctCount >= TARGET_CORRECT) {
              cancelAnimationFrame(raf);
              onWin({ stars: starsFromCorrect(correctCount, TARGET_CORRECT) });
              return;
            }
            question = finalize({ text: question.text, answer: question.answer }); // yeni balon dağılımı
            distributeAnswers();
          } else {
            sfx.wrong(); // nazik geri bildirim, puan yok
          }
          return;
        }
      }
    }
    canvas.addEventListener("pointerdown", onTap);

    return {
      pause() {
        paused = true;
      },
      resume() {
        paused = false;
      },
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        canvas.removeEventListener("pointerdown", onTap);
        container.replaceChildren();
      },
    };
  },
};
