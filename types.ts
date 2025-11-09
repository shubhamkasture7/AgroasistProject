// export type PesticideLog = {
//   id?: string;
//   imageUrl: string;
//   pesticideName: string;
//   farmerName: string;
//   dateISO: string;     // YYYY-MM-DD
//   createdAt?: number;  // resolved on read
// };

export interface User {
  uid: string;
  email: string;
  displayName: string;
}

export interface CurrentWeather {
  temp: number;
  humidity: number;
  description: string;
  icon: string;
}

export interface DailyWeather {
  date: Date;
  min: number;
  max: number;
  description: string;
  icon: string;
}

export interface PesticideLog {
  id: string;
  imageUrl: string;
  pesticideName: string;
  farmerName: string;
  dateISO: string;
  createdAt: number;
  lat?: number;
  lng?: number;
}

// Result wrapper for model (Gemini) responses when they return JSON-like content.
export interface ModelResult {
  // raw text returned by the model
  raw: string;
  // parsed JSON object if parsing succeeded
  json?: any;
  // parsing error message if parsing failed
  parseError?: string;
}
