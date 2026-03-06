import React, { useState } from 'react';
import { COMPATIBILITY_DATA } from '../constants';
import { Search, Smartphone, Battery, Layers } from 'lucide-react';

const Compatibility: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'screen' | 'battery' | 'cover'>('all');
  const [search, setSearch] = useState('');

  const filteredData = COMPATIBILITY_DATA.filter(item => {
    const matchesType = filter === 'all' || item.type === filter;
    const matchesSearch = item.originalText.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const showResults = search.trim().length > 0;

  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-bold text-primary mb-6">فحص توافقات القطع</h1>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
             <Search className="absolute right-3 top-3 text-gray-400" />
             <input 
               className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:outline-none"
               placeholder="ابحث عن موديل الهاتف..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'الكل', icon: null },
              { id: 'screen', label: 'شاشات', icon: Smartphone },
              { id: 'battery', label: 'بطاريات', icon: Battery },
              { id: 'cover', label: 'باغات', icon: Layers },
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setFilter(type.id as any)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors
                  ${filter === type.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                `}
              >
                {type.icon && <type.icon size={16} />}
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!showResults ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-fade-in">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search size={32} className="opacity-40" />
                </div>
                <p className="text-lg font-bold text-gray-500">ابدأ البحث لعرض التوافقات</p>
                <p className="text-sm mt-2 opacity-70">اكتب اسم الجهاز أو الموديل في الخانة أعلاه للبحث في قاعدة البيانات</p>
            </div>
        ) : filteredData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredData.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded
                    ${item.type === 'screen' ? 'bg-blue-100 text-blue-700' :
                      item.type === 'battery' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}
                  `}>
                    {item.type === 'screen' ? 'شاشة' : item.type === 'battery' ? 'بطارية' : 'باغة'}
                  </span>
                </div>
                <p className="text-gray-800 font-medium leading-relaxed" dir="ltr">
                  {item.originalText}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>لا توجد نتائج مطابقة للبحث</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Compatibility;