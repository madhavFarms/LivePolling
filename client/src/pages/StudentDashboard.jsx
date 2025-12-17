import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setNewPoll, updateResults, updateTimer, endPoll, setVoted, setKicked } from '../store/pollSlice';
import { setUser, setParticipants } from '../store/userSlice';
import Chat from '../components/Chat';
import { CheckCircle, XCircle, Sparkles } from 'lucide-react';

export default function StudentDashboard({ socket }) {
  const dispatch = useDispatch();
  const { currentPoll, timeLeft, hasVoted, isKicked } = useSelector((state) => state.poll);
  
  const [localName, setLocalName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    socket.on('new_poll', (poll) => {
        dispatch(setNewPoll(poll));
        setSelectedOption(null);
    });
    socket.on('timer_update', (time) => dispatch(updateTimer(time)));
    socket.on('poll_ended', (poll) => dispatch(endPoll(poll)));
    socket.on('update_results', (poll) => dispatch(updateResults(poll)));
    socket.on('kicked', () => dispatch(setKicked()));
    socket.on('update_users', (users) => dispatch(setParticipants(users)));

    return () => {
        socket.off('new_poll');
        socket.off('timer_update');
        socket.off('poll_ended');
        socket.off('update_results');
        socket.off('kicked');
        socket.off('update_users');
    };
  }, [socket, dispatch]);

  const handleJoin = () => {
    if(!localName) return;
    dispatch(setUser({ name: localName, role: 'student' }));
    socket.emit('join_user', { name: localName, role: 'student' });
    setHasJoined(true);
  };

  const submitVote = () => {
    if(selectedOption !== null && timeLeft > 0) {
        socket.emit('submit_vote', selectedOption);
        dispatch(setVoted());
    }
  };

  // --- KICKED OUT SCREEN (Matches image_cb4dc2.png / image_caefe6.png) ---
  if (isKicked) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-white p-4">
            {/* Purple Badge */}
            <div className="bg-[#6366f1] text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 mb-8 shadow-sm tracking-wide">
                 <Sparkles size={12} fill="white" /> Intervue Poll
            </div>
            {/* Heading */}
            <h1 className="text-[2.5rem] leading-tight text-gray-900 font-normal mb-3 text-center">
                You've been Kicked out !
            </h1>
            {/* Subtext */}
            <p className="text-gray-500 text-center max-w-lg text-lg leading-relaxed font-light">
                Looks like the teacher had removed you from the poll system .Please <br/>
                Try again sometime.
            </p>
        </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="w-full max-w-lg bg-white p-10 rounded-3xl shadow-xl text-center">
            <h1 className="text-4xl font-bold mb-3 text-gray-900">Let's Get Started</h1>
            <input 
                className="w-full bg-gray-100 p-5 rounded-xl mb-6 text-center text-xl font-medium outline-none" 
                placeholder="Enter your Name"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
            />
            <button onClick={handleJoin} className="w-full bg-indigo-600 text-white py-4 rounded-xl text-xl font-bold">Continue</button>
        </div>
      </div>
    );
  }

  const showWaitMessage = !currentPoll || (currentPoll && timeLeft === 0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-gray-50 p-6 overflow-hidden">
      {!currentPoll ? (
        <div className="text-center">
            <div className="animate-spin h-14 w-14 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-700">Wait for the teacher to ask questions..</h2>
        </div>
      ) : (
        <div className="w-full max-w-3xl flex flex-col items-center transform scale-[0.85] origin-center transition-transform">
            <div className="w-full bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 transition-all">
                <div className="flex justify-between items-center text-gray-500 mb-6 font-medium">
                    <span className="text-lg">Question</span>
                    <span className={`text-xl font-mono font-bold ${timeLeft < 10 && timeLeft > 0 ? 'text-red-500' : 'text-gray-700'}`}>
                        {timeLeft === 0 ? "Ended" : `00:${timeLeft < 10 ? `0${timeLeft}` : timeLeft}`}
                    </span>
                </div>
                
                <h2 className="bg-gray-800 text-white p-6 rounded-t-2xl text-xl md:text-2xl font-medium leading-relaxed">
                    {currentPoll.question}
                </h2>
                
                <div className="border border-t-0 p-6 rounded-b-2xl space-y-4">
                    {currentPoll.options.map((opt, idx) => {
                        if (hasVoted || timeLeft === 0) {
                            const percentage = currentPoll.totalVotes === 0 ? 0 : Math.round((opt.count / currentPoll.totalVotes) * 100);
                            const isCorrect = currentPoll.correctIndices && currentPoll.correctIndices.includes(idx);
                            const isSelectedByMe = selectedOption === idx;
                            
                            let borderColor = 'border-gray-100';
                            let textColor = 'text-gray-800';
                            let progressBarColor = 'bg-indigo-200';

                            if(isCorrect) {
                                borderColor = 'border-green-500';
                                progressBarColor = 'bg-green-500';
                                textColor = 'text-white';
                            } else if (isSelectedByMe && !isCorrect) {
                                borderColor = 'border-red-500';
                            }

                            return (
                                <div key={idx} className={`relative h-16 rounded-xl border-2 overflow-hidden ${borderColor}`}>
                                    <div className={`absolute top-0 left-0 h-full ${progressBarColor}`} style={{ width: `${percentage}%` }}></div>
                                    <div className="relative flex justify-between items-center h-full px-6 z-10">
                                        <div className="flex items-center gap-3">
                                            <span className={`font-semibold text-xl ${percentage > 50 || isCorrect ? 'text-white' : 'text-gray-800'}`}>{opt.text}</span>
                                            {isCorrect && <CheckCircle className="text-white" size={20} />}
                                            {isSelectedByMe && !isCorrect && <XCircle className="text-red-500" size={20} />}
                                        </div>
                                        <span className={`font-bold text-xl ${percentage > 50 || isCorrect ? 'text-white' : 'text-gray-800'}`}>{percentage}%</span>
                                    </div>
                                </div>
                            )
                        }
                        
                        return (
                            <div 
                                key={idx} 
                                onClick={() => setSelectedOption(idx)}
                                className={`h-16 flex items-center px-6 rounded-xl cursor-pointer border-2 transition-all text-xl font-medium ${selectedOption === idx ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${selectedOption === idx ? 'bg-white text-indigo-600' : 'bg-gray-200 text-gray-600'}`}>{idx + 1}</span>
                                {opt.text}
                            </div>
                        )
                    })}
                </div>

                {!hasVoted && timeLeft > 0 && (
                    <div className="mt-8 flex justify-end">
                        <button onClick={submitVote} disabled={selectedOption === null} className="px-10 py-4 rounded-xl font-bold text-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg">Submit Answer</button>
                    </div>
                )}
            </div>
            
            {showWaitMessage && (
                <h3 className="mt-8 text-xl font-bold text-gray-800 animate-pulse text-center">Wait for the teacher to ask a new question..</h3>
            )}
        </div>
      )}

      <div className="fixed bottom-8 right-8 w-96 z-50">
          <Chat socket={socket} />
      </div>
    </div>
  );
}