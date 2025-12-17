import { BrowserRouter, Routes, Route } from 'react-router-dom';
import io from 'socket.io-client';
import Home from './pages/Home';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Global socket instance
const socket = io.connect(BACKEND_URL);

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/teacher" element={<TeacherDashboard socket={socket} />} />
          <Route path="/student" element={<StudentDashboard socket={socket} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;