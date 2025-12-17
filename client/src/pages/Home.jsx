import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white p-4">
      <div className="bg-indigo-600 text-white px-6 py-2 rounded-full text-base font-semibold mb-8">✨ Intervue Poll</div>
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Welcome to the Live Polling System</h1>
      <p className="text-gray-500 mb-12 text-lg text-center max-w-2xl">Please select the role that best describes you to begin.</p>
      
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Increased width to w-96, padding to p-10, and text sizes */}
        <div onClick={() => navigate('/student')} className="border-2 border-indigo-100 hover:border-indigo-600 p-10 rounded-3xl cursor-pointer w-full md:w-96 transition-all hover:shadow-xl hover:-translate-y-1 group">
          <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
            <span className="text-3xl">🎓</span>
          </div>
          <h2 className="font-bold text-3xl mb-3 text-gray-800 group-hover:text-indigo-600">I'm a Student</h2>
          <p className="text-gray-500 text-lg leading-relaxed">Submit answers and participate in live polls in real-time.</p>
        </div>

        <div onClick={() => navigate('/teacher')} className="border-2 border-indigo-100 hover:border-indigo-600 p-10 rounded-3xl cursor-pointer w-full md:w-96 transition-all hover:shadow-xl hover:-translate-y-1 group">
          <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
            <span className="text-3xl">👨‍🏫</span>
          </div>
          <h2 className="font-bold text-3xl mb-3 text-gray-800 group-hover:text-indigo-600">I'm a Teacher</h2>
          <p className="text-gray-500 text-lg leading-relaxed">Create polls, view live results, and manage your classroom.</p>
        </div>
      </div>
    </div>
  );
}