import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import LeagueOfLegendsMatches from "./pages/LeagueOfLegendsMatches"
import AppLayout from "./Layouts/AppLayout"
import LeagueOfLegendsPage from "./pages/LeagueOfLegendsPage"

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/counter-strike"
          element={<div>Page Counter-Strike</div>}
        />
        <Route
          path="/league-of-legends"
          element={
            <AppLayout currentPage="league-of-legends">
              <LeagueOfLegendsPage />
            </AppLayout>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
