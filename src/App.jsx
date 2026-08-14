import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { DashboardOverview } from './pages/DashboardOverview';
import { Tickets } from './pages/Tickets';
import { PDV } from './pages/PDV';
import { Orders } from './pages/Orders';
import { Inventory } from './pages/Inventory';
import { Reports } from './pages/Reports';
import { BoardingCheckin } from './pages/BoardingCheckin';
import { ToastProvider } from './components/Toast';


function PrivateRoute({ children }) {
  const user = localStorage.getItem('currentUser');
  return user ? children : <Navigate to="/" />;
}

function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<DashboardOverview />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="checkin" element={<BoardingCheckin />} />
            <Route path="pdv" element={<PDV />} />
            <Route path="orders" element={<Orders />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
}

export default App;
