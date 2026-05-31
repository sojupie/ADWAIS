
export function ChartSkeleton() {
  return (
    <div className="w-full h-full min-h-[300px] flex flex-col justify-end gap-2 p-4 pt-10 animate-pulse">
      <div className="w-full flex-1 flex items-end gap-2">
        <div className="w-full bg-slate-100 rounded-t-md h-[40%]"></div>
        <div className="w-full bg-slate-100 rounded-t-md h-[70%]"></div>
        <div className="w-full bg-slate-100 rounded-t-md h-[50%]"></div>
        <div className="w-full bg-slate-100 rounded-t-md h-[90%]"></div>
        <div className="w-full bg-slate-100 rounded-t-md h-[60%]"></div>
        <div className="w-full bg-slate-100 rounded-t-md h-[80%]"></div>
        <div className="w-full bg-slate-100 rounded-t-md h-[100%]"></div>
      </div>
      <div className="w-full h-6 border-t border-slate-100 flex justify-between pt-2">
        <div className="w-8 h-3 bg-slate-100 rounded"></div>
        <div className="w-8 h-3 bg-slate-100 rounded"></div>
        <div className="w-8 h-3 bg-slate-100 rounded"></div>
      </div>
    </div>
  );
}
