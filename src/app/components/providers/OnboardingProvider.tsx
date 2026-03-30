'use client';

import type { ReactNode } from 'react';
import { NextStepProvider, NextStep } from 'nextstepjs';
import { onboardingTours } from '@/src/app/lib/onboarding/onboardingSteps';
import OnboardingCard from '@/src/app/components/puzzle/OnboardingCard';

export default function OnboardingProvider({ children }: { children: ReactNode }) {
    return (
        <NextStepProvider>
            <NextStep steps={onboardingTours} cardComponent={OnboardingCard}>
                {children}
            </NextStep>
        </NextStepProvider>
    );
}
