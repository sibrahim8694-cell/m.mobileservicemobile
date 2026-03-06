import React, { useState } from 'react';
import { Calculator, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

const Calculators: React.FC = () => {
  const [addPrice, setAddPrice] = useState<string>('');
  const [addPercent, setAddPercent] = useState<string>('');
  const [addResult, setAddResult] = useState<number | null>(null);

  const [subPrice, setSubPrice] = useState<string>('');
  const [subPercent, setSubPercent] = useState<string>('');
  const [subResult, setSubResult] = useState<number | null>(null);

  const calculateAdd = () => {
    const price = parseFloat(addPrice);
    const percent = parseFloat(addPercent);
    if (!isNaN(price) && !isNaN(percent)) {
      setAddResult(price + (price * (percent / 100)));
    }
  };

  const calculateSub = () => {
    const price = parseFloat(subPrice);
    const percent = parseFloat(subPercent);
    if (!isNaN(price) && !isNaN(percent)) {
      setSubResult(price - (price * (percent / 100)));
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
           <Calculator /> الحاسبات السريعة
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        
        {/* Add Percentage Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
           <div className="bg-gradient-to-r from-green-50 to-white p-6 border-b border-green-100 flex justify-between items-center">
             <div>
               <h3 className="text-xl font-bold text-green-700">إضافة نسبة مئوية</h3>
               <p className="text-xs text-green-600 opacity-70">زيادة السعر بنسبة مئوية</p>
             </div>
             <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
               <TrendingUp size={24} />
             </div>
           </div>
           
           <div className="p-6 space-y-6">
             <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">السعر الأساسي</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" 
                    placeholder="0.00"
                    value={addPrice} 
                    onChange={e => setAddPrice(e.target.value)} 
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">النسبة %</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold text-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" 
                    placeholder="%"
                    value={addPercent} 
                    onChange={e => setAddPercent(e.target.value)} 
                  />
                </div>
             </div>

             <button 
               onClick={calculateAdd} 
               className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 flex justify-center items-center gap-2"
             >
               احسب النتيجة <ArrowRight size={18} />
             </button>

             {addResult !== null && (
               <div className="bg-green-50 rounded-xl p-6 text-center border border-green-100 animate-fade-in">
                 <p className="text-sm text-green-600 font-bold mb-1">السعر النهائي</p>
                 <p className="text-4xl font-bold text-green-700 font-mono tracking-tight">{addResult.toFixed(2)} <span className="text-base font-normal text-green-600">د.ل</span></p>
                 <p className="text-xs text-green-500 mt-2">مقدار الزيادة: {(addResult - parseFloat(addPrice || '0')).toFixed(2)} د.ل</p>
               </div>
             )}
           </div>
        </div>

        {/* Subtract Percentage Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
           <div className="bg-gradient-to-r from-red-50 to-white p-6 border-b border-red-100 flex justify-between items-center">
             <div>
               <h3 className="text-xl font-bold text-red-700">خصم نسبة مئوية</h3>
               <p className="text-xs text-red-600 opacity-70">إنقاص السعر بنسبة مئوية</p>
             </div>
             <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
               <TrendingDown size={24} />
             </div>
           </div>
           
           <div className="p-6 space-y-6">
             <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">السعر الأساسي</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" 
                    placeholder="0.00"
                    value={subPrice} 
                    onChange={e => setSubPrice(e.target.value)} 
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">النسبة %</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold text-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" 
                    placeholder="%"
                    value={subPercent} 
                    onChange={e => setSubPercent(e.target.value)} 
                  />
                </div>
             </div>

             <button 
               onClick={calculateSub} 
               className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95 flex justify-center items-center gap-2"
             >
               احسب النتيجة <ArrowRight size={18} />
             </button>

             {subResult !== null && (
               <div className="bg-red-50 rounded-xl p-6 text-center border border-red-100 animate-fade-in">
                 <p className="text-sm text-red-600 font-bold mb-1">السعر بعد الخصم</p>
                 <p className="text-4xl font-bold text-red-700 font-mono tracking-tight">{subResult.toFixed(2)} <span className="text-base font-normal text-red-600">د.ل</span></p>
                 <p className="text-xs text-red-500 mt-2">قيمة الخصم: {(parseFloat(subPrice || '0') - subResult).toFixed(2)} د.ل</p>
               </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default Calculators;