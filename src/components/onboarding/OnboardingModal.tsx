'use client';

import React, { useState } from 'react';
import { useNeuroStore, AgeGroup } from '@/store/useNeuroStore';
import { motion } from 'framer-motion';
import { User, Rocket, Check, GraduationCap, Briefcase, Baby } from 'lucide-react';

export default function OnboardingModal() {
  const { userName, setUserProfile } = useNeuroStore();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('student');

  if (userName) return null;

  const handleFinish = () => {
    if (name && goal && ageGroup) {
      setUserProfile(name, goal, ageGroup);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black">
      
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/50">
             <Rocket size={32} className="text-white" />
          </div>
        </div>

        {/* ADIM 1: İSİM */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-3xl font-bold text-center text-white mb-2">Hoş Geldin!</h2>
            <p className="text-zinc-400 text-center mb-8">Nöro-Gelişim platformuna giriş yapıyorsun. Seni nasıl çağıralım?</p>
            <div className="relative mb-6">
               <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
               <input autoFocus type="text" placeholder="İsminiz..." value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-4 pl-12 pr-4 text-white text-lg focus:border-purple-500 outline-none transition-colors" onKeyDown={e => e.key === 'Enter' && name && setStep(2)} />
            </div>
            <button onClick={() => setStep(2)} disabled={!name} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Devam Et</button>
          </motion.div>
        )}

        {/* ADIM 2: YAŞ GRUBU (SEGMENTASYON) */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-2xl font-bold text-center text-white mb-2">Hangi gruptasın?</h2>
            <p className="text-zinc-400 text-center mb-8">Sana uygun kitapları hazırlayacağız.</p>
            <div className="space-y-3 mb-8">
               {[
                 { id: 'child', label: 'Çocuk (7-12)', icon: <Baby size={24}/>, desc: 'Eğlenceli masallar ve basit metinler' },
                 { id: 'student', label: 'Öğrenci (13-22)', icon: <GraduationCap size={24}/>, desc: 'Sınav odaklı ve akademik metinler' },
                 { id: 'adult', label: 'Yetişkin & Profesyonel', icon: <Briefcase size={24}/>, desc: 'İş dünyası, derinlik ve kişisel gelişim' }
               ].map((item) => (
                 <button key={item.id} onClick={() => setAgeGroup(item.id as AgeGroup)} className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all text-left ${ageGroup === item.id ? 'bg-purple-600 border-purple-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500'}`}>
                   <div className="p-2 bg-black/20 rounded-lg">{item.icon}</div>
                   <div><div className="font-bold">{item.label}</div><div className="text-xs opacity-70">{item.desc}</div></div>
                   {ageGroup === item.id && <Check className="ml-auto" />}
                 </button>
               ))}
            </div>
            <button onClick={() => setStep(3)} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all">Devam Et</button>
          </motion.div>
        )}

        {/* ADIM 3: HEDEF */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-2xl font-bold text-center text-white mb-2">Son olarak, hedefin?</h2>
            <div className="space-y-3 mb-8 mt-6">
               {[ { id: 'speed', label: 'Hızlı Okuma', icon: '⚡' }, { id: 'focus', label: 'Derin Odaklanma', icon: '🧘' }, { id: 'memory', label: 'Güçlü Hafıza', icon: '🧠' } ].map((item) => (
                 <button key={item.id} onClick={() => setGoal(item.id)} className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all text-left ${goal === item.id ? 'bg-purple-600 border-purple-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500'}`}>
                   <span className="text-2xl">{item.icon}</span><span className="font-bold">{item.label}</span> {goal === item.id && <Check className="ml-auto" />}
                 </button>
               ))}
            </div>
            <button onClick={handleFinish} disabled={!goal} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all">Başla 🚀</button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
