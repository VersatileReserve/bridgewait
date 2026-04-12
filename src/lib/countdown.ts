export function getNextOpening(schedule: { days: string[]; times: string[] }[]): Date | null {
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let soonest: Date | null = null;
  for (const entry of schedule) {
    for (const day of entry.days) {
      for (const time of entry.times) {
        const [h, m] = time.split(':').map(Number);
        const candidate = new Date(now);
        const targetDayIndex = dayNames.indexOf(day);
        const todayIndex = now.getDay();
        let daysAhead = (targetDayIndex - todayIndex + 7) % 7;
        if (daysAhead === 0) {
          const candidateToday = new Date(now);
          candidateToday.setHours(h, m, 0, 0);
          if (candidateToday > now) {
            candidate.setHours(h, m, 0, 0);
          } else {
            daysAhead = 7;
            candidate.setDate(candidate.getDate() + daysAhead);
            candidate.setHours(h, m, 0, 0);
          }
        } else {
          candidate.setDate(candidate.getDate() + daysAhead);
          candidate.setHours(h, m, 0, 0);
        }
        if (!soonest || candidate < soonest) soonest = candidate;
      }
    }
  }
  return soonest;
}

export function formatCountdown(target: Date): string {
  const diff = Math.floor((target.getTime() - Date.now()) / 1000);
  if (diff <= 0) return 'Opening now';
  if (diff < 60) return `Opens in ${diff}s`;
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  if (m < 60) return `Opens in ${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `Opens in ${h}h ${m % 60}m`;
}

export function getNextOpenings(schedule: { days: string[]; times: string[] }[], count: number): Date[] {
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const openings: Date[] = [];
  for (const entry of schedule) {
    for (const day of entry.days) {
      for (const time of entry.times) {
        const [h, m] = time.split(':').map(Number);
        const targetDayIndex = dayNames.indexOf(day);
        const todayIndex = now.getDay();
        const daysAhead = (targetDayIndex - todayIndex + 7) % 7;
        const candidate = new Date(now);
        if (daysAhead === 0) {
          const candidateToday = new Date(now);
          candidateToday.setHours(h, m, 0, 0);
          if (candidateToday > now) {
            candidate.setHours(h, m, 0, 0);
          } else {
            candidate.setDate(candidate.getDate() + 7);
            candidate.setHours(h, m, 0, 0);
          }
        } else {
          candidate.setDate(candidate.getDate() + daysAhead);
          candidate.setHours(h, m, 0, 0);
        }
        openings.push(new Date(candidate));
      }
    }
  }
  openings.sort((a, b) => a.getTime() - b.getTime());
  return openings.slice(0, count);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
