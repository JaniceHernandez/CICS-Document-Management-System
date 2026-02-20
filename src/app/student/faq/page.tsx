"use client";

import { useState, useRef, useEffect } from 'react';
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

const FAQS = [
  { 
    q: "How do I download my program checklist?", 
    a: "Navigate to the 'All Documents' section, use the 'Category' filter to select 'Checklists', find your program (BSIT, BSCS, or BSIS), and click the 'Download' button on the document card."
  },
  { 
    q: "I can't log in with my personal Gmail account.", 
    a: "The CICS Docs Hub only accepts institutional Google accounts ending in @neu.edu.ph. Please make sure you are logged into your school account before attempting to sign in."
  },
  { 
    q: "Where can I submit an inquiry about my grades?", 
    a: "While this platform is for document management, you can submit general inquiries in the 'My Inquiries' section. For specific grade concerns, we recommend visiting the CICS Registrar office or using the official university SIS."
  },
  { 
    q: "How often are the documents updated?", 
    a: "Admins update documents as soon as new curriculum changes or university policies are approved. Check the 'Recently Uploaded' sort option in the document library to see the latest files."
  },
];

export default function StudentSupport() {
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Hello! I am the CICS Virtual Assistant. How can I help you with documents or school policies today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      setMessages(prev => [...prev, { role: 'bot', text: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav role="student" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-headline font-bold text-primary">Support & FAQ</h1>
            <p className="text-muted-foreground">Find answers or chat with our AI assistant.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-headline font-bold">Frequently Asked Questions</h2>
                </div>
                <Card className="border-none shadow-sm rounded-2xl">
                  <CardContent className="p-6">
                    <Accordion type="single" collapsible className="w-full">
                      {FAQS.map((faq, i) => (
                        <AccordionItem key={i} value={`item-${i}`} className="border-b last:border-0 border-zinc-100">
                          <AccordionTrigger className="text-left font-bold text-lg py-4 hover:no-underline hover:text-primary transition-colors">
                            {faq.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-4">
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-headline font-bold">Contact Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-none shadow-sm rounded-2xl bg-white p-6 text-center space-y-2">
                    <Mail className="h-6 w-6 text-primary mx-auto" />
                    <p className="font-bold">Email Us</p>
                    <p className="text-sm text-muted-foreground">cics@neu.edu.ph</p>
                  </Card>
                  <Card className="border-none shadow-sm rounded-2xl bg-white p-6 text-center space-y-2">
                    <Phone className="h-6 w-6 text-primary mx-auto" />
                    <p className="font-bold">Call Us</p>
                    <p className="text-sm text-muted-foreground">(02) 8-123-4567</p>
                  </Card>
                  <Card className="border-none shadow-sm rounded-2xl bg-white p-6 text-center space-y-2">
                    <MapPin className="h-6 w-6 text-primary mx-auto" />
                    <p className="font-bold">Visit Us</p>
                    <p className="text-sm text-muted-foreground">CICS Building, NEU</p>
                  </Card>
                </div>
              </section>
            </div>

            <div className="h-[calc(100vh-160px)] sticky top-8">
              <Card className="border-none shadow-2xl rounded-3xl h-full flex flex-col overflow-hidden">
                <CardHeader className="bg-primary text-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-headline font-bold">CICS Assistant</CardTitle>
                        <CardDescription className="text-white/70 flex items-center text-xs">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                          Online & Ready to Help
                        </CardDescription>
                      </div>
                    </div>
                    <Sparkles className="h-5 w-5 text-secondary" />
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50" ref={scrollRef}>
                  {messages.map((m, i) => (
                    <div key={i} className={cn(
                      "flex items-start gap-2 max-w-[85%]",
                      m.role === 'user' ? "ml-auto flex-row-reverse" : ""
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        m.role === 'user' ? "bg-secondary" : "bg-primary"
                      )}>
                        {m.role === 'user' ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-white" />}
                      </div>
                      <div className={cn(
                        "p-3 rounded-2xl text-sm leading-relaxed",
                        m.role === 'user' 
                          ? "bg-primary text-white rounded-tr-none shadow-lg" 
                          : "bg-white text-zinc-800 rounded-tl-none shadow-sm border border-zinc-200"
                      )}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-start gap-2 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-zinc-200 flex items-center gap-1">
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                        <span className="text-xs text-muted-foreground italic">Thinking...</span>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-4 bg-white border-t">
                  <div className="flex w-full gap-2 relative">
                    <Input 
                      placeholder="Ask a question..." 
                      className="rounded-xl h-12 pr-12 focus-visible:ring-primary border-zinc-200"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button 
                      size="icon" 
                      className="absolute right-1 top-1 h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 text-white"
                      onClick={handleSend}
                      disabled={!input.trim() || isTyping}
                    >
                      <Send className="h-4 w-4" />
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

import { cn } from '@/lib/utils';