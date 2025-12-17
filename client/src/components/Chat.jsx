import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { MessageSquare, X, SendHorizontal, ChevronRight } from 'lucide-react';

export default function Chat({ socket }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'participants'
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  
  // Get data from Redux
  const { name, role, participants } = useSelector((state) => state.user);

  useEffect(() => {
    const handleMessage = (msg) => {
        setMessages((prev) => [...prev, msg]);
    };
    socket.on('receive_message', handleMessage);
    return () => socket.off('receive_message', handleMessage);
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, activeTab]);

  const sendMessage = (e) => {
    e.preventDefault();
    if(inputText.trim()){
        const msgData = { sender: name, text: inputText, time: new Date().toLocaleTimeString() };
        socket.emit('send_message', msgData);
        setInputText('');
    }
  };

  const handleKick = (userId) => {
    if(window.confirm("Are you sure you want to kick this student?")) {
        socket.emit('kick_user', userId);
    }
  };

  if(!isOpen) {
    return (
        <button onClick={() => setIsOpen(true)} className="bg-indigo-600 p-4 rounded-full text-white shadow-lg hover:bg-indigo-700 transition-all fixed bottom-8 right-8 z-50">
            <MessageSquare size={24} />
        </button>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl border w-full h-[32rem] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
        {/* Header with Tabs (Matches image_caec87.png) */}
        <div className="flex flex-col bg-white border-b">
            <div className="flex justify-end p-2">
                 <button onClick={() => setIsOpen(false)} className="hover:bg-gray-100 rounded-full p-1"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="flex px-6 gap-8">
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`pb-3 text-[15px] font-semibold transition-colors relative ${activeTab === 'chat' ? 'text-gray-900' : 'text-gray-500'}`}
                >
                    Chat
                    {activeTab === 'chat' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#8b5cf6] rounded-t-full"></span>}
                </button>
                <button 
                    onClick={() => setActiveTab('participants')}
                    className={`pb-3 text-[15px] font-semibold transition-colors relative ${activeTab === 'participants' ? 'text-gray-900' : 'text-gray-500'}`}
                >
                    Participants
                    {activeTab === 'participants' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#8b5cf6] rounded-t-full"></span>}
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white scrollbar-thin relative">
            {activeTab === 'chat' ? (
                <div className="p-4 space-y-4">
                    {messages.length === 0 && <div className="text-center text-gray-300 text-sm mt-10">Start the conversation...</div>}
                    {messages.map((msg, i) => {
                        const isMe = msg.sender === name;
                        return (
                            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] text-gray-400 mb-1 px-1">{msg.sender}</span>
                                <div className={`px-4 py-2 rounded-2xl text-[14px] max-w-[85%] break-words shadow-sm ${isMe ? 'bg-[#6366f1] text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>
            ) : (
                // PARTICIPANTS LIST VIEW (Matches image_caec87.png)
                <div className="p-6">
                    {/* Header Row */}
                    <div className="flex justify-between text-gray-400 text-[13px] font-medium mb-5 px-1">
                        <span>Name</span>
                        <span>Action</span>
                    </div>
                    
                    {/* List */}
                    <div className="space-y-6">
                        {participants.map((u) => (
                            <div key={u.id} className="flex justify-between items-center px-1">
                                <span className="font-bold text-gray-900 text-[15px]">
                                    {u.name} {u.name === name && '(You)'}
                                </span>
                                
                                {/* KICK LINK - Blue text "Kick out" */}
                                {role === 'teacher' && u.role === 'student' ? (
                                    <button 
                                        onClick={() => handleKick(u.id)}
                                        className="text-[#2563eb] hover:text-blue-800 text-[13px] font-semibold border-b border-[#2563eb] hover:border-blue-800 leading-tight"
                                    >
                                        Kick out
                                    </button>
                                ) : (
                                    <span className="text-gray-300 text-xs select-none">--</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Chat Input with Custom Send Button (Matches image_cad5e2.png) */}
        {activeTab === 'chat' && (
            <form onSubmit={sendMessage} className="p-4 border-t bg-white flex items-center gap-3">
                <input 
                    className="flex-1 bg-white p-2 text-sm outline-none placeholder-gray-400 text-gray-700"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
                <button 
                    type="submit" 
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors group"
                >
                    <ChevronRight size={24} className="text-black ml-0.5 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                </button>
            </form>
        )}
    </div>
  );
}