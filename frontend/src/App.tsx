function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
        <h1 className="text-2xl font-bold text-primary-600 mb-4">
          ÇekSenet
        </h1>
        <p className="text-gray-600 mb-4">
          Çek/Senet Takip Sistemi kurulumu tamamlandı.
        </p>
        <div className="flex gap-2">
          <span className="px-2 py-1 text-xs rounded-full bg-portfoy text-white">Portföy</span>
          <span className="px-2 py-1 text-xs rounded-full bg-tahsil text-white">Tahsil</span>
          <span className="px-2 py-1 text-xs rounded-full bg-karsilıksiz text-white">Karşılıksız</span>
        </div>
      </div>
    </div>
  )
}

export default App
