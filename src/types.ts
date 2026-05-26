export interface Planet {
  id: string;
  name: string;
  nameIndo: string;
  color: string;
  borderColor: string;
  glowColor: string;
  radius: number; // For visualization
  distance: number; // For visualization
  realRadius: string; // Real physical radius (e.g., "6,371 km")
  realDistance: string; // Real distance from Sun (e.g., "149.6 Juta km")
  realTemp: string; // Real average temperature (e.g., "15°C")
  rotation: string; // Time to rotate on axis (e.g., "24 jam")
  revolution: string; // Orbit time around Sun (e.g., "365.25 hari")
  gravity: string; // Gravity compared to Earth (e.g., "9.8 m/s²")
  mass: string; // Mass compared to Earth (e.g., "5.97 x 10^24 kg")
  moons: number; // Number of moons
  moonsList: string[]; // List of major moons
  type: 'star' | 'terrestrial' | 'gas_giant' | 'ice_giant' | 'dwarf';
  funFact: string;
  deskripsi: string;
  structure: {
    core: string;
    mantle: string;
    crust: string;
    atmosphere: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface QuizConfig {
  topic: string;
  difficulty: 'Mudah' | 'Sedang' | 'Sulit';
}
