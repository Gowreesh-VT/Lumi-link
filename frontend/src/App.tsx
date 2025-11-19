import { Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transmitter from './pages/Transmitter';
import Receiver from './pages/Receiver';
import Network from './pages/Network';
import Analytics from './pages/Analytics';
import About from './pages/About';

function App() {
  return (
    <ThemeProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transmitter" element={<Transmitter />} />
          <Route path="/receiver" element={<Receiver />} />
          <Route path="/network" element={<Network />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;


