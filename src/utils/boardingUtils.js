/**
 * Utilitários para validação de bilhetes e controle de embarque da escuna
 */

/**
 * Toca efeito sonoro sintetizado no navegador via Web Audio API
 * @param {'success' | 'warning' | 'error'} type 
 */
export function playBoardingSound(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'warning') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(349.23, ctx.currentTime); // F4
      osc.frequency.setValueAtTime(329.63, ctx.currentTime + 0.15); // E4
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.setValueAtTime(174.61, ctx.currentTime + 0.15); // F3
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (err) {
    console.warn('Audio Context not allowed or unsupported:', err);
  }
}

/**
 * Valida o estado de um bilhete antes do embarque
 * @param {Object} ticket 
 * @returns {{ valid: boolean, code: 'AUTHORIZED' | 'ALREADY_BOARDED' | 'UNPAID' | 'NOT_FOUND', message: string }}
 */
export function validateTicketForBoarding(ticket) {
  if (!ticket) {
    return { valid: false, code: 'NOT_FOUND', message: 'Bilhete não encontrado no sistema.' };
  }

  if (ticket.status !== 'paid') {
    return { valid: false, code: 'UNPAID', message: 'Embarque Negado: Bilhete com pagamento pendente.' };
  }

  if (ticket.boardingStatus === 'boarded') {
    const timeStr = ticket.boardedAt ? new Date(ticket.boardedAt).toLocaleTimeString('pt-BR') : '';
    return { valid: false, code: 'ALREADY_BOARDED', message: `Atenção: Bilhete JÁ UTILIZADO no embarque às ${timeStr}.` };
  }

  return { valid: true, code: 'AUTHORIZED', message: 'Embarque Autorizado! Boa viagem!' };
}
