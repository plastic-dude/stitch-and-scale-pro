import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Heart, Globe } from 'lucide-react';

export default function AboutEmlux() {
  const { language } = useSettings();
  
  // Hand-written localization for the EMLUX brand page
  const allCopy: Record<string, any> = {
    en: {
      title: 'About EMLUX',
      subtitle: 'The parent company behind Stitch & Scale',
      mission: 'EMLUX was founded as a personal commitment to building problem-solving tools for niche communities. We believe that professional-grade software should be accessible, private, and built with empathy for the craft.',
      promiseTitle: 'Our Promise',
      promiseBody: 'Every EMLUX product is designed to empower independent creators. We focus on utility over hype, privacy over data-mining, and quality over speed.',
      values: [
        { icon: ShieldCheck, title: 'Privacy First', desc: 'Your data stays on your device. We don\'t track you.' },
        { icon: Sparkles, title: 'Craft Focused', desc: 'Tools built for the specific needs of designers and makers.' },
        { icon: Heart, title: 'Empathy Driven', desc: 'Founded by a developer who understands the value of handmade work.' },
        { icon: Globe, title: 'Global Reach', desc: 'Accessible software for creators around the world.' }
      ]
    },
    de: {
      title: 'Über EMLUX',
      subtitle: 'Das Mutterunternehmen hinter Stitch & Scale',
      mission: 'EMLUX wurde als persönliches Versprechen gegründet, Problemlösungswerkzeuge für Nischen-Communities zu entwickeln. Wir glauben, dass professionelle Software zugänglich, privat und mit Empathie für das Handwerk entwickelt werden sollte.',
      promiseTitle: 'Unser Versprechen',
      promiseBody: 'Jedes EMLUX-Produkt ist darauf ausgerichtet, unabhängige Schöpfer zu stärken. Wir konzentrieren uns auf Nutzen statt Hype, Privatsphäre statt Datensammlung und Qualität statt Geschwindigkeit.',
      values: [
        { icon: ShieldCheck, title: 'Privatsphäre zuerst', desc: 'Deine Daten bleiben auf deinem Gerät. Wir verfolgen dich nicht.' },
        { icon: Sparkles, title: 'Fokus aufs Handwerk', desc: 'Werkzeuge, die für die spezifischen Bedürfnisse von Designern entwickelt wurden.' },
        { icon: Heart, title: 'Empathie-getrieben', desc: 'Gegründet von einem Entwickler, der den Wert von Handarbeit versteht.' },
        { icon: Globe, title: 'Globale Reichweite', desc: 'Zugängliche Software für Schöpfer auf der ganzen Welt.' }
      ]
    },
    fr: {
      title: 'À propos d\'EMLUX',
      subtitle: 'La société mère derrière Stitch & Scale',
      mission: 'EMLUX a été fondée comme un engagement personnel à créer des outils de résolution de problèmes pour les communautés de niche. Nous pensons que les logiciels de qualité professionnelle doivent être accessibles, privés et conçus avec empathie pour le métier.',
      promiseTitle: 'Notre Promesse',
      promiseBody: 'Chaque produit EMLUX est conçu pour autonomiser les créateurs indépendants. Nous privilégions l\'utilité au battage médiatique, la confidentialité à l\'exploitation des données, et la qualité à la rapidité.',
      values: [
        { icon: ShieldCheck, title: 'Confidentialité d\'abord', desc: 'Vos données restent sur votre appareil. Nous ne vous suivons pas.' },
        { icon: Sparkles, title: 'Axé sur le métier', desc: 'Des outils conçus pour les besoins spécifiques des designers.' },
        { icon: Heart, title: 'Guidé par l\'empathie', desc: 'Fondé par un développeur qui comprend la valeur du travail fait main.' },
        { icon: Globe, title: 'Portée mondiale', desc: 'Des logiciels accessibles pour les créateurs du monde entier.' }
      ]
    },
    es: {
      title: 'Sobre EMLUX',
      subtitle: 'La empresa matriz detrás de Stitch & Scale',
      mission: 'EMLUX se fundó como un compromiso personal para crear herramientas de resolución de problemas para comunidades de niche. Creemos que el software de nivel profesional debe ser accesible, privado y construido con empatía por el oficio.',
      promiseTitle: 'Nuestra Promesa',
      promiseBody: 'Cada producto de EMLUX está diseñado para empoderar a los creadores independientes. Nos enfocamos en la utilidad sobre la publicidad, la privacidad sobre la minería de datos y la calidad sobre la velocidad.',
      values: [
        { icon: ShieldCheck, title: 'Privacidad Primero', desc: 'Tus datos se quedan en tu dispositivo. No te rastreamos.' },
        { icon: Sparkles, title: 'Enfocado en el Oficio', desc: 'Herramientas creadas para las necesidades específicas de diseñadores.' },
        { icon: Heart, title: 'Impulsado por la Empatía', desc: 'Fundado por un desarrollador que entiende el valor del trabajo hecho a mano.' },
        { icon: Globe, title: 'Alcance Global', desc: 'Software accesible para creadores de todo el mundo.' }
      ]
    },
    pt: {
      title: 'Sobre a EMLUX',
      subtitle: 'A empresa-mãe por trás do Stitch & Scale',
      mission: 'A EMLUX foi fundada como um compromisso pessoal de construir ferramentas de resolução de problemas para comunidades de nicho. Acreditamos que o software de nível profissional deve ser acessível, privado e construído com empatía pelo ofício.',
      promiseTitle: 'Nossa Promessa',
      promiseBody: 'Cada produto EMLUX é projetado para capacitar criadores independentes. Focamo-nos na utilidade em vez do hype, na privacidade em vez da mineração de datos e na qualidade em vez da velocidade.',
      values: [
        { icon: ShieldCheck, title: 'Privacidade Primeiro', desc: 'Os seus dados ficam no seu dispositivo. Não o rastreamos.' },
        { icon: Sparkles, title: 'Foco no Ofício', desc: 'Ferramentas construídas para as necessidades específicas de designers.' },
        { icon: Heart, title: 'Guiado pela Empatia', desc: 'Fundado por um desenvolvedor que entende o valor do trabalho feito à mão.' },
        { icon: Globe, title: 'Alcance Global', desc: 'Software acessível para criadores em todo o mundo.' }
      ]
    }
  };
  const copy = allCopy[language] || allCopy.en;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-16 animate-in fade-in duration-700">
      <section className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block p-3 rounded-2xl bg-primary/5 border border-primary/10 mb-4"
        >
          <img src="/app-logo.png" alt="Stitch & Scale" className="w-16 h-16 object-contain grayscale opacity-70" />
        </motion.div>
        <h1 className="text-5xl font-serif font-bold tracking-tight text-foreground">{copy.title}</h1>
        <p className="text-xl text-muted-foreground font-medium">{copy.subtitle}</p>
        <div className="max-w-2xl mx-auto h-px bg-gradient-to-r from-transparent via-border to-transparent my-8" />
        <p className="text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
          {copy.mission}
        </p>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        {copy.values.map((value: any, idx: number) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-6 rounded-2xl border border-border/60 bg-card/50 hover:bg-card hover:border-border transition-all"
          >
            <value.icon className="w-8 h-8 text-accent mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{value.desc}</p>
          </motion.div>
        ))}
      </section>

      <section className="bg-secondary/20 rounded-3xl p-8 md:p-12 border border-border/40 text-center space-y-6">
        <h2 className="text-3xl font-serif font-semibold text-foreground">{copy.promiseTitle}</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {copy.promiseBody}
        </p>
      </section>

      <footer className="text-center pt-8 border-t border-border/40">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} EMLUX.
        </p>
      </footer>
    </div>
  );
}
