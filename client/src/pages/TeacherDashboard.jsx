import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setNewPoll, updateResults, updateTimer, endPoll, setHistory } from '../store/pollSlice';
import { setUser, setParticipants } from '../store/userSlice';
import Chat from '../components/Chat';
import { Eye, Plus, StopCircle, CheckCircle } from 'lucide-react';

export default function TeacherDashboard({ socket }) {
  const dispatch = useDispatch();
  
  // Redux State
  const { currentPoll, isActive, timeLeft, history } = useSelector((state) => state.poll);
  const { participants } = useSelector((state) => state.user);
  
  // Local UI State
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [correctIndices, setCorrectIndices] = useState([]); 
  const [duration, setDuration] = useState(60);
  const [viewMode, setViewMode] = useState('create'); 

  // Derived state
  const studentCount = participants.filter(p => p.role === 'student').length;
  const allStudentsVoted = isActive && currentPoll && studentCount > 0 && currentPoll.totalVotes === studentCount;

  useEffect(() => {
    const userPayload = { name: 'Teacher', role: 'teacher' };
    dispatch(setUser(userPayload));
    socket.emit('join_user', userPayload);

    socket.on('new_poll', (poll) => dispatch(setNewPoll(poll)));
    socket.on('update_users', (users) => dispatch(setParticipants(users)));
    socket.on('update_results', (poll) => dispatch(updateResults(poll)));
    socket.on('timer_update', (time) => dispatch(updateTimer(time)));

    socket.on('poll_ended', (poll) => {
        dispatch(endPoll(poll));
        // We do NOT resetForm() here automatically so teacher can see results
    });

    socket.on('history_data', (data) => {
        if(Array.isArray(data)) dispatch(setHistory(data));
    });

    return () => {
        socket.off('new_poll'); 
        socket.off('update_users');
        socket.off('update_results');
        socket.off('timer_update');
        socket.off('poll_ended');
        socket.off('history_data');
    };
  }, [socket, dispatch]);

  const addOption = () => setOptions([...options, '']);
  
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const toggleCorrect = (index, isCorrect) => {
    if (isCorrect) {
        setCorrectIndices(prev => [...new Set([...prev, index])]);
    } else {
        setCorrectIndices(prev => prev.filter(i => i !== index));
    }
  };

  const resetForm = () => {
    setQuestion('');         
    setOptions(['', '']); 
    setCorrectIndices([]); 
    setDuration(60);         
    setViewMode('create');   
  };

  // FINISH EARLY: Emits 'stop_poll' so backend saves history immediately
  const handleFinishEarly = () => {
     socket.emit('stop_poll');
     resetForm();
  };

  const handleCreatePoll = () => {
    if(isActive && !allStudentsVoted) return alert("A poll is already active! Wait for timer or all votes.");
    
    const validOptions = options.filter(o => o.trim() !== '');
    if(!question || validOptions.length < 2) return alert("Enter question and at least 2 options");
    
    if(correctIndices.length === 0) {
        return alert("Please mark at least one option as 'Correct' (Yes).");
    }

    const pollData = { 
        question, 
        options: validOptions, 
        duration: parseInt(duration),
        correctIndices: correctIndices 
    };
    socket.emit('create_poll', pollData);
  };

  const fetchHistory = () => {
    socket.emit('get_history');
    setViewMode('history');
  };

  const currentView = isActive ? 'live' : viewMode;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 flex items-center justify-center">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8 w-full">
        
        {/* Main Content (Polls) */}
        <div className="col-span-12 lg:col-span-8 lg:scale-[0.85] origin-center">
          <div className="flex justify-end mb-6 space-x-4">
            {currentView === 'live' ? (
                <div className="flex items-center gap-4">
                     <div className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span> Live Poll in Progress
                    </div>
                </div>
            ) : currentView === 'history' ? (
                <button onClick={resetForm} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-medium flex gap-2 shadow-sm transition-all">
                    <Plus size={18} /> Ask new question
                </button>
            ) : (
                <button onClick={fetchHistory} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-full font-medium flex gap-2 shadow-sm transition-all">
                    <Eye size={18} /> View History
                </button>
            )}
          </div>

          {/* CREATE FORM */}
          {currentView === 'create' && (
            <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100">
              <div className="mb-8">
                 <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Intervue Poll</span>
                 <h1 className="text-3xl font-bold mt-4 text-gray-900">Let's Get Started</h1>
              </div>
              
              <div className="flex justify-between items-end mb-3">
                  <label className="text-lg font-bold text-gray-800">Enter your question</label>
                  <select value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-gray-100 font-semibold p-2 rounded-lg text-gray-700 outline-none focus:ring-2 ring-indigo-200">
                      <option value="15">15 Seconds</option>
                      <option value="30">30 Seconds</option>
                      <option value="60">60 Seconds</option>
                  </select>
              </div>
              
              <textarea 
                className="w-full bg-gray-50 p-5 rounded-xl text-lg mb-8 border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-32 resize-none" 
                placeholder="Type your question here..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />

              <div className="grid grid-cols-12 gap-6 mb-2">
                <label className="col-span-8 text-lg font-bold text-gray-800">Edit Options</label>
                <label className="col-span-4 text-lg font-bold text-gray-800">Is it Correct?</label>
              </div>

              <div className="space-y-6 mb-8">
                {options.map((opt, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-6 items-center group">
                     {/* Option Input */}
                     <div className="col-span-8 flex gap-4 items-center">
                        <span className="bg-indigo-100 text-indigo-600 w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-lg group-focus-within:bg-indigo-600 group-focus-within:text-white transition-colors">{idx + 1}</span>
                        <input 
                            className="w-full bg-gray-50 p-4 rounded-xl text-lg border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                            value={opt} 
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            placeholder={`Option ${idx + 1}`}
                        />
                     </div>

                     <div className="col-span-4 flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name={`correctOption-${idx}`}
                                checked={correctIndices.includes(idx)} 
                                onChange={() => toggleCorrect(idx, true)}
                                className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                            />
                            <span className="font-semibold text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name={`correctOption-${idx}`}
                                checked={!correctIndices.includes(idx)} 
                                onChange={() => toggleCorrect(idx, false)} 
                                className="w-5 h-5 text-gray-400 border-gray-300 bg-gray-100"
                            />
                            <span className="font-semibold text-gray-400">No</span>
                        </label>
                     </div>
                  </div>
                ))}
                <button onClick={addOption} className="text-indigo-600 font-bold px-2 py-1 hover:bg-indigo-50 rounded-lg transition-colors">+ Add More option</button>
              </div>

              <div className="flex justify-end border-t pt-6">
                  <button onClick={handleCreatePoll} className="bg-indigo-600 text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 transition-all">Ask Question</button>
              </div>
            </div>
          )}

          {/* LIVE POLL VIEW */}
          {currentView === 'live' && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800">Live Results</h2>
                  <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg">
                      <span className="text-gray-500 font-medium">Time Remaining:</span>
                      <span className={`font-mono font-bold text-xl ${timeLeft === 0 ? 'text-red-500' : 'text-indigo-600'}`}>
                          {timeLeft === 0 ? "Ended" : `00:${timeLeft < 10 ? `0${timeLeft}` : timeLeft}`}
                      </span>
                  </div>
              </div>
              <div className="bg-gray-800 text-white p-6 rounded-t-xl text-xl font-medium">{currentPoll?.question}</div>
              <div className="border border-t-0 rounded-b-xl p-6 space-y-5 bg-white">
                  {currentPoll?.options.map((opt, idx) => {
                      const percentage = currentPoll.totalVotes === 0 ? 0 : Math.round((opt.count / currentPoll.totalVotes) * 100);
                      const isCorrect = currentPoll.correctIndices && currentPoll.correctIndices.includes(idx);
                      
                      return (
                          <div key={idx} className={`relative h-14 rounded-lg overflow-hidden border ${isCorrect ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'}`}>
                              <div className={`absolute top-0 left-0 h-full transition-all duration-500 ${isCorrect ? 'bg-green-100' : 'bg-indigo-50'}`} style={{ width: `${percentage}%` }}></div>
                              <div className="relative flex justify-between items-center h-full px-5 z-10">
                                  <div className="flex items-center gap-3">
                                    <span className={`font-semibold text-lg text-gray-700`}>{opt.text}</span>
                                    {isCorrect && <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={12}/> Correct</span>}
                                  </div>
                                  <span className="font-bold text-lg text-gray-700">{percentage}%</span>
                              </div>
                          </div>
                      )
                  })}
              </div>
              <div className="mt-6 flex justify-between items-center">
                  <div className="text-gray-500 font-medium">Total Votes: {currentPoll?.totalVotes} / {studentCount}</div>
                  {allStudentsVoted && (
                    <button onClick={handleFinishEarly} className="animate-bounce bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-lg flex items-center gap-2">
                        <StopCircle size={20} /> Everyone Voted - Ask New Question
                    </button>
                  )}
              </div>
              
              {!isActive && (
                 <div className="mt-6 flex justify-end">
                     <button onClick={resetForm} className="text-indigo-600 font-bold hover:underline flex items-center gap-2">
                        Create New Poll &rarr;
                     </button>
                 </div>
              )}
            </div>
          )}
          
          {/* HISTORY VIEW */}
          {currentView === 'history' && (
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-3xl font-bold mb-8">Poll History</h2>
                {!history || history.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 text-xl">No polls created yet.</div>
                ) : (
                    <div className="space-y-10">
                        {history.map((poll, index) => (
                            <div key={index} className="border-b pb-8 last:border-0">
                                <h3 className="text-gray-500 font-bold mb-3 uppercase tracking-wide text-sm">Question {index + 1}</h3>
                                <div className="bg-gray-700 text-white p-5 rounded-t-xl text-lg font-medium">{poll.question}</div>
                                <div className="border border-t-0 rounded-b-xl p-5 space-y-3">
                                    {poll.options.map((opt, i) => {
                                        const percentage = poll.totalVotes === 0 ? 0 : Math.round((opt.count / poll.totalVotes) * 100);
                                        // Handle correct Indices (array) or backward compatibility
                                        const isCorrect = poll.correctIndices ? poll.correctIndices.includes(i) : (poll.correctOptionIndex === i);

                                        return (
                                            <div key={i} className={`relative h-10 rounded-lg overflow-hidden border ${isCorrect ? 'border-green-500 bg-green-50' : 'bg-gray-50'}`}>
                                                <div className={`absolute top-0 left-0 h-full ${isCorrect ? 'bg-green-200' : 'bg-indigo-200'}`} style={{ width: `${percentage}%` }}></div>
                                                <div className="relative flex justify-between items-center h-full px-4 z-10">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-700">{opt.text}</span>
                                                        {isCorrect && <CheckCircle size={14} className="text-green-600"/>}
                                                    </div>
                                                    <span className="font-bold text-gray-700">{percentage}%</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          )}
        </div>

        {/* Sidebar - CHAT ONLY */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Chat socket={socket} />
        </div>
      </div>
    </div>
  );
}