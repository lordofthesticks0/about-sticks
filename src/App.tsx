import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-8 font-sans">
      <div className="flex gap-8 mb-8">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="h-16 w-16 hover:drop-shadow-[0_0_2em_#646cffaa] transition-all" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="h-16 w-16 hover:drop-shadow-[0_0_2em_#61dafbaa] transition-all animate-[spin_20s_linear_infinite]" alt="React logo" />
        </a>
      </div>
      <h1 className="text-5xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Vite + React
      </h1>
      <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-sm shadow-xl flex flex-col items-center">
        <button
          className="bg-zinc-100 text-zinc-950 px-6 py-3 rounded-lg font-medium hover:bg-zinc-200 active:scale-95 transition-all mb-4"
          onClick={() => setCount((count) => count + 1)}
        >
          count is {count}
        </button>
        <p className="text-zinc-400">
          Edit <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-100">src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="mt-8 text-zinc-500 hover:text-zinc-400 transition-colors">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
