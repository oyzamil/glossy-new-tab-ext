import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAntd } from '@/providers/ThemeProvider';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

const Quotes: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>(DEFAULT_QUOTES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastScrollTime = useRef<number>(0);
  const cardWrapperRef = useRef<HTMLDivElement>(null);

  const loadQuotes = useCallback(async () => {
    setIsLoading(true);
    const newQuotes = await fetchQuotes();
    if (newQuotes.length > 0) {
      setQuotes((prev) => {
        const existingContents = new Set(prev.map((q) => q.content));
        const uniqueNew = newQuotes.filter((q) => !existingContents.has(q.content));
        return [...prev, ...uniqueNew];
      });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadQuotes();
    const syncInterval = setInterval(loadQuotes, SYNC_INTERVAL_MS);
    return () => clearInterval(syncInterval);
  }, [loadQuotes]);

  const nextQuote = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % quotes.length);
  }, [quotes.length]);

  const prevQuote = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + quotes.length) % quotes.length);
  }, [quotes.length]);

  // Autoplay Loop
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(nextQuote, SLIDE_INTERVAL_MS);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextQuote]);

  // Handle Mouse Wheel Scroll - specifically targeting the card wrapper
  useEffect(() => {
    const el = cardWrapperRef.current;
    if (!el) return;

    const handleWheelNative = (e: WheelEvent) => {
      // Prevent propagation and default scroll behavior ONLY when interacting with the card
      e.stopPropagation();

      const now = Date.now();
      // Throttle to 400ms to avoid skipping too many quotes
      if (now - lastScrollTime.current < 400) {
        e.preventDefault();
        return;
      }

      if (Math.abs(e.deltaY) > 10) {
        e.preventDefault();
        lastScrollTime.current = now;
        if (e.deltaY > 0) {
          nextQuote();
        } else {
          prevQuote();
        }
      }
    };

    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelNative);
  }, [nextQuote, prevQuote]);

  const currentQuote = quotes[currentIndex];

  if (!currentQuote) return null;

  return (
    <>
      {/* Specific wrapper for the card to restrict mouse wheel events */}
      <div ref={cardWrapperRef}>
        <QuoteCard
          quote={currentQuote}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          currentIndex={currentIndex}
        />
      </div>

      {/* Footer Navigation Controls */}
      {/* <div className="mt-20 flex flex-col items-center gap-8">
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-300 shadow-sm transition-all hover:border-app-500 hover:text-app-500 hover:shadow-lg active:scale-90"
            onClick={prevQuote}
          >
            <svg
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <div className="flex min-w-30 flex-col items-center">
            <div className="flex gap-2">
              <span className="text-3xl font-black tracking-tighter text-gray-900">
                {(currentIndex + 1).toString().padStart(2, '0')}
              </span>
              <span className="text-3xl font-light text-gray-200">/</span>
              <span className="text-3xl font-bold tracking-tighter text-gray-300">
                {quotes.length.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-gray-100 shadow-inner">
              <div
                className="h-full bg-app-500 shadow-[0_0_8px_rgba(29,161,242,0.4)] transition-all duration-1000 ease-out"
                style={{ width: `${((currentIndex + 1) / quotes.length) * 100}%` }}
              />
            </div>
          </div>

          <button
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-300 shadow-sm transition-all hover:border-app-500 hover:text-app-500 hover:shadow-lg active:scale-90"
            onClick={nextQuote}
          >
            <svg
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-4">
          {isLoading && (
            <div className="flex items-center gap-2 rounded-xl border border-app-100 bg-app-50/50 px-3 py-1.5 backdrop-blur-sm">
              <div className="h-1.5 w-1.5 animate-ping rounded-full bg-app-500"></div>
              <span className="text-[9px] font-black tracking-[0.2em] text-app-500 uppercase">
                Syncing
              </span>
            </div>
          )}
          <div
            className={`rounded-xl border px-4 py-1.5 transition-all duration-500 ${
              isPaused
                ? 'border-orange-100 bg-orange-50/50 text-orange-400'
                : 'border-green-100 bg-green-50/50 text-green-400'
              }`}
          >
            <span className="text-[9px] font-black tracking-[0.2em] uppercase">
              {isPaused ? 'Paused' : 'Active'}
            </span>
          </div>
        </div>
      </div> */}

      {/* <div className="mt-6 flex items-center gap-2 text-[9px] font-bold tracking-widest text-gray-300 uppercase opacity-50">
        <svg
          className="animate-bounce"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        </svg>
        Hover & Scroll Card to Navigate
      </div> */}
    </>
  );
};

export default Quotes;

const QuoteCard: React.FC<{
  quote: Quote;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  currentIndex: number;
}> = ({ quote, onMouseEnter, onMouseLeave, currentIndex }) => {
  const [copied, setCopied] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const { message } = useAntd();

  // Animation trigger on index change
  React.useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 400);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`"${quote.content}" — ${quote.author}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 100);
    message.success('Copied');
  };

  return (
    <div
      className="glass widget group relative w-full max-w-87"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={'relative flex flex-col justify-between'}>
        <motion.div
          className="flex items-start justify-between"
          key={'quotes-header'}
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex-center gap-2">
            <div className="bg-app-500 shadow-app-100 flex h-10 w-10 -rotate-3 transform items-center justify-center rounded-xl">
              <Icon className="text-xl" icon="glyphs:quote-bold" />
            </div>
            <div>
              <span className="text-app-500 text-[10px] font-black tracking-[0.2em] uppercase">
                Daily Wisdom
              </span>
              <div className="bg-app-300 h-1 w-8 rounded-full"></div>
            </div>
          </div>

          <Button
            className="bg-app-900 size-8 border-none text-white"
            onClick={handleCopy}
            loading={copied}
            icon={<Icon className="text-lg" icon="tabler:copy" />}
          />
        </motion.div>

        {/* Quote Content Section - Decreased font size */}
        <div className="flex grow flex-col justify-center">
          <motion.div
            className="flex min-h-25 items-center"
            key={'quotes-body'}
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <h2 className={cn('tracking-tightl w-full leading-[1.2]')}>{quote.content}</h2>
            <div className="flex flex-col gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => {
                const isActive = currentIndex % 5 === i;
                return (
                  <div
                    className={`rounded-full transition-all duration-700 ${
                      isActive ? 'bg-app-500 h-6 w-1' : 'h-1 w-1 bg-gray-200'
                    }`}
                    key={i}
                  />
                );
              })}
            </div>
          </motion.div>
          <motion.div
            className="flex items-center"
            key={'quotes-footer'}
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="from-app-500 h-0.5 w-10 rounded-full bg-linear-to-r to-transparent"></div>
            <p className="text-[10px] italic">{quote.author || 'Unknown Catalyst'}</p>
          </motion.div>
        </div>

        {/* Subtle decorative mark */}
        <div className="pointer-events-none absolute -right-6 -bottom-6 rotate-12 opacity-[0.02]">
          <Icon className="text-xl" icon="glyphs:quote-bold" />
        </div>
      </div>
    </div>
  );
};
