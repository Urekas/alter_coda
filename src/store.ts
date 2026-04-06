import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ElementType = 'row' | 'label';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RowElement extends BaseElement {
  type: 'row';
  code: string;
  color: string;
  leadTime?: number;
  lagTime?: number;
  exclusiveGroup?: string;
}

export interface LabelElement extends BaseElement {
  type: 'label';
  group?: string;
  text: string;
  color?: string;
}

export type UIElement = RowElement | LabelElement;

export interface Shape {
  id: string;
  type: 'rect' | 'circle';
  position: { x: number; y: number };
  size: { width: number; height: number };
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
}

export interface Textbox {
  id: string;
  type: 'text';
  position: { x: number; y: number };
  size: { width: number; height: number };
  text: string;
  fontSize: number;
  fontColor: string;
}

export interface Counter {
  id: string;
  type: 'counter';
  position: { x: number; y: number };
  size: { width: number; height: number };
  label: string;
  count: number;
  color: string;
}

export type DecorativeElement = Shape | Textbox | Counter;

export interface Template {
  id: string;
  name: string;
  updatedAt?: string;
  elements: UIElement[];
  decorativeElements: DecorativeElement[];
}

export interface Instance {
  id: number;
  start: number;
  end: number;
  code: string;
  labels: { group?: string; text: string }[];
}

export interface ActiveRow {
  startTime: number;
  labels: { group?: string; text: string }[];
}

export interface Match {
  id: string;
  name: string;
  date: string;
  instances: Instance[];
  decorativeElements: DecorativeElement[];
  isFinished: boolean;
}

export type TimerStatus = 'idle' | 'running' | 'stopped';

export interface CodaStoreState {
  mode: 'design' | 'code' | 'timelines';
  elements: UIElement[];
  selectedElementId: string | null;
  
  matches: Match[];
  currentMatchId: string | null;
  currentInstanceId: number | null;

  timerStatus: TimerStatus;
  currentTime: number;
  
  templates: Template[];

  // 현재 기록 중인 토글 이벤트 상태 (row elementId -> ActiveRow)
  activeRows: Record<string, ActiveRow>;

  overlapEnabled: boolean;

  setMode: (mode: 'design' | 'code' | 'timelines') => void;
  addElement: (type: ElementType) => void;
  updateElement: (id: string, updates: Partial<UIElement>) => void;
  selectElement: (id: string | null) => void;
  deleteElement: (id: string) => void;
  
  createNewMatch: (name: string) => void;
  deleteMatch: (id: string) => void;
  startRecording: () => void;
  stopRecording: () => void;
  
  addInstance: (code: string, start: number, end: number) => void;
  addLabelToCurrentInstance: (group: string | undefined, text: string) => void;

  setActiveRows: (updater: (prev: Record<string, ActiveRow>) => Record<string, ActiveRow>) => void;
  undoLastAction: () => void;
  
  addDecorativeElement: (type: 'rect' | 'circle' | 'text' | 'counter') => void;
  updateDecorativeElement: (id: string, data: Partial<DecorativeElement>) => void;
  deleteDecorativeElement: (id: string) => void;
  incrementCounter: (id: string) => void;

  saveCurrentForm: (name: string) => void;
  loadForm: (data: { elements: UIElement[], decorativeElements: DecorativeElement[] }) => void;

  // Template Manager
  saveAsNewTemplate: (name: string) => void;
  loadTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;

  getInstances: () => Instance[]; 
  getRows: () => { code: string; color: string }[];
  setOverlapEnabled: (enabled: boolean) => void;
}

let timerInterval: NodeJS.Timeout | null = null;

