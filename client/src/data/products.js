// MeatZone — temporary in-memory catalog (replace with API later)

export const CATEGORIES = [
  { id: 'mol',     label: "Mol go'shti",   emoji: '🐄', count: 6, gradient: 'from-[#2A1208] to-[#3D1A0E]' },
  { id: 'qoy',     label: "Qo'y go'shti",  emoji: '🐑', count: 4, gradient: 'from-[#1A1220] to-[#251830]' },
  { id: 'tovuq',   label: 'Tovuq',         emoji: '🐓', count: 5, gradient: 'from-[#1E1A08] to-[#2E2810]' },
  { id: 'kolbasa', label: 'Kolbasa',       emoji: '🌭', count: 4, gradient: 'from-[#1A1208] to-[#2D1E10]' },
  { id: 'hazir',   label: 'Tayyorlangan',  emoji: '🥓', count: 3, gradient: 'from-[#200E0E] to-[#381818]' },
  { id: 'muz',     label: 'Muzlatilgan',   emoji: '❄️', count: 2, gradient: 'from-[#0A1622] to-[#102030]' },
]

export const PRODUCTS = [
  { id: 1,  name: "Mol go'shti (muskul)",  meta: '1 kg · Sovutilgan', emoji: '🥩', price: 63700, old: 75000, cat: 'mol',     badge: { tone: 'red',   label: '−15%' },  rating: 4.9, reviews: 124, desc: "Toza mol go'shti, muskul qismi. Tabiiy mahsulot, sovutilgan holda yetkaziladi. Bifitek va qovurma uchun ideal." },
  { id: 2,  name: "Qo'y go'shti premium",  meta: '1 kg · Premium',    emoji: '🐑', price: 85000, old: null,  cat: 'qoy',     badge: null,                              rating: 4.8, reviews: 87,  desc: "Yumshoq va to'yimli qo'y go'shti. Tog' yaylovlarida boqilgan." },
  { id: 3,  name: "Tovuq ko'kragi",        meta: '1 kg · Sovutilgan', emoji: '🍗', price: 38000, old: null,  cat: 'tovuq',   badge: { tone: 'green', label: 'YANGI' }, rating: 4.7, reviews: 56,  desc: "Toza tovuq ko'kragi filesi. Parhez ovqati uchun ideal." },
  { id: 4,  name: 'Kolbasa Beef Premium',  meta: '500 g · Dudlangan', emoji: '🌭', price: 38400, old: 48000, cat: 'kolbasa', badge: { tone: 'red',   label: '−20%' },  rating: 4.6, reviews: 92,  desc: "100% mol go'shtidan tayyorlangan dudlangan kolbasa." },
  { id: 5,  name: 'Qovurish uchun mol',    meta: '800 g · Toza',      emoji: '🥩', price: 54000, old: null,  cat: 'mol',     badge: null,                              rating: 4.8, reviews: 41,  desc: "Qovurish uchun maxsus tanlangan mol go'shti, suyaksiz." },
  { id: 6,  name: 'Tovuq oyoq',            meta: '1 kg · Sovutilgan', emoji: '🍗', price: 28000, old: null,  cat: 'tovuq',   badge: null,                              rating: 4.5, reviews: 33,  desc: "Yangi tovuq oyoqlari. Sho'rva va qovurma uchun." },
  { id: 7,  name: 'Jigar (mol)',           meta: '1 kg · Yangi',      emoji: '🫀', price: 28000, old: null,  cat: 'mol',     badge: { tone: 'amber', label: 'HIT' },   rating: 4.7, reviews: 28,  desc: "Mol jigari. Vitamin va temir bilan to'la." },
  { id: 8,  name: "Qo'zichoq qovurg'a",    meta: '1 kg · Premium',    emoji: '🍖', price: 92000, old: 110000,cat: 'qoy',     badge: { tone: 'red',   label: '−16%' },  rating: 4.9, reviews: 67,  desc: "Yosh qo'zichoq qovurg'asi. To'y va ziyofatlar uchun." },
  { id: 9,  name: 'Pishloqli kolbasa',     meta: '400 g · Dudlangan', emoji: '🌭', price: 32000, old: null,  cat: 'kolbasa', badge: null,                              rating: 4.4, reviews: 19,  desc: "Pishloqli mol kolbasa, bolalar uchun yumshoq." },
  { id: 10, name: 'Tayyor sho\'rva to\'plami', meta: '1.5 kg', emoji: '🥘', price: 72000, old: null, cat: 'hazir', badge: { tone: 'green', label: 'YANGI' }, rating: 4.8, reviews: 12, desc: "Sho'rva uchun tayyor to'plam: go'sht, suyak, sabzavot." },
]

export const PROMOS = [
  { id: 1, tag: 'Bugungi taklif', title: "Mol go'shti\n−15%",   sub: 'Cheklangan miqdorda', emoji: '🥩', variant: 'red' },
  { id: 2, tag: 'Yetkazish',      title: 'Bepul\nyetkazish',     sub: "100 000 so'mdan",     emoji: '🚚', variant: 'dark' },
  { id: 3, tag: 'Haftalik taklif',title: 'Kolbasa\n−20%',        sub: 'Shanba–yakshanba',    emoji: '🌭', variant: 'amber' },
]
