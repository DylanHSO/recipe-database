import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import BottomNav from './components/BottomNav'
import HomeView from './views/HomeView'
import RecipesView from './views/RecipesView'
import AddView from './views/AddView'
import DetailView from './views/DetailView'
import CookingView from './views/CookingView'
import SettingsView from './views/SettingsView'

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div id="app">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/recipes" element={<RecipesView />} />
            <Route path="/add" element={<AddView />} />
            <Route path="/recipe/:id" element={<DetailView />} />
            <Route path="/recipe/:id/cooking" element={<CookingView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </div>
        <BottomNav />
      </HashRouter>
    </AppProvider>
  )
}
