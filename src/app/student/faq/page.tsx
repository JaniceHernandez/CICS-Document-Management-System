
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  HelpCircle, 
  MessageSquare, 
  Send, 
  User, 
  Bot, 
  Sparkles,
  Loader2,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { askChatbot } from '@/ai/flows/faq-chatbot';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

const FAQS = [
  { 
    q: "Where can I find the official BSIS, BSCS, or BSIT checklists?", 
    a: "Official curriculum checklists are located in the 'Institutional Library' section. You can use the 'Category' filter to select 'Checklists' or 'Curriculum' to find the document relevant to your year and program."
  },
  { 
    q: "How do I submit my capstone or research documentation for review?", 
    a: "Navigate to the 'My Submissions' tab and click on 'New Submission'. Ensure you upload a PDF file and provide a clear description. These submissions are private and only visible to you and the CICS administrators."
  },
  { 
    q: "Why can't I see documents from other departments?", 
    a: "The Document Management System is strictly segregated by academic program. You will only see documents targeted at your specific program (e.g., BSCS) or global institutional documents intended for all CICS students."
  },
  { 
    q: "What should I do if my institutional account is not working?", 
    a: "Access to this system requires an @neu.edu.ph Google account. If you are experiencing login issues, please contact the NEU IT Department or visit the CICS Registrar for account verification."
  },
  { 
    q: "Can other students see my uploaded submissions?", 
    a: "No. The system is designed for privacy. Your contributions in the 'My Submissions' folder are strictly isolated and are only accessible by you and authorized CICS Administrators for review."
  },
];

export default function StudentSupport() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Hello! I am the CICS Virtual Assistant. I can help you locate institutional documents, explain submission policies, or answer general university questions. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await askChatbot({ question: userMessage });
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "I'm sorry, I'm having trouble connecting to the CICS Knowledge Base right now. Please try again later or refer to the FAQ section." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (isUserLoading || (!user && !isUserLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav role="student" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-headline font-bold text-primary uppercase tracking-tight">Support & Institutional FAQ</h1>
            <p className="text-muted-foreground text-lg">Official guidance and AI assistance for the CICS community.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <HelpCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-headline font-bold">Frequently Asked Questions</h2>
                </div>
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                  <CardContent className="p-8">
                    <Accordion type="single" collapsible className="w-full">
                      {FAQS.map((faq, i) => (
                        <AccordionItem key={i} value={`item-${i}`} className="border-b last:border-0 border-zinc-100">
                          <AccordionTrigger className="text-left font-bold text-lg py-5 hover:no-underline hover:text-primary transition-colors leading-tight">
                            {faq.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6 pr-8">
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-headline font-bold">Contact Directory</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-none shadow-sm rounded-3xl bg-white p-8 text-center space-y-3 transition-transform hover:scale-105">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="font-bold text-primary">Institutional Email</p>
                    <p className="text-sm text-muted-foreground font-medium">cics@neu.edu.ph</p>
                  </Card>
                  <Card className="border-none shadow-sm rounded-3xl bg-white p-8 text-center space-y-3 transition-transform hover:scale-105">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <Phone className="h-6 w-6 text-amber-600" />
                    </div>
                    <p className="font-bold text-primary">Administrative Hotline</p>
                    <p className="text-sm text-muted-foreground font-medium">(02) 8-123-4567</p>
                  </Card>
                  <Card className="border-none shadow-sm rounded-3xl bg-white p-8 text-center space-y-3 transition-transform hover:scale-105">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <MapPin className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="font-bold text-primary">Campus Office</p>
                    <p className="text-sm text-muted-foreground font-medium line-clamp-2">CICS Building, 2nd Floor, NEU Main Campus</p>
                  </Card>
                </div>
              </section>
            </div>

            <div className="h-[calc(100vh-160px)] sticky top-8">
              <Card className="border-none shadow-2xl rounded-[2.5rem] h-full flex flex-col overflow-hidden bg-white">
                <CardHeader className="bg-primary text-white p-8 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-black/10">
                        <Bot className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-headline font-bold">CICS Assistant</CardTitle>
                        <CardDescription className="text-white/70 flex items-center text-[10px] font-bold uppercase tracking-widest mt-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                          Knowledge Base Active
                        </CardDescription>
                      </div>
                    </div>
                    <Sparkles className="h-6 w-6 text-secondary/50" />
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/50" ref={scrollRef}>
                  {messages.map((m, i) => (
                    <div key={i} className={cn(
                      "flex items-start gap-3 max-w-[90%]",
                      m.role === 'user' ? "ml-auto flex-row-reverse" : ""
                    )}>
                      <div className={cn(
                        "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                        m.role === 'user' ? "bg-secondary text-primary" : "bg-primary text-white"
                      )}>
                        {m.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                      </div>
                      <div className={cn(
                        "p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm",
                        m.role === 'user' 
                          ? "bg-primary text-white rounded-tr-none" 
                          : "bg-white text-zinc-800 rounded-tl-none border border-zinc-100"
                      )}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-start gap-3 max-w-[90%]">
                      <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className="bg-white p-4 rounded-[1.5rem] rounded-tl-none shadow-sm border border-zinc-100 flex items-center gap-3">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Consulting Registry...</span>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-6 bg-white border-t shrink-0">
                  <div className="flex w-full gap-3 relative">
                    <Input 
                      placeholder="Ask about checklists or policies..." 
                      className="rounded-2xl h-14 pr-14 focus-visible:ring-primary border-zinc-200 bg-zinc-50/50"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button 
                      size="icon" 
                      className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
