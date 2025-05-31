import { create } from 'zustand';

interface CzmlEntity {
  id: string;
  [key: string]: unknown;
}

interface CzmlStore {
  czml: CzmlEntity[];
  czmlText: string;
  
  setCzml: (newCzml: CzmlEntity[]) => void;
  setCzmlText: (text: string) => void;
  addEntity: (entity: CzmlEntity) => void;
  removeEntity: (entityId: string) => void;
}

export const useCzmlStore = create<CzmlStore>((set, get) => ({
  czml: [{
    id: "document",
    name: "CZML Path",
    version: "1.0"
  }],
  czmlText: `[{
    "id": "document",
    "name": "CZML Path",
    "version": "1.0"
  }]`,

  setCzml: (newCzml) => set({ 
    czml: newCzml,
    czmlText: JSON.stringify(newCzml, null, 2)
  }),

  setCzmlText: (czmlText) => set({ czmlText }),

  addEntity: (entity) => set((state) => {
    const newCzml = [...state.czml, entity];
    return {
      czml: newCzml,
      czmlText: JSON.stringify(newCzml, null, 2)
    };
  }),

  removeEntity: (entityId) => set((state) => {
    const newCzml = state.czml.filter(e => e.id !== entityId);
    return {
      czml: newCzml,
      czmlText: JSON.stringify(newCzml, null, 2)
    };
  })
}));