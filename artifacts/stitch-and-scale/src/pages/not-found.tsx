import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import numeral404 from '@/assets/404/numeral-404.webp';
import { useSettings } from '@/context/SettingsContext';

const EASE = [0.16, 1, 0.3, 1] as const;

export default function NotFound() {
  const { t } = useSettings();
  const reduceMotion = useReducedMotion();

  const fadeUp = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: EASE, delay },
        };

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-10 max-w-md mx-auto min-h-[calc(100dvh-8rem)]">
      <motion.img
        src={numeral404}
        alt="404"
        width={460}
        height={238}
        className="w-full max-w-[220px] h-auto mb-6"
        {...fadeUp(0)}
      />

      <motion.h1
        {...fadeUp(0.08)}
        className="font-serif font-medium text-foreground leading-[1.15] tracking-tight mb-3 text-[28px] sm:text-[32px]"
      >
        {t('route.notFound.title')}
      </motion.h1>

      <motion.p
        {...fadeUp(0.16)}
        className="text-muted-foreground max-w-[320px] mb-8 text-[15px] leading-relaxed"
      >
        {t('route.notFound.description')}
      </motion.p>

      <motion.div
        {...fadeUp(0.24)}
        className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
      >
        <Button
          asChild
          size="lg"
          className="rounded-full px-8 h-12 text-[15px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm w-full sm:w-auto"
          data-testid="button-back-to-dashboard"
        >
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" strokeWidth={1.5} />
            {t('route.notFound.back')}
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="rounded-full px-8 h-12 text-[15px] font-medium w-full sm:w-auto"
          data-testid="button-new-pattern-from-404"
        >
          <Link href="/project/new">
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
            {t('route.notFound.newPattern')}
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
