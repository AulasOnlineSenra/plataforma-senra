// Constants and synchronous helpers for ENEM Simulado

export const ENEM_TAG = 'Foco ENEM';
export const ENEM_DIA1_MINUTES = 330; // 5h30min
export const ENEM_DIA2_MINUTES = 300; // 5h00min

/** Retorna o último sábado e o último domingo do mês/ano informado */
export function getLastWeekendOfMonth(year: number, month: number) {
  // Último dia do mês (month é 0-indexed aqui)
  const lastDay = new Date(year, month + 1, 0);

  // Último domingo (getDay() === 0)
  const lastSunday = new Date(lastDay);
  lastSunday.setDate(lastDay.getDate() - lastDay.getDay());

  // Último sábado (getDay() === 6) = domingo - 1
  const lastSaturday = new Date(lastSunday);
  lastSaturday.setDate(lastSunday.getDate() - 1);

  return { lastSaturday, lastSunday };
}
