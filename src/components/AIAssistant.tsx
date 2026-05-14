import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, User, Bot, Image as ImageIcon, Trash2 } from 'lucide-react';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [chat, setChat] = useState<{ role: 'user' | 'bot', text: string, image?: string }[]>([
    { role: 'bot', text: 'Bonjour ! Je suis l\'assistant style de Samabutik. Comment puis-je vous aider à sublimer votre allure aujourd\'hui ?' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setSelectedImage({ data: base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && !selectedImage) || loading) return;

    const userMsg = message.trim();
    const currentImg = selectedImage;
    
    setChat(prev => [...prev, { 
      role: 'user', 
      text: userMsg || 'Voici une image pour analyse.', 
      image: currentImg ? `data:${currentImg.mimeType};base64,${currentImg.data}` : undefined 
    }]);
    
    setMessage('');
    setSelectedImage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg || 'Analyse cette image pour me donner des conseils de mode.',
          image: currentImg
        })
      });
      const data = await res.json();
      
      if (data.response) {
        setChat(prev => [...prev, { role: 'bot', text: data.response }]);
      } else {
        setChat(prev => [...prev, { role: 'bot', text: 'Désolé, j\'ai rencontré une petite difficulté technique.' }]);
      }
    } catch (e) {
      setChat(prev => [...prev, { role: 'bot', text: 'Une erreur de connexion est survenue.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center border border-white/20"
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-2xl shadow-luxury border border-primary/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-medium">Assistant Samabutik</h3>
                  <p className="text-[10px] text-white/60 uppercase tracking-widest uppercase">Expert en Style</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background-warm/30">
              {chat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white border border-primary/5 text-primary rounded-tl-none shadow-sm'
                  }`}>
                    {msg.image && (
                      <img src={msg.image} alt="User upload" className="max-w-full rounded-lg mb-2 shadow-sm" />
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-primary/5 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                    <div className="w-1.5 h-1.5 bg-primary/20 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-primary/20 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-primary/20 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Selected Image */}
            {selectedImage && (
              <div className="px-4 py-2 bg-white flex items-center justify-between border-t border-primary/5">
                <div className="flex items-center gap-2">
                  <img 
                    src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                    className="w-10 h-10 object-cover rounded-md" 
                    alt="Preview" 
                  />
                  <span className="text-[10px] text-primary/40 uppercase">Image prête</span>
                </div>
                <button onClick={() => setSelectedImage(null)} className="text-red-500 p-1 hover:bg-red-50 rounded-full">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-primary/5 bg-white">
              <div className="relative flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageSelect}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-primary/40 hover:text-primary transition-colors hover:bg-background-warm rounded-full"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Posez une question..."
                    className="w-full pl-4 pr-10 py-3 bg-background-warm rounded-full text-sm border-none focus:ring-1 focus:ring-primary/20 placeholder:text-primary/30"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={loading}
                    className="absolute right-1.5 top-1.5 p-1.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
