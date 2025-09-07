
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Send, Languages, Loader2, Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSchemeExplanation, getEligibility } from './actions';
import { SchemeExplanation } from '@/components/scheme-explanation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ExplainGovernmentSchemeOutput } from '@/ai/flows/explain-government-schemes';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: React.ReactNode;
}

const schemeQuestions: Record<string, string[]> = {
  'PMAY': ['Does your family own a pucca house already?'],
  'PM-Kisan': ['Do you own less than 2 hectares of cultivable land?'],
  'Ayushman Bharat': [
    'Is any member of your family a government employee?',
    'Does your family own a motorized vehicle or agricultural equipment?',
  ],
};

type ExtendedExplainOutputType = ExplainGovernmentSchemeOutput & {
  schemeName: string;
};

export default function Home() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'bot',
      content: 'Welcome to Sarkari Mitra! How can I help you today? Ask me about a government scheme like "PMAY", "PM-Kisan", or "Ayushman Bharat".',
    },
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] =useState('English');
  const [isPending, startTransition] = useTransition();

  const [eligibilityState, setEligibilityState] = useState<{
    isActive: boolean;
    schemeName: string;
    questionIndex: number;
    answers: boolean[];
  } | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const addMessage = (role: 'user' | 'bot', content: React.ReactNode) => {
    const id = Date.now().toString() + Math.random();
    setMessages((prev) => [...prev, { id, role, content }]);
    return id;
  };

  const updateMessage = (id: string, content: React.ReactNode) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, content } : msg))
    );
  };
  
  const disableInputs = isPending || eligibilityState?.isActive;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disableInputs) return;

    addMessage('user', input);
    const currentInput = input;
    setInput('');

    startTransition(async () => {
      const loadingId = addMessage('bot', <Loader2 className="animate-spin text-primary" />);
      const result = await getSchemeExplanation({ query: currentInput, language });

      if ('error' in result) {
        updateMessage(loadingId, <p className="text-destructive">{result.error}</p>);
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        updateMessage(
          loadingId,
          <SchemeExplanation
            schemeData={result as ExtendedExplainOutputType}
            startEligibilityCheck={handleStartEligibilityCheck}
          />
        );
      }
    });
  };
  
  const handleStartEligibilityCheck = (schemeName: string) => {
    if (disableInputs) return;
    const questions = schemeQuestions[schemeName] || [];
    addMessage('bot', "Let's quickly check your eligibility.");
    if (questions.length > 0) {
      setEligibilityState({ isActive: true, schemeName, questionIndex: 0, answers: [] });
      addMessage('bot', createQuestionMessage(questions[0], schemeName, 0));
    } else {
      addMessage('bot', "Sorry, eligibility check isn't available for this scheme yet.");
    }
  };

  const handleAnswer = (schemeName: string, questionIndex: number, answer: boolean) => {
    if (!eligibilityState?.isActive) return;

    const newAnswers = [...(eligibilityState.answers || []), answer];
    const questions = schemeQuestions[schemeName];
    
    setMessages(prev => {
        const newMessages = [...prev];
        const lastBotMessageIndex = newMessages.findLastIndex(m => m.role === 'bot');
        if (lastBotMessageIndex !== -1) {
            newMessages[lastBotMessageIndex] = {
                ...newMessages[lastBotMessageIndex],
                content: <p>{questions[questionIndex]}</p>
            };
        }
        return [...newMessages, { id: Date.now().toString() + Math.random(), role: 'user', content: answer ? 'Yes' : 'No' }];
    });
    
    const nextQuestionIndex = questionIndex + 1;

    if (nextQuestionIndex < questions.length) {
      setEligibilityState(s => s ? { ...s, questionIndex: nextQuestionIndex, answers: newAnswers } : null);
      addMessage('bot', createQuestionMessage(questions[nextQuestionIndex], schemeName, nextQuestionIndex));
    } else {
      setEligibilityState(null);
      startTransition(async () => {
        const loadingId = addMessage('bot', <Loader2 className="animate-spin text-primary" />);
        const result = await getEligibility({ schemeName, questions, answers: newAnswers });
        if ('error' in result) {
          updateMessage(loadingId, <p className="text-destructive">{result.error}</p>);
        } else {
          const resultMessage = (
            <div className={cn('p-4 rounded-lg', result.isEligible ? 'bg-green-100 dark:bg-green-900 border border-green-300' : 'bg-red-100 dark:bg-red-900 border border-red-300')}>
              <p className="font-bold text-lg">{result.isEligible ? '✅ You seem to be eligible!' : '❌ You might not be eligible.'}</p>
              {result.reason && <p className="text-sm text-muted-foreground mt-1">{result.reason}</p>}
            </div>
          );
          updateMessage(loadingId, resultMessage);
        }
      });
    }
  };

  const createQuestionMessage = (question: string, schemeName: string, questionIndex: number) => (
    <div className="flex flex-col gap-2 items-start">
      <p>{question}</p>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => handleAnswer(schemeName, questionIndex, true)}>Yes</Button>
        <Button size="sm" variant="outline" onClick={() => handleAnswer(schemeName, questionIndex, false)}>No</Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center justify-between p-4 border-b bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <Landmark className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary-dark">
            Sarkari Mitra
          </h1>
        </div>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[150px]">
            <Languages className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="English">English</SelectItem>
            <SelectItem value="Hindi">हिन्दी</SelectItem>
            <SelectItem value="Telugu">తెలుగు</SelectItem>
            <SelectItem value="Tamil">தமிழ்</SelectItem>
            <SelectItem value="Gujarati">ગુજરાતી</SelectItem>
          </SelectContent>
        </Select>
      </header>
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
              {message.role === 'bot' && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20} /></AvatarFallback>
                </Avatar>
              )}
              <div className={cn('p-3 rounded-lg max-w-lg', message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground shadow-sm')}>
                {message.content}
              </div>
              {message.role === 'user' && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback><User size={20} /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-card">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={eligibilityState?.isActive ? 'Please answer the question above' : 'Ask about a scheme...'}
            disabled={disableInputs}
            className="text-base"
          />
          <Button type="submit" size="icon" disabled={disableInputs}>
            {isPending ? <Loader2 className="animate-spin" /> : <Send />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
