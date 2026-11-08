// ===================================================================
// LỄ TỐT NGHIỆP - JAVASCRIPT LOGIC & INTERACTIONS (MINH KHÁNH)
// ===================================================================

document.addEventListener("DOMContentLoaded", () => {
  initDOMContent();
  initAmbientCanvas();
  initAudioPlayer();
  initEnvelopeOpener();
  initCountdown();
  initRSVP();
  initGoogleCalendarLink();
});

/* ===================================================================
   1. POPULATE DOM FROM CONFIG
   =================================================================== */
function initDOMContent() {
  if (typeof CONFIG === "undefined") {
    console.error("CONFIG object not found! Please check config.js.");
    return;
  }

  // Header & Envelope
  setText("env-recipient-name", CONFIG.recipientName || "Em");
  setText("ticket-guest-name", CONFIG.recipientName || "Em");
  setText("ticket-host-name", CONFIG.senderName || "Minh Khánh");
  setText("footer-year", new Date().getFullYear());

  // Letter content
  if (CONFIG.letter) {
    if (CONFIG.letter.title) setText("letter-title", CONFIG.letter.title);
    if (CONFIG.letter.signOff) setText("letter-sign-off", CONFIG.letter.signOff);
    if (CONFIG.letter.senderSign) setText("letter-sender-sign", CONFIG.letter.senderSign);

    const letterBody = document.getElementById("letter-content");
    if (letterBody && Array.isArray(CONFIG.letter.paragraphs)) {
      letterBody.innerHTML = CONFIG.letter.paragraphs
        .map(p => `<p>${escapeHtml(p)}</p>`)
        .join("");
    }
  }

  // Ceremony Details
  if (CONFIG.graduation) {
    setText("info-uni", CONFIG.graduation.university || "Trường Đại học");
    if (CONFIG.graduation.faculty) {
      setText("info-faculty", CONFIG.graduation.faculty);
    }
    setText("info-date", CONFIG.graduation.dateDisplay || "Chủ Nhật, 29/11/2026");
    setText("info-time", CONFIG.graduation.timeDisplay || "Từ 09:00 Sáng");
    setText("info-hall", CONFIG.graduation.locationName || "Hội trường");
    setText("info-address", CONFIG.graduation.address || "12 Nguyễn Văn Bảo, Hạnh Thông, Hồ Chí Minh");

    if (CONFIG.graduation.timeNote) {
      setText("info-timenote", "Đến trước 15 phút");
    }

    const mapsBtn = document.getElementById("btn-maps");
    if (mapsBtn && CONFIG.graduation.googleMapsUrl) {
      mapsBtn.href = CONFIG.graduation.googleMapsUrl;
    }
  }

  // Notes
  if (CONFIG.giftNote) setText("info-gift-note", CONFIG.giftNote);

  // Music metadata
  if (CONFIG.music) {
    if (CONFIG.music.title) setText("music-title", CONFIG.music.title);
    if (CONFIG.music.artist) setText("music-artist", CONFIG.music.artist);
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el && text) el.textContent = text;
}

function escapeHtml(string) {
  return String(string)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ===================================================================
   2. BACKGROUND MUSIC SYSTEM (HTML5 AUDIO + WEB AUDIO BACKUP)
   =================================================================== */
let audioCtx = null;
let isAudioPlaying = false;
let synthTimer = null;
let isSynthMode = false;
const bgAudio = document.getElementById("bg-audio");

function initAudioPlayer() {
  const toggleBtn = document.getElementById("music-toggle-btn");
  const vinylDisc = document.getElementById("vinyl-disc");

  if (bgAudio) {
    bgAudio.volume = 0.85;
    if (CONFIG.music && CONFIG.music.audioSrc) {
      bgAudio.src = CONFIG.music.audioSrc;
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMusic();
    });
  }
  if (vinylDisc) {
    vinylDisc.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMusic();
    });
  }
}

// Crucial: Must be triggered directly inside user click handler to unlock autoplay
function startMusicIfPossible() {
  if (isAudioPlaying) return;
  toggleMusic(true);
}

function toggleMusic(forcePlay = null) {
  const wantPlay = forcePlay !== null ? forcePlay : !isAudioPlaying;

  if (wantPlay) {
    // 1. First try HTML5 audio (music.wav or configured audio file)
    if (bgAudio && bgAudio.src) {
      const playPromise = bgAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          isAudioPlaying = true;
          isSynthMode = false;
          updateMusicUI(true);
        }).catch(err => {
          console.warn("HTML5 audio playback blocked or failed, falling back to Web Audio Piano:", err);
          // 2. Fallback to rich Web Audio Piano Synthesizer
          startSynthPiano();
          isAudioPlaying = true;
          isSynthMode = true;
          updateMusicUI(true);
        });
      }
    } else {
      startSynthPiano();
      isAudioPlaying = true;
      isSynthMode = true;
      updateMusicUI(true);
    }
  } else {
    // Pause
    if (bgAudio) bgAudio.pause();
    stopSynthPiano();
    isAudioPlaying = false;
    updateMusicUI(false);
  }
}

