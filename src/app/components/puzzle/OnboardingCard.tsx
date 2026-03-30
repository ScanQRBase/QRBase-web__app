'use client';

import { useState, useEffect } from 'react';
import type { CardComponentProps } from 'nextstepjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Puzzle,
    ListChecks,
    HelpCircle,
    Timer,
    BarChart3,
    Rocket,
    ArrowRight,
    ArrowLeft,
    X,
    Sparkles,
    ShoppingCart,
    Trophy,
    Zap,
    Crown,
    Coins,
    Users,
    Compass,
} from 'lucide-react';

// Match icon by step title (works for both desktop 12-step and mobile 6-step tours)
function getStepIcon(title: string): React.ReactNode {
    const t = title.toLowerCase();
    if (t.includes('welcome')) return <Sparkles className="w-5 h-5" />;
    if (t.includes('puzzle board')) return <Puzzle className="w-5 h-5" />;
    if (t.includes('timer')) return <Timer className="w-5 h-5" />;
    if (t.includes('stats')) return <BarChart3 className="w-5 h-5" />;
    if (t.includes('attempts')) return <ShoppingCart className="w-5 h-5" />;
    if (t.includes('tasks') || t.includes('earn free')) return <ListChecks className="w-5 h-5" />;
    if (t.includes('prize')) return <Trophy className="w-5 h-5" />;
    if (t.includes('boost')) return <Zap className="w-5 h-5" />;
    if (t.includes('leaderboard')) return <Crown className="w-5 h-5" />;
    if (t.includes('$scan') || t.includes('balance')) return <Coins className="w-5 h-5" />;
    if (t.includes('profile')) return <Users className="w-5 h-5" />;
    if (t.includes('explore')) return <Compass className="w-5 h-5" />;
    if (t.includes('ready')) return <Rocket className="w-5 h-5" />;
    return <HelpCircle className="w-5 h-5" />;
}

export default function OnboardingCard({
    step,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
    arrow,
}: CardComponentProps) {
    const icon = getStepIcon(step.title);
    const isFirst = currentStep === 0;
    const isLast = currentStep === totalSteps - 1;
    const progress = ((currentStep + 1) / totalSteps) * 100;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="relative rounded-2xl overflow-visible shadow-2xl pointer-events-auto"
                style={{
                    background: '#111827',
                    border: '1px solid rgba(255,255,255,0.08)',
                    width: 'min(320px, 85vw)',
                    maxWidth: '85vw',
                }}
            >
                {/* Brand gradient accent bar */}
                <div
                    className="h-1 w-full rounded-t-2xl"
                    style={{
                        background: 'linear-gradient(to right, #50DEF5, #0052FF, #AE80FF)',
                    }}
                />

                {/* Progress bar */}
                <div className="h-0.5 w-full bg-gray-800">
                    <motion.div
                        className="h-full"
                        style={{ background: '#0052FF' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                </div>

                {/* Header: Step count + Skip */}
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: 'rgba(0, 82, 255, 0.15)' }}
                        >
                            <span className="text-[#0052FF]">{icon}</span>
                        </div>
                        <span className="text-xs font-mono text-gray-400">
                            {currentStep + 1} / {totalSteps}
                        </span>
                    </div>
                    <button
                        onClick={skipTour}
                        className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-800"
                        aria-label="Skip tour"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-4 pb-1 pt-1">
                    <h3 className="text-base font-bold text-white mb-1 leading-tight">
                        {step.title}
                    </h3>
                    <div className="text-[13px] text-gray-400 leading-relaxed">
                        {step.content}
                    </div>
                </div>

                {/* Navigation buttons — always visible */}
                <div className="flex items-center justify-between px-4 pb-4 pt-2 flex-shrink-0">
                    {!isFirst ? (
                        <button
                            onClick={prevStep}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-300 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    <button
                        onClick={nextStep}
                        className="flex items-center gap-1 px-4 py-1.5 text-sm font-bold text-white rounded-xl transition-opacity hover:opacity-90"
                        style={{
                            background: 'linear-gradient(to right, #50DEF5, #0052FF, #AE80FF)',
                        }}
                    >
                        {isLast ? 'Finish' : 'Next'}
                        {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                </div>

                {/* Arrow */}
                {arrow}
            </motion.div>
        </AnimatePresence>
    );
}
