import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Layout from "./components/Layout"
import DashboardHome from "./pages/DashboardHome"
import TableView from "./pages/TableView"

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Modern Layout Routes */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="tables/:tableName" element={<TableView />} />
        </Route>
        
        {/* Legacy fallback */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