function updateMusicUI(playing) {
  const musicIcon = document.getElementById("music-icon");
  const vinylDisc = document.getElementById("vinyl-disc");
  if (musicIcon) {
    musicIcon.className = playing ? "fa-solid fa-pause" : "fa-solid fa-play";
  }
  if (vinylDisc) {
    if (playing) vinylDisc.classList.add("playing");
    else vinylDisc.classList.remove("playing");
  }
}

// Built-in Acoustic Piano Synthesizer (Backup Engine)
const melodyNotes = [
  [261.63, 329.63, 392.00, 493.88, 523.25], // Cmaj7 (C4, E4, G4, B4, C5)
  [220.00, 261.63, 329.63, 392.00, 440.00], // Am7 (A3, C4, E4, G4, A4)
  [174.61, 261.63, 329.63, 349.23, 440.00], // Fmaj7 (F3, C4, E4, F4, A4)
  [196.00, 246.94, 293.66, 392.00, 493.88]  // G6 (G3, B3, D4, G4, B4)
];

let chordStep = 0;

function startSynthPiano() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  function playNextChord() {
    if (!isAudioPlaying) return;
    const currentChord = melodyNotes[chordStep % melodyNotes.length];
    
    currentChord.forEach((freq, i) => {
      setTimeout(() => {
        if (isAudioPlaying) playGentleNote(freq);
      }, i * 260);
    });

    chordStep++;
    synthTimer = setTimeout(playNextChord, 2600);
  }

  playNextChord();
}

function stopSynthPiano() {
  if (synthTimer) clearTimeout(synthTimer);
  synthTimer = null;
}

function playGentleNote(freq) {
  if (!audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    
    // Fundamental note (warm sine)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);

    // Harmonic overtone (octave) for acoustic sparkle
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 2, now);

    // Piano attack and natural acoustic exponential decay
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.32, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(audioCtx.destination);
    gain2.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.6);
    osc2.stop(now + 2.6);
  } catch (e) {
    console.error("Audio synthesis error:", e);
  }
}

function playChimeSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.3);
      }, idx * 110);
    });
  } catch (e) {}
}

/* ===================================================================
   3. INTERACTIVE ENVELOPE OPENING
   =================================================================== */
function initEnvelopeOpener() {
  const envelopeOverlay = document.getElementById("envelope-overlay");
  const envelopeCard = document.getElementById("envelope-card");
  const waxSealBtn = document.getElementById("wax-seal-btn");

  if (!envelopeOverlay || !envelopeCard) return;

  function openEnvelope() {
    envelopeCard.classList.add("open-anim");
    playChimeSound();

    // Start music synchronously on the user's click gesture
    startMusicIfPossible();

    setTimeout(() => {
      envelopeOverlay.classList.add("opened");
      if (typeof confetti === "function") {
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#C5A059', '#C77D71', '#F5ECDD']
        });
      }
    }, 800);
  }

  if (waxSealBtn) {
    waxSealBtn.addEventListener("click", openEnvelope);
  }
  envelopeCard.addEventListener("click", openEnvelope);
}

/* ===================================================================
   4. AMBIENT CANVAS (FALLING PETALS / BOKEH)
   =================================================================== */
function initAmbientCanvas() {
  const canvas = document.getElementById("ambient-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const petals = [];
  const petalCount = 28;

  for (let i = 0; i < petalCount; i++) {
    petals.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 8 + 6,
      speedY: Math.random() * 0.8 + 0.5,
      speedX: Math.random() * 0.6 - 0.3,
      angle: Math.random() * 360,
      angularSpeed: (Math.random() - 0.5) * 1.5,
      opacity: Math.random() * 0.4 + 0.3,
      color: Math.random() > 0.4 ? "#F4B6AE" : "#E8CDA7"
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    petals.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(p.size / 2, -p.size / 2, p.size, 0);
      ctx.quadraticCurveTo(p.size / 2, p.size / 2, 0, 0);
      ctx.fill();

      ctx.restore();

      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.y * 0.01) * 0.4;
      p.angle += p.angularSpeed;

      if (p.y > height + 20) {
        p.y = -20;
        p.x = Math.random() * width;
      }
      if (p.x > width + 20) p.x = -20;
      if (p.x < -20) p.x = width + 20;
    });

    requestAnimationFrame(render);
  }

  render();
}

/* ===================================================================
   5. COUNTDOWN CLOCK
   =================================================================== */