export const useCodaStore = create<CodaStoreState>()(
  persist(
    (set, get) => ({
      mode: 'design',
      elements: [],
      selectedElementId: null,

      matches: [],
      currentMatchId: null,
      currentInstanceId: null,

      timerStatus: 'idle',
      currentTime: 0,
      
      templates: [],

      activeRows: {},

      overlapEnabled: false,

      setMode: (mode) => set({ mode, selectedElementId: null }),

      setOverlapEnabled: (enabled) => set({ overlapEnabled: enabled }),

      addElement: (type) => {
        set((state) => {
          const newId = Date.now().toString();
          const base: BaseElement = {
            id: newId,
            type,
            x: 50 + (state.elements.length * 10),
            y: 50 + (state.elements.length * 10),
            width: type === 'row' ? 120 : 100,
            height: 60,
          };

          const newElement: UIElement =
            type === 'row'
              ? { ...base, type: 'row', code: 'New Event', color: '#ff0000', leadTime: 0, lagTime: 0 }
              : { ...base, type: 'label', text: 'New Tag', group: '' };

          return {
            elements: [...state.elements, newElement],
            selectedElementId: newId,
          };
        });
      },

      updateElement: (id, updates) => {
        set((state) => ({
          elements: state.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)) as UIElement[],
        }));
      },

      selectElement: (id) => set({ selectedElementId: id }),

      deleteElement: (id) => {
        set((state) => ({
          elements: state.elements.filter((el) => el.id !== id),
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
        }));
      },

      deleteMatch: (id) => {
        set((state) => {
          if (state.currentMatchId === id) {
            if (timerInterval) {
              clearInterval(timerInterval);
              timerInterval = null;
            }
          }
          return {
            matches: state.matches.filter(m => m.id !== id),
            currentMatchId: state.currentMatchId === id ? null : state.currentMatchId,
            timerStatus: state.currentMatchId === id ? 'idle' : state.timerStatus,
            currentTime: state.currentMatchId === id ? 0 : state.currentTime,
          };
        });
      },

      createNewMatch: (name) => {
        set((state) => {
          const newMatch: Match = {
            id: Date.now().toString(),
            name,
            date: new Date().toISOString(),
            instances: [],
            decorativeElements: [],
            isFinished: false,
          };
          
          if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
          }
          
          return {
            matches: [...state.matches, newMatch],
            currentMatchId: newMatch.id,
            timerStatus: 'idle',
            currentTime: 0,
            currentInstanceId: null
          };
        });
      },

      startRecording: () => {
        const { currentMatchId } = get();
        if (!currentMatchId) {
          get().createNewMatch('Match 1');
        }

        if (get().timerStatus !== 'running') {
          set({ timerStatus: 'running' });
          if (!timerInterval) {
            timerInterval = setInterval(() => {
              set((state) => ({ currentTime: state.currentTime + 1 }));
            }, 1000);
          }
        }
      },

      stopRecording: () => {
        set(() => {
          if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
          }
          return { timerStatus: 'stopped' };
        });
      },

      addInstance: (code, start, end) => {
        set((state) => {
          if (!state.currentMatchId) return state;

          const newId = Date.now();
          const newInstance: Instance = { id: newId, start, end, code, labels: [] };
          
          return {
            matches: state.matches.map(m => 
              m.id === state.currentMatchId ? { ...m, instances: [...m.instances, newInstance] } : m
            ),
            currentInstanceId: newId,
          };
        });
      },

      setActiveRows: (updater) => {
        set((state) => ({ activeRows: updater(state.activeRows) }));
      },

      undoLastAction: () => {
        set((state) => {
          const activeRowKeys = Object.keys(state.activeRows);

          // 조건 A: 현재 기록 중인(활성화된) 토글 이벤트가 있으면 가장 최근 것을 취소
          if (activeRowKeys.length > 0) {
            const lastKey = activeRowKeys[activeRowKeys.length - 1];
            const next = { ...state.activeRows };
            delete next[lastKey];
            return { activeRows: next };
          }

          // 조건 B: 활성 이벤트 없으면 완료된 인스턴스 목록에서 마지막 항목 삭제
          if (!state.currentMatchId) return state;
          const match = state.matches.find(m => m.id === state.currentMatchId);
          if (!match || match.instances.length === 0) return state;

          const updatedInstances = match.instances.slice(0, -1);
          return {
            matches: state.matches.map(m =>
              m.id === state.currentMatchId
                ? { ...m, instances: updatedInstances }
                : m
            ),
          };
        });
      },

      addLabelToCurrentInstance: (group, text) => {
        set((state) => {
          if (!state.currentMatchId || !state.currentInstanceId) return state;
          const newLabel = group ? { group, text } : { text };
          
          return {
            matches: state.matches.map(m => {
              if (m.id !== state.currentMatchId) return m;
              return {
                ...m,
                instances: m.instances.map(inst => 
                  inst.id === state.currentInstanceId ? { ...inst, labels: [...inst.labels, newLabel] } : inst
                )
              };
            }),
          };
        });
      },

      addDecorativeElement: (type) => {
        set((state) => {
          let matchId = state.currentMatchId;
          const newMatches = [...state.matches];
          
          if (!matchId) {
            matchId = Date.now().toString();
            newMatches.push({
              id: matchId,
              name: 'Match 1',
              date: new Date().toISOString(),
              instances: [],
              decorativeElements: [],
              isFinished: false,
            });
          }
          
          const newId = Date.now().toString();
          let newElement: DecorativeElement;
          
          const activeMatch = newMatches.find(m => m.id === matchId);
          const decsLen = activeMatch?.decorativeElements.length || 0;
          const x = 50 + (decsLen * 20);
          const y = 80 + (decsLen * 20);

          if (type === 'rect' || type === 'circle') {
            newElement = { id: newId, type, position: { x, y }, size: { width: 100, height: 100 }, backgroundColor: '#3b82f6', borderColor: '#1d4ed8', borderWidth: 0 } as Shape;
          } else if (type === 'text') {
            newElement = { id: newId, type: 'text', position: { x, y }, size: { width: 150, height: 50 }, text: 'New Text', fontSize: 16, fontColor: '#171717' } as Textbox;
          } else {
            newElement = { id: newId, type: 'counter', position: { x, y }, size: { width: 120, height: 80 }, label: 'Counter', count: 0, color: '#ef4444' } as Counter;
          }

          return {
            matches: newMatches.map(m => {
              if (m.id !== matchId) return m;
              return { ...m, decorativeElements: [...m.decorativeElements, newElement] };
            }),
            currentMatchId: matchId,
            selectedElementId: newId,
          };
        });
      },

      updateDecorativeElement: (id, updates) => {
        set((state) => {
          if (!state.currentMatchId) return state;
          return {
            matches: state.matches.map(m => {
              if (m.id !== state.currentMatchId) return m;
              return { ...m, decorativeElements: m.decorativeElements.map((el) => el.id === id ? { ...el, ...updates } as DecorativeElement : el) };
            }),
          };
        });
      },

      deleteDecorativeElement: (id) => {
        set((state) => {
          if (!state.currentMatchId) return state;
          return {
            matches: state.matches.map(m => {
              if (m.id !== state.currentMatchId) return m;
              return { ...m, decorativeElements: m.decorativeElements.filter(el => el.id !== id) };
            }),
            selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
          };
        });
      },

      incrementCounter: (id) => {
        set((state) => {
          if (!state.currentMatchId || state.timerStatus !== 'running') return state;
          return {
            matches: state.matches.map(m => {
              if (m.id !== state.currentMatchId) return m;
              return { ...m, decorativeElements: m.decorativeElements.map(el => {
                if (el.id === id && el.type === 'counter') { return { ...el, count: el.count + 1 }; }
                return el;
              }) };
            }),
          };
        });
      },

      saveCurrentForm: (name) => {
        set((state) => {
          const activeMatch = state.matches.find(m => m.id === state.currentMatchId);
          const newTemplate: Template = {
            id: Date.now().toString(),
            name,
            elements: [...state.elements],
            decorativeElements: activeMatch ? [...activeMatch.decorativeElements] : []
          };
          return { templates: [...state.templates, newTemplate] };
        });
      },

      loadForm: (data) => {
        set((state) => {
          let matchId = state.currentMatchId;
          const newMatches = [...state.matches];
          if (!matchId) {
            matchId = Date.now().toString();
            newMatches.push({ id: matchId, name: 'Imported Match', date: new Date().toISOString(), instances: [], decorativeElements: [], isFinished: false });
          }
          return {
            elements: data.elements || [],
            matches: newMatches.map(m => {
              if (m.id !== matchId) return m;
              return { ...m, decorativeElements: data.decorativeElements || [] };
            }),
            currentMatchId: matchId,
            selectedElementId: null,
          };
        });
      },

      saveAsNewTemplate: (name) => {
        set((state) => {
          const activeMatch = state.matches.find(m => m.id === state.currentMatchId);
          const newTemplate: Template = {
            id: Date.now().toString(),
            name,
            updatedAt: new Date().toISOString(),
            elements: [...state.elements],
            decorativeElements: activeMatch ? [...activeMatch.decorativeElements] : []
          };
          return { templates: [...state.templates, newTemplate] };
        });
      },

      deleteTemplate: (id) => {
        set((state) => ({ templates: state.templates.filter(t => t.id !== id) }));
      },

      loadTemplate: (id) => {
        set((state) => {
          const template = state.templates.find(t => t.id === id);
          if (!template) return state;
          
          let matchId = state.currentMatchId;
          const newMatches = [...state.matches];
          if (!matchId) {
            matchId = Date.now().toString();
            newMatches.push({ id: matchId, name: 'Loaded Template Match', date: new Date().toISOString(), instances: [], decorativeElements: [], isFinished: false });
          }
          return {
            elements: template.elements || [],
            matches: newMatches.map(m => {
              if (m.id !== matchId) return m;
              return { ...m, decorativeElements: template.decorativeElements || [] };
            }),
            currentMatchId: matchId,
            selectedElementId: null,
          };
        });
      },

      getInstances: () => {
        const { currentMatchId, matches } = get();
        const match = matches.find(m => m.id === currentMatchId);
        return match ? match.instances : [];
      },

      getRows: () => {
        const elements = get().elements;
        return elements.filter((el): el is RowElement => el.type === 'row').map((row) => ({ code: row.code, color: row.color }));
      },
    }),
    {
      name: 'coda-storage',
      partialize: (state) => ({
        ...state,
        timerStatus: state.timerStatus === 'running' ? 'stopped' : state.timerStatus,
        activeRows: {}, // 앱 재시작 시 활성 행 초기화
      }),
    }
  )
);
