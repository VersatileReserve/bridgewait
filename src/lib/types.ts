export interface ScheduleEntry {
  days: string[];
  times: string[];
  note?: string;
}

export interface Bridge {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  schedule: ScheduleEntry[];
  active: boolean;
  created_at: string;
}