function initCountdown() {
  const targetDateStr = CONFIG.graduation ? CONFIG.graduation.date : "2026-11-29T09:00:00";
  const targetTime = new Date(targetDateStr).getTime();

  const daysEl = document.getElementById("cd-days");
  const hoursEl = document.getElementById("cd-hours");
  const minutesEl = document.getElementById("cd-minutes");
  const secondsEl = document.getElementById("cd-seconds");

  function update() {
    const now = new Date().getTime();
    const distance = targetTime - now;

    if (distance <= 0) {
      if (daysEl) daysEl.textContent = "00";
      if (hoursEl) hoursEl.textContent = "00";
      if (minutesEl) minutesEl.textContent = "00";
      if (secondsEl) secondsEl.textContent = "00";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, "0");
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}

/* ===================================================================
   6. GOOGLE CALENDAR LINK GENERATION
   =================================================================== */
function initGoogleCalendarLink() {
  const btn = document.getElementById("btn-add-calendar");
  if (!btn || !CONFIG.graduation) return;

  const targetDate = new Date(CONFIG.graduation.date);
  const endDate = new Date(targetDate.getTime() + 3 * 60 * 60 * 1000);

  function formatGCalDate(d) {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  }

  const title = encodeURIComponent(`Lễ Tốt Nghiệp của ${CONFIG.senderName || "Minh Khánh"}`);
  const details = encodeURIComponent(
    `Lễ Tốt Nghiệp của ${CONFIG.senderName || "Minh Khánh"} tại ${CONFIG.graduation.university || ""}.\n` +
    `Thời gian: ${CONFIG.graduation.timeDisplay || "Từ 09:00 Sáng"}\n` +
    `Lưu ý: Mong em đến trước 15p để tránh tụi mình lạc nhau nhé!\n` +
    `Địa chỉ: ${CONFIG.graduation.address || ""}\n` +
    `Rất mong được gặp và chụp cùng em một tấm hình kỷ niệm!`
  );
  const location = encodeURIComponent(`${CONFIG.graduation.locationName || ""}, ${CONFIG.graduation.address || ""}`);
  const dates = `${formatGCalDate(targetDate)}/${formatGCalDate(endDate)}`;

  btn.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}

/* ===================================================================
   7. RSVP LOGIC (ANH - EM, WARM & RESPECTFUL)
   =================================================================== */
function initRSVP() {
  const btnYes = document.getElementById("btn-rsvp-yes");
  const btnBusy = document.getElementById("btn-rsvp-busy");
  const btnMaybe = document.getElementById("btn-rsvp-maybe");
  
  const optionsContainer = document.getElementById("rsvp-options-container");
  const feedbackCard = document.getElementById("rsvp-feedback-card");
  const feedbackBadge = document.getElementById("feedback-badge");
  const feedbackTitle = document.getElementById("feedback-title");
  const feedbackText = document.getElementById("feedback-text");
  const virtualTicket = document.getElementById("virtual-ticket");
  const btnReselect = document.getElementById("btn-reselect-rsvp");

  // Load previous RSVP from localStorage if exists
  const savedRSVP = localStorage.getItem("graduation_rsvp_status");
  if (savedRSVP) {
    applyRSVP(savedRSVP, false);
  }

  if (btnYes) {
    btnYes.addEventListener("click", () => {
      applyRSVP("yes", true);
    });
  }

  if (btnBusy) {
    btnBusy.addEventListener("click", () => {
      applyRSVP("busy", true);
    });
  }

  if (btnMaybe) {
    btnMaybe.addEventListener("click", () => {
      applyRSVP("maybe", true);
    });
  }

  if (btnReselect) {
    btnReselect.addEventListener("click", () => {
      localStorage.removeItem("graduation_rsvp_status");
      feedbackCard.classList.add("hidden");
      optionsContainer.classList.remove("hidden");
    });
  }

  function applyRSVP(status, triggerCelebration = false) {
    localStorage.setItem("graduation_rsvp_status", status);
    optionsContainer.classList.add("hidden");
    feedbackCard.classList.remove("hidden");

    if (status === "yes") {
      feedbackBadge.textContent = "🎉";
      feedbackTitle.textContent = "Anh chờ em nhé!";
      feedbackText.textContent = `Thật sự rất vui khi biết em sẽ đến. Cảm ơn em rất nhiều! Dưới đây là tấm vé danh dự anh dành riêng cho em, hôm đó nhất định tụi mình phải chụp cùng nhau một bức hình thật tươi nhé!`;
      virtualTicket.classList.remove("hidden");

      if (triggerCelebration && typeof confetti === "function") {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.65 },
          colors: ['#C5A059', '#1E293B', '#C77D71', '#48BB78']
        });
      }
    } else if (status === "busy") {
      feedbackBadge.textContent = "💌";
      feedbackTitle.textContent = "Cảm ơn vì lời chúc của em!";
      feedbackText.textContent = `Anh hoàn toàn hiểu mà. Cảm ơn em vì đã luôn chân thành với anh. Dù không gặp nhau hôm ấy, anh vẫn luôn trân trọng những kỷ niệm và sự ủng hộ của em, và chúc em luôn an yên, hạnh phúc!`;
      virtualTicket.classList.add("hidden");
    } else if (status === "maybe") {
      feedbackBadge.textContent = "☕";
      feedbackTitle.textContent = "Cứ thong thả em nhé!";
      feedbackText.textContent = `Em cứ xem lại lịch trình và công việc nhé. Nếu hôm đó em ghé qua được dù chỉ một chút thì tốt quá, còn nếu không kịp cũng đừng bận lòng nhé. Anh luôn trân trọng!`;
      virtualTicket.classList.add("hidden");
    }
  }
}
