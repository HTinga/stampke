import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Sparkles, X, StopCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import WaveformLoader from '../ui/WaveformLoader';

interface Props {
  onComplete: (blob: Blob, duration: string) => void;
  onCancel: () => void;
}

export default function MeetingRecording({ onComplete, onCancel }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [volume, setVolume] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Analyser for Volume Meter
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const updateVolume = () => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
        setVolume(average);
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        if (audioContextRef.current) audioContextRef.current.close();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        onComplete(blob, formatTime(seconds));
      };

      mediaRecorder.start();
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch (err) {
      console.error('Mic error:', err);
      alert('Microphone access denied. Please allow microphone access to record meetings.');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    startRecording();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="min-h-[600px] flex flex-col items-center justify-center space-y-12 py-20 bg-[#0d1117] border border-[#30363d] rounded-[2.5rem] relative overflow-hidden shadow-2xl">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="absolute top-8 left-8 flex items-center gap-2">
         <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
         <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">System Online</span>
      </div>

      <div className="absolute top-8 right-8">
        <button onClick={onCancel} className="p-3 bg-[#161b22] hover:bg-[#21262d] rounded-2xl text-[#8b949e] hover:text-white transition-all border border-[#30363d]">
          <X size={20} />
        </button>
      </div>

      <div className="text-center space-y-4 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-[10px] uppercase font-black tracking-[0.2em] mb-4">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
          Active Capture
        </div>
        <h2 className="text-4xl font-black text-white tracking-tight leading-tight">AI is parsing your <br/> conversation...</h2>
        <p className="text-[#8b949e] text-sm max-w-sm mx-auto leading-relaxed">StampKE AI is processing your audio locally and extracting intelligence in real-time.</p>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-violet-600/20 blur-[80px] rounded-full scale-150 transition-transform duration-1000 group-hover:scale-110" />
        <div className="relative flex flex-col items-center gap-10">
          <WaveformLoader />
          
          <div className="flex flex-col items-center gap-1">
             <div className="text-6xl font-mono font-black text-white tracking-tighter tabular-nums">
              {formatTime(seconds)}
            </div>
            <div className="flex gap-0.5 h-1 items-end mt-4">
               {[...Array(20)].map((_, i) => (
                 <div 
                  key={i} 
                  className={`w-1 rounded-full transition-all duration-75 ${i < (volume / 5) ? 'bg-violet-500 h-4' : 'bg-[#30363d] h-1'}`} 
                 />
               ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 relative z-10">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={stopRecording}
          className="flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-orange-600 hover:to-red-600 text-white font-black rounded-[1.25rem] shadow-[0_20px_50px_rgba(220,38,38,0.3)] transition-all group"
        >
          <StopCircle size={28} className="group-hover:scale-110 transition-transform" />
          Stop & Generate Summary
        </motion.button>
        <div className="flex items-center gap-6 text-[10px] font-black text-[#58a6ff] uppercase tracking-widest underline decoration-2 underline-offset-4 cursor-default opacity-80 hover:opacity-100 transition-opacity">
           <span>Speaker: Default</span>
           <span>Mode: Professional</span>
        </div>
      </div>
    </div>
  );
}
