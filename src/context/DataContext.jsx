// src/context/DataContext.jsx
import { createContext, useContext } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Demo dataset
export const demoItems = [
  {
    id: 1,
    title: 'Kangal cinsi koyun',
    cat: 'besi',
    region: 'koyler',
    mahalle: 'KÖMÜŞİNİ MAHALLESİ',
    price: 5500,
    unit: 'adet',
    img: 'https://www.turkbesi.com/wp-content/uploads/2019/06/kangal-780x400.jpg',
    desc: 'Sağlıklı ve aşılı, merada beslenmiş koyunlar.'
  },
  {
    id: 2,
    title: 'Gezen tavuk yumurtası',
    cat: 'kumes',
    region: 'ilce-merkez',
    mahalle: 'CAMİKEBİR MAHALLESİ',
    price: 90,
    unit: '30lu',
    img: 'https://images.unsplash.com/photo-1620870634313-01fcc2fd0da0?q=80&w=1742&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    desc: 'Günlük toplanan, doğal beslenen tavuklardan.'
  },
  {
    id: 3,
    title: 'Günlük inek sütü',
    cat: 'sut',
    region: 'koyler',
    mahalle: 'ALPARSLAN MAHALLESİ',
    price: 25,
    unit: 'Litre',
    img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=800&h=600&auto=format&fit=crop&ixlib=rb-4.0.3',
    desc: 'Soğuk zincirde teslim, yağlı ve taze süt.'
  },
  {
    id: 4,
    title: 'Doğal domates',
    cat: 'sebze',
    region: 'ilce-merkez',
    mahalle: 'CUMHURİYET MAHALLESİ',
    price: 18,
    unit: 'Kg',
    img: 'https://images.unsplash.com/photo-1598512752271-33f913a5af13?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    desc: 'Sera ortamında yetişmiş, hormonsuz domatesler.'
  },
  {
    id: 5,
    title: 'Yonca yem balyası',
    cat: 'yem',
    region: 'cevre-ilceler',
    mahalle: 'YEŞİLTEPE MAHALLESİ',
    price: 120,
    unit: 'Bale',
    img: 'https://images.unsplash.com/photo-1683507250287-9eb208bc66e5?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    desc: 'Kurutulmuş yonca balyaları, kaliteli hayvan yemi.'
  },
  {
    id: 6,
    title: 'İkinci El Tarım Aleti',
    cat: 'makine',
    region: 'ilce-merkez',
    mahalle: 'KARŞIYAKA MAHALLESİ',
    price: 6500,
    unit: 'adet',
    img: 'https://images.unsplash.com/photo-1707681055087-ba19e52ccfd5?q=80&w=1752&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    desc: 'Çalışır durumda, bakımlı tarım makinası.'
  }
];

// PWA için güncellenmiş kategoriler - Öncelik: Kümes Hayvanları, Süt Ürünleri, Sebzeler
const categories = [
  { id: 'kumes-hayvanlari', name: 'Kümes Hayvanları', icon: '🐔', img: 'https://images.unsplash.com/photo-1570802685082-2224bd954723?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: 'sut-urunleri', name: 'Süt ve Süt Ürünleri', icon: '🥛', img: 'https://images.unsplash.com/photo-1752401984784-74bb3b095745?q=80&w=800&h=600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: 'sebzeler', name: 'Sebzeler', icon: '🥕', img: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: 'meyveler', name: 'Meyveler', icon: '🍎', img: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: 'tahillar', name: 'Tahıllar', icon: '🌾', img: 'https://images.unsplash.com/photo-1683507250287-9eb208bc66e5?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: 'bakliyat', name: 'Bakliyat', icon: '🫘', img: 'https://images.unsplash.com/photo-1617042375876-a13e36732a04?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: 'buyukbas-hayvanlar', name: 'Büyükbaş Hayvanlar', icon: '🐄', img: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: 'kucukbas-hayvanlar', name: 'Küçükbaş Hayvanlar', icon: '🐑', img: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { id: 'ekipman', name: 'Ekipman', icon: '🚜', img: 'https://images.unsplash.com/photo-1707681055087-ba19e52ccfd5?q=80&w=1752&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }
];

const mahalleler = [
  'ACIKUYU MAHALLESİ', 'ALPARSLAN MAHALLESİ', 'ALTILAR MAHALLESİ',
  'ARŞINCI MAHALLESİ', 'BAHADIRLI MAHALLESİ', 'BEŞKARDEŞ MAHALLESİ',
  'BOZAN MAHALLESİ', 'BURUNAĞIL MAHALLESİ', 'CAMİKEBİR MAHALLESİ',
  'CANIMANA MAHALLESİ', 'CELEP MAHALLESİ', 'CUMHURİYET MAHALLESİ',
  'DEĞİRMENÖZÜ MAHALLESİ', 'DİNEK MAHALLESİ', 'DİPDEDE MAHALLESİ',
  'DOĞUTEPE MAHALLESİ', 'FATİH SULTAN MEHMET MAHALLESİ', 'FEVZİYE MAHALLESİ',
  'GÖKLER MAHALLESİ', 'GÜZELYAYLA MAHALLESİ', 'HİSARKÖY MAHALLESİ',
  'KARACADAĞ MAHALLESİ', 'KARACADERE MAHALLESİ', 'KARAPINAR MAHALLESİ',
  'KARŞIYAKA MAHALLESİ', 'KEMALİYE MAHALLESİ', 'KIRKKUYU MAHALLESİ',
  'KIRKPINAR MAHALLESİ', 'KOZANLI MAHALLESİ', 'KÖMÜŞİNİ MAHALLESİ',
  'KÖSTENGİL MAHALLESİ', 'KÖŞKER MAHALLESİ', 'MANDIRA MAHALLESİ',
  'ÖMERANLI MAHALLESİ', 'SARIYAYLA MAHALLESİ', 'SEYİTAHMETLİ MAHALLESİ',
  'SOĞUKKUYU MAHALLESİ', 'ŞEREFLİ MAHALLESİ', 'TAVLIÖREN MAHALLESİ',
  'TUZYAKA MAHALLESİ', 'YARAŞLI MAHALLESİ', 'YAZIÇAYIR MAHALLESİ',
  'YENİ MAHALLESİ', 'YEŞİLTEPE MAHALLESİ', 'YEŞİLYURT MAHALLESİ',
  'ZİNCİRLİKUYU MAHALLESİ'
];

export const DataProvider = ({ children }) => {
  const value = {
    demoItems,
    categories,
    mahalleler
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
