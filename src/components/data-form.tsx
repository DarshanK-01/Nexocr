'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Languages, Loader2, PlusCircle, FunctionSquare } from 'lucide-react';
import type { ExtractDataOutput } from '@/ai/schemas/form-extraction-schemas';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { translateExtractedData } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { spareParts, type SparePart } from '@/lib/spare-parts';
import { MathRenderer } from '@/components/math-renderer';

const formSchema = z.object({
  branch: z.string().optional(),
  bccdName: z.string().optional(),
  productDescription: z.string().optional(),
  productSrNo: z.string().optional(),
  dateOfPurchase: z.string().optional(),
  complaintNo: z.string().optional(),
  sparePartCode: z.string().optional(),
  natureOfDefect: z.string().optional(),
  technicianName: z.string().optional(),
});

type DataFormProps = {
  initialData: ExtractDataOutput | Record<string, any> | null;
  isLoading: boolean;
  onSave: (data: ExtractDataOutput | Record<string, any>) => void;
  sheetActive: boolean;
  onFormChange: (context: { sparePartCode?: string; productDescription?: string }) => void;
  usedFallback?: boolean;
};

export function DataForm({ initialData, isLoading, onSave, sheetActive, onFormChange, usedFallback }: DataFormProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [language, setLanguage] = useState('en');
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { branch:'', bccdName:'', productDescription:'', productSrNo:'', dateOfPurchase:'', complaintNo:'', sparePartCode:'', natureOfDefect:'', technicianName:'' },
  });

  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    onFormChange({ sparePartCode: watchedValues.sparePartCode, productDescription: watchedValues.productDescription });
  }, [watchedValues, onFormChange]);

  useEffect(() => {
    if (watchedValues.sparePartCode) {
      const part = spareParts.find(p => p.code === watchedValues.sparePartCode);
      if (part && form.getValues('productDescription') !== part.description)
        form.setValue('productDescription', part.description, { shouldValidate: true });
    }
  }, [watchedValues.sparePartCode, form]);

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      const code = form.getValues('sparePartCode');
      const desc = form.getValues('productDescription');
      form.reset({ branch:'', bccdName:'', productDescription: code ? desc : '', productSrNo:'', dateOfPurchase:'', complaintNo:'', sparePartCode: code, natureOfDefect:'', technicianName:'' });
    }
  }, [initialData, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSave(values);
    form.reset({ ...form.getValues(), branch:'', bccdName:'', productSrNo:'', dateOfPurchase:'', complaintNo:'', natureOfDefect:'', technicianName:'' });
  }

  const handleTranslate = async () => {
    const data = initialData || form.getValues();
    if (!data) return;
    setIsTranslating(true);
    const result = await translateExtractedData(data, language);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Translation Failed', description: result.error });
    } else if (result.data) {
      const { others: _o, ...formData } = result.data;
      form.reset(formData);
      toast({ title: 'Translation Successful', description: `Translated to ${language}.` });
    }
    setIsTranslating(false);
  };

  // ── Empty state ──
  if (!initialData && !isLoading) {
    return (
      <Card className="flex flex-col h-full border-dashed">
        <CardHeader className="flex-1 flex flex-col items-center justify-center text-center">
          <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
          <CardTitle className="font-headline text-2xl">Validate Data</CardTitle>
          <CardDescription>
            {sheetActive ? 'Upload or capture a form image to begin.' : 'Create or select a sheet to start scanning.'}
          </CardDescription>
          <p className="text-muted-foreground text-sm mt-2">The extracted fields will appear here for validation.</p>
        </CardHeader>
      </Card>
    );
  }

  // ── Loading state ──
  if (isLoading) {
    return (
      <Card className="flex flex-col h-full items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Extracting data from image...</p>
      </Card>
    );
  }

  // ── Dynamic fallback form ──
  if (usedFallback && initialData) {
    const metaKeys = ['_documentType','_language','_confidence','_signatures','_stamps'];
    const entries = Object.entries(initialData).filter(([k]) => !metaKeys.includes(k) && !k.startsWith('_'));
    const meta = initialData as Record<string, any>;
    return <DynamicDataForm entries={entries} meta={meta} isLoading={isLoading} sheetActive={sheetActive} onSave={onSave} />;
  }

  // ── Fixed Bajaj form ──
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="font-headline text-2xl">Validate Data</CardTitle>
            <CardDescription>Review, translate, and add to the Excel sheet.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Language" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="mr">Marathi</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleTranslate} variant="outline" disabled={isTranslating || isLoading}>
              {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
              Translate
            </Button>
          </div>
        </div>
      </CardHeader>
      <div className="flex-1 overflow-y-auto">
        <Form {...form}>
          <form id="bajaj-form" onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="sparePartCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spare Part Code</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a spare part code" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {spareParts.map((p: SparePart) => <SelectItem key={p.code} value={p.code}>{p.code}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="productDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Description</FormLabel>
                    <FormControl><Input placeholder="e.g., 24-inch Monitor" {...field} value={field.value ?? ''} readOnly={!!watchedValues.sparePartCode} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="branch" render={({ field }) => (
                  <FormItem><FormLabel>Branch</FormLabel><FormControl><Input placeholder="e.g., Main Street Branch" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="bccdName" render={({ field }) => (
                  <FormItem><FormLabel>BCCD Name</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="productSrNo" render={({ field }) => (
                  <FormItem><FormLabel>Product Sr No</FormLabel><FormControl><Input placeholder="e.g., SN12345678" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="dateOfPurchase" render={({ field }) => (
                  <FormItem><FormLabel>Date of Purchase</FormLabel><FormControl><Input placeholder="e.g., 2024-01-15" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="complaintNo" render={({ field }) => (
                  <FormItem><FormLabel>Complaint No.</FormLabel><FormControl><Input placeholder="e.g., C-98765" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="technicianName" render={({ field }) => (
                  <FormItem><FormLabel>Technician Name</FormLabel><FormControl><Input placeholder="e.g., Jane Smith" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="natureOfDefect" render={({ field }) => (
                <FormItem><FormLabel>Nature of Defect</FormLabel><FormControl><Textarea placeholder="Describe the defect..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </form>
        </Form>
      </div>
      <CardFooter className="shrink-0 flex justify-end">
        <Button form="bajaj-form" type="submit" disabled={isLoading || isTranslating || !sheetActive}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add to Excel
        </Button>
      </CardFooter>
    </Card>
  );
}

// ── Dynamic form ──────────────────────────────────────────────────────────────

type DynamicDataFormProps = {
  entries: [string, any][];
  meta: Record<string, any>;
  isLoading: boolean;
  sheetActive: boolean;
  onSave: (data: Record<string, any>) => void;
};

function DynamicDataForm({ entries, meta, isLoading, sheetActive, onSave }: DynamicDataFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(entries.map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]))
  );
  const confidence = meta._confidence as string | undefined;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="font-headline text-2xl">Validate Data</CardTitle>
            <CardDescription>{meta._documentType || 'Document'} · {meta._language || ''}</CardDescription>
          </div>
          {confidence && (
            <Badge variant="outline" className={
              confidence === 'HIGH' ? 'border-green-500 text-green-600' :
              confidence === 'MEDIUM' ? 'border-yellow-500 text-yellow-600' :
              'border-red-500 text-red-600'
            }>{confidence}</Badge>
          )}
        </div>
      </CardHeader>
      <div className="flex-1 overflow-y-auto">
        <CardContent className="space-y-3">
          {/* ── Math equations panel ── */}
          {Array.isArray(meta._equations) && meta._equations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FunctionSquare className="h-4 w-4 text-primary" />
                Extracted Equations
              </div>
              <MathRenderer equations={meta._equations} mathDomain={meta._mathDomain} />
            </div>
          )}

          {/* ── Regular fields (hide if purely math doc with no meaningful fields) ── */}
          {entries.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entries.map(([key]) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={`dyn-${key}`} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{key}</Label>
                  <Input id={`dyn-${key}`} value={values[key] ?? ''} onChange={e => setValues(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
          )}
          {(meta._signatures || meta._stamps) && (
            <div className="rounded-md border bg-muted/50 p-3 space-y-1 text-xs text-muted-foreground">
              {meta._signatures && <p><span className="font-medium">Signatures:</span> {meta._signatures}</p>}
              {meta._stamps && <p><span className="font-medium">Stamps:</span> {meta._stamps}</p>}
            </div>
          )}
        </CardContent>
      </div>
      <CardFooter className="shrink-0 flex justify-end">
        <Button disabled={isLoading || !sheetActive} onClick={() => onSave(values)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add to Excel
        </Button>
      </CardFooter>
    </Card>
  );
}
