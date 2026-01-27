
import React from 'react';
import { useApp } from '../AppContext';
import { Calendar, AlertCircle, Bookmark } from 'lucide-react';

const DeadlineCalendar: React.FC = () => {
  const { deadlines } = useApp();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
        <Calendar size={16} className="text-red-400" /> Lifecycle Calendar
      </h3>
      
      <div className="space-y-2">
        {deadlines.map((deadline) => {
          const date = new Date(deadline.date);
          const isUrgent = (date.getTime() - Date.now()) < (1000 * 60 * 60 * 24 * 7); // Less than 7 days

          return (
            <div key={deadline.id} className="flex gap-4 p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800/50 transition-colors">
              <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border ${isUrgent ? 'border-red-500/50 bg-red-500/10' : 'border-neutral-700 bg-neutral-950'}`}>
                <span className="text-[10px] uppercase font-bold text-neutral-500">
                  {date.toLocaleString('default', { month: 'short' })}
                </span>
                <span className={`text-lg font-mono font-bold ${isUrgent ? 'text-red-500' : 'text-white'}`}>
                  {date.getDate()}
                </span>
              </div>
              <div className="flex-1 py-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-xs font-bold text-neutral-200">{deadline.title}</h4>
                  {isUrgent && <AlertCircle size={12} className="text-red-500 animate-pulse" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500 font-bold uppercase tracking-wider">
                    {deadline.projectId}
                  </span>
                  <span className="text-[9px] text-neutral-600 flex items-center gap-1">
                    <Bookmark size={10} /> {deadline.type}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="pt-2 text-[10px] text-neutral-600 font-mono text-center border-t border-neutral-800/50 italic">
        Viewing current contractual cycle
      </div>
    </div>
  );
};

export default DeadlineCalendar;
