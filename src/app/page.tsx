'use client'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from './(landing)/_components/hero-section'
import { FeaturesSection } from './(landing)/_components/features-section'
import { PricingSection } from './(landing)/_components/pricing-section'
import { CTASection } from './(landing)/_components/cta-section'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
