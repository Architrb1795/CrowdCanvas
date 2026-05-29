'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="h-full p-6 flex flex-col items-start hoverEffect group">
        <div className="rounded-xl bg-slate-800/80 p-3 mb-5 border border-slate-700/50 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 transition-colors">
          <Icon className="w-6 h-6 text-indigo-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed flex-1">{description}</p>
      </Card>
    </motion.div>
  );
}
