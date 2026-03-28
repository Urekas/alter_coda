'use client';

import React, { useState } from 'react';
import Canvas from '../components/Canvas';
import Inspector from '../components/Inspector';
import TemplateSidebar from '../components/TemplateSidebar';
import { useCodaStore } from '../store';
import { exportToSportsCodeXML } from '../lib/exportXML';
import { Download, Upload, Play, Square, Plus, Settings2, Code2, ListVideo, Trash2, Square as SquareIcon, Circle, Type, Hash } from 'lucide-react';

export default function Home() {
  const { 
    mode, setMode, addElement, addDecorativeElement, getInstances, getRows, 
    startRecording, stopRecording, timerStatus, currentTime,
    matches, currentMatchId, createNewMatch, deleteMatch,
    elements, loadForm, undoLastAction, activeRows
  } = useCodaStore();

  const [showMatchPrompt, setShowMatchPrompt] = useState(false);
  const [newMatchName, setNewMatchName] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExportForm = () => {
    const activeMatch = matches.find(m => m.id === currentMatchId);
    const payload = {
      name: 'My Coda Form',
      elements,
      decorativeElements: activeMatch?.decorativeElements || []
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_coda_form.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.elements && Array.isArray(json.elements)) {
          loadForm(json);
        } else {
          alert('Invalid form file format.');
        }
      } catch {
        alert('Failed to parse JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    exportToSportsCodeXML(getInstances(), getRows());
  };

  const handleExportMatch = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    exportToSportsCodeXML(match.instances, getRows());
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleModeSwitch = (newMode: 'design' | 'code' | 'timelines') => {
    if (newMode === 'code' && !currentMatchId && matches.length === 0) {
      setShowMatchPrompt(true);
    }
    setMode(newMode);
  };

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMatchName.trim()) {
      createNewMatch(newMatchName.trim());
      setNewMatchName('');
      setShowMatchPrompt(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-gray-900 font-sans">
      <header className="h-auto py-2 border-b border-gray-200 px-6 flex items-center justify-between bg-white z-20 shadow-sm flex-wrap gap-2">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight">Coda<span className="text-blue-600">Builder</span></h1>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200/50">
            <button 
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${mode === 'design' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => handleModeSwitch('design')}
            >
              <Settings2 className="w-4 h-4" /> Design
            </button>
            <button 
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${mode === 'code' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => handleModeSwitch('code')}
            >
              <Code2 className="w-4 h-4" /> Tracking
            </button>
            <button 
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${mode === 'timelines' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => handleModeSwitch('timelines')}
            >
              <ListVideo className="w-4 h-4" /> Timelines
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 space-x-1 flex-wrap">
          {mode === 'design' && (
            <div className="flex items-center gap-1 border-r border-gray-200 pr-4 mr-1 flex-wrap justify-end">
              <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportForm} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-xs font-bold transition-all flex items-center gap-1 shadow-sm border border-purple-200" title="Load JSON Layout"><Upload className="w-3 h-3" /> Import Form</button>
              <button onClick={handleExportForm} className="px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded text-xs font-bold transition-all flex items-center gap-1 shadow-sm border border-orange-200" title="Save JSON Layout"><Download className="w-3 h-3" /> Export Form</button>
              
              <div className="h-6 w-px bg-gray-300 mx-1"></div>
              
              <button className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded text-xs font-bold transition-all flex items-center gap-1 shadow-sm" onClick={() => addElement('row')}><Plus className="w-3 h-3" /> Event</button>
              <button className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-bold transition-all flex items-center gap-1 shadow-sm" onClick={() => addElement('label')}><Plus className="w-3 h-3" /> Tag</button>
              
              <div className="h-6 w-px bg-gray-300 mx-1"></div>
              
              <button className="p-1.5 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 rounded transition-all shadow-sm" title="사각형" onClick={() => addDecorativeElement('rect')}><SquareIcon className="w-4 h-4" /></button>
              <button className="p-1.5 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 rounded transition-all shadow-sm" title="원형" onClick={() => addDecorativeElement('circle')}><Circle className="w-4 h-4" /></button>
              <button className="p-1.5 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 rounded transition-all shadow-sm" title="텍스트" onClick={() => addDecorativeElement('text')}><Type className="w-4 h-4" /></button>
              <button className="p-1.5 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded transition-all shadow-sm" title="카운터" onClick={() => addDecorativeElement('counter')}><Hash className="w-4 h-4" /></button>
            </div>
          )}
          
          {mode === 'code' && (
             <div className="flex items-center gap-2 border-r border-gray-200 pr-4 mr-1">
              {timerStatus === 'idle' ? (
                <button 
                  className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5"
                  onClick={startRecording}
                >
                  <Play className="w-4 h-4" /> Start Timer
                </button>
      ) : (
                <>
                  <button
                    className={`px-5 py-2 text-white rounded-lg text-lg font-bold flex items-center gap-3 shadow-md tracking-wider font-mono cursor-pointer transition-colors ${timerStatus === 'running' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
                    onClick={() => {
                      if (timerStatus === 'running') {
                        const confirmed = window.confirm('정말로 경기 기록을 종료하시겠습니까?');
                        if (confirmed) stopRecording();
                      }
                    }}
                    title={timerStatus === 'running' ? 'Click to stop timer' : 'Timer stopped'}
                    disabled={timerStatus === 'stopped'}
                  >
                    {timerStatus === 'running' ? <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span> : <Square className="w-4 h-4 fill-white" />}
                    {formatTime(currentTime)}
                  </button>
                  <button
                    className="px-3 py-2 bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    onClick={undoLastAction}
                    disabled={Object.keys(activeRows).length === 0 && getInstances().length === 0}
                    title="마지막 기록 취소 (Undo)"
                  >
                    ↩ Undo
                  </button>
                </>
              )}
            </div>
          )}
          
          {mode !== 'timelines' && (
            <button className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-sm" onClick={handleExport}>
              <Download className="w-4 h-4" /> Export XML
            </button>
          )}
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        {mode === 'timelines' ? (
          <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Timeline Matches</h2>
                  <p className="text-gray-500 mt-1">Manage generated logs and export standalone XML packages.</p>
                </div>
                <button onClick={() => setShowMatchPrompt(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all">
                  <Plus className="w-4 h-4" /> New Match
                </button>
              </div>
              {matches.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"><ListVideo className="w-8 h-8" /></div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">No Timelines Generated</h3>
                  <p className="text-gray-500">Create your first match timeline to start registering instances.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {matches.map(match => (
                    <div key={match.id} className="bg-white border border-gray-200 hover:border-blue-300 rounded-xl p-5 shadow-sm transition-colors flex items-center justify-between group">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">{match.name}</h3>
                          {currentMatchId === match.id && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">ACTIVE</span>}
                        </div>
                        <p className="text-sm text-gray-500">Created: {new Date(match.date).toLocaleString()} • Logged Instances: <b>{match.instances.length}</b></p>
                      </div>
                      <div className="flex items-center gap-3 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleExportMatch(match.id)} className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-lg text-sm font-semibold flex items-center gap-2"><Download className="w-4 h-4" /> Download</button>
                        <button onClick={() => deleteMatch(match.id)} className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors border border-transparent hover:border-red-100"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {mode === 'design' && <TemplateSidebar />}
            <Canvas />
            {mode === 'design' && <Inspector />}
          </>
        )}

        {showMatchPrompt && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-[400px]">
              <h3 className="text-lg font-bold text-gray-900 mb-2">새 경기 생성 (New Match)</h3>
              <p className="text-sm text-gray-500 mb-5">새롭게 분석을 시작할 경기 이름을 입력해주세요.</p>
              <form onSubmit={handleCreateMatch}>
                <input type="text" value={newMatchName} onChange={e => setNewMatchName(e.target.value)} placeholder="e.g. Finals Q1" className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-5" autoFocus />
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowMatchPrompt(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors">Start Tracking</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
