/* ─── Sound alert helpers (Web Audio API, no library) ─────────────────────── */
export function playChime(type = 'success') {
  try {
    const prefersRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersRM) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const frequencies = {
      success: [523.25, 659.25, 783.99], // C5 E5 G5
      alert:   [440, 349.23],            // A4 F4
      ready:   [783.99, 1046.5],         // G5 C6
    }
    const freqs = frequencies[type] || frequencies.success
    freqs.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12)
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.12 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.35)
      osc.start(ctx.currentTime + i * 0.12)
      osc.stop(ctx.currentTime + i * 0.12 + 0.35)
    })
  } catch (_) {
    // Silently fail if Audio API is unavailable
  }
}

/* ─── SMS notification stub ────────────────────────────────────────────────── */
/**
 * In production: replace with a real Twilio/MSG91 API call.
 * Set VITE_TWILIO_SID, VITE_TWILIO_TOKEN, VITE_TWILIO_FROM in .env
 * For now, this logs and returns a mock success.
 */
export async function notifyViaSMS(phone, message) {
  if (!phone) return { ok: false, error: 'No phone number' }
  console.info(`[SMS stub] To: ${phone} | Message: "${message}"`)
  // To wire real Twilio:
  // const resp = await fetch('/api/sms', { method: 'POST', body: JSON.stringify({ phone, message }) })
  // return resp.json()
  return { ok: true, stub: true }
}
