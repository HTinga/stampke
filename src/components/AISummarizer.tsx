import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bot, Loader2, Sparkles, Plus, Search, HelpCircle, 
  Settings as SettingsIcon, Database, Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MeetingDashboard from './meeting/MeetingDashboard';
import MeetingRecording from './meeting/MeetingRecording';
import MeetingDetail from './meeting/MeetingDetail';
import MeetilySidebar from './meeting/MeetilySidebar';

interface Meeting {
  _id: string;
  title: string;
  date: string;
  duration: string;
  transcript: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  notes?: string;
}

export default function AISummarizer() {
  const [view, setView] = useState<'list' | 'recording' | 'detail' | 'settings'>('list');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Fetch meetings from dynamic backend
  const fetchMeetings = useCallback(async () => {
    try {
      const token = localStorage.getItem('tomo_token');
      const res = await fetch('/api/meeting/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMeetings(data.result);
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleRecordingComplete = async (audioBlob: Blob, duration: string) => {
    setView('list'); 
    setProcessing(true);
    
    try {
      const buffer = await audioBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env.GEMINI_API_KEY;

      const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType: audioBlob.type || 'audio/webm', data: base64 } },
              { text: `Analyze this meeting audio. Provide: 
                1. Professional title (suggestedTitle)
                2. Executive summary (summary)
                3. Key discussion points (keyPoints)
                4. Action items (actionItems)
                5. Full transcription (transcript)
                
                Format EXACTLY as JSON:
                {
                  "suggestedTitle": "...",
                  "summary": "...",
                  "keyPoints": ["...", "..."],
                  "actionItems": ["...", "..."],
                  "transcript": "..."
                }` 
              }
            ]
          }]
        })
      });

      const aiData = await aiResponse.json();
      const aiText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      let parsed;
      try {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        parsed = {
          suggestedTitle: 'Meeting Recording',
          summary: aiText || 'No summary generated.',
          keyPoints: [],
          actionItems: [],
          transcript: aiText || 'No transcript generated.'
        };
      }

      const token = localStorage.getItem('tomo_token');
      const saveRes = await fetch('/api/meeting/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: parsed.suggestedTitle,
          duration,
          transcript: parsed.transcript,
          summary: parsed.summary,
          keyPoints: parsed.keyPoints,
          actionItems: parsed.actionItems
        })
      });

      const saveData = await saveRes.json();
      if (saveData.success) {
        setMeetings(prev => [saveData.result, ...prev]);
        setSelectedMeeting(saveData.result);
        setView('detail');
      }
    } catch (err) {
      console.error('AI Meeting error:', err);
      alert('Failed to process meeting. Please ensure your API key is correct.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async (id: string, updates: { title?: string; notes?: string }) => {
    try {
      const token = localStorage.getItem('tomo_token');
      const res = await fetch(`/api/meeting/update/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        setMeetings(prev => prev.map(m => m._id === id ? { ...m, ...updates } : m));
        if (selectedMeeting?._id === id) {
          setSelectedMeeting(prev => prev ? { ...prev, ...updates } : null);
        }
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('tomo_token');
      const res = await fetch(`/api/meeting/delete/${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMeetings(prev => prev.filter(m => m._id !== id));
        if (selectedMeeting?._id === id) {
          setView('list');
          setSelectedMeeting(null);
        }
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="flex h-screen bg-[#0d1117] overflow-hidden">
      {/* Sidebar Navigation */}
      <MeetilySidebar 
        activeView={view} 
        onViewChange={(v) => { setView(v); setSelectedMeeting(null); }} 
        onNewMeeting={() => setView('recording')}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-[#30363d] flex items-center justify-between px-8 bg-[#0d1117] relative z-10 shrink-0">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">
                <Bot size={14} className="text-violet-500" />
                <span>StampKE Transcriber v1.0</span>
                <span className="w-1 h-1 bg-[#30363d] rounded-full" />
                <span className="text-emerald-400">Live Infrastructure</span>
              </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button className="p-2 hover:bg-[#161b22] rounded-xl text-[#8b949e] hover:text-white transition-all"><HelpCircle size={18} /></button>
             <div className="h-8 w-px bg-[#30363d]" />
             <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-black text-white">AD</div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {processing && (
              <motion.div 
                key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6"
              >
                <div className="relative mb-8">
                   <div className="absolute inset-0 bg-violet-600/30 blur-3xl rounded-full animate-pulse" />
                   <Loader2 size={64} className="text-violet-400 animate-spin relative" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Analyzing Meeting Content</h2>
                <p className="text-[#8b949e] max-w-sm">Generating executive summary, extracting action items, and finalizing transcription...</p>
              </motion.div>
            )}

            {view === 'list' && (
              <motion.div 
                key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-6xl mx-auto w-full"
              >
                 {loading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                      <Loader2 size={32} className="text-violet-500 animate-spin mb-4" />
                      <p className="text-[#8b949e] font-bold">Synchronizing your meetings...</p>
                    </div>
                 ) : (
                   <MeetingDashboard 
                     meetings={meetings} 
                     onSelect={(m) => { setSelectedMeeting(m); setView('detail'); }}
                     onDelete={handleDelete}
                     onNew={() => setView('recording')}
                   />
                 )}
              </motion.div>
            )}

            {view === 'recording' && (
              <motion.div 
                key="recording" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                className="max-w-4xl mx-auto w-full"
              >
                <MeetingRecording onComplete={handleRecordingComplete} onCancel={() => setView('list')} />
              </motion.div>
            )}

            {view === 'detail' && selectedMeeting && (
              <motion.div 
                key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="max-w-7xl mx-auto w-full"
              >
                <MeetingDetail 
                  meeting={selectedMeeting} 
                  onBack={() => setView('list')} 
                  onSave={handleUpdate}
                  onDelete={handleDelete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
