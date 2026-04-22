'use client';

import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Equation {
  label: string;
  latex: string;
  raw: string;
}

interface MathRendererProps {
  equations: Equation[];
  mathDomain?: string;
}

export function MathRenderer({ equations, mathDomain }: MathRendererProps) {
  const { toast } = useToast();

  const copyLatex = (latex: string) => {
    navigator.clipboard.writeText(latex);
    toast({ title: 'Copied', description: 'LaTeX copied to clipboard' });
  };

  return (
    <div className="flex flex-col gap-4">
      {mathDomain && (
        <Badge variant="outline" className="w-fit gap-1.5 px-3 py-1 border-teal-500/30 bg-teal-500/10 text-teal-600">
          <span className="text-base">∑</span>
          {mathDomain}
        </Badge>
      )}
      {equations.map((eq, i) => (
        <div key={i} className="relative group rounded-xl bg-slate-900 border border-slate-700 p-4 flex flex-col gap-2">
          <span className="text-xs uppercase tracking-widest text-teal-400 font-semibold">{eq.label}</span>
          <div className="text-white text-lg py-3 flex justify-center overflow-x-auto">
            <BlockMath
              math={eq.latex}
              errorColor="#ef4444"
              renderError={() => <span className="text-slate-400 font-mono text-sm">{eq.raw}</span>}
            />
          </div>
          <Button
            onClick={() => copyLatex(eq.latex)}
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-7 text-xs px-2 bg-slate-700 text-slate-300 hover:bg-slate-600"
          >
            <Copy className="h-3 w-3 mr-1" /> Copy LaTeX
          </Button>
        </div>
      ))}
    </div>
  );
}
