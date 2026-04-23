
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { extractDataFromImage } from '@/app/actions';
import type { ExtractDataOutput } from '@/ai/schemas/form-extraction-schemas';
import { ImageUploader } from '@/components/image-uploader';
import { DataForm } from '@/components/data-form';
import { ScanText, Download, History, Plus, Trash2, MoreVertical, Edit, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SheetOverview } from '@/components/sheet-overview';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type Sheet = {
  id: string;
  name: string;
  data: Record<string, any>[];
  createdAt: string;
}

const STORAGE_KEY = 'nexscan-sheets';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentExtractedData, setCurrentExtractedData] = useState<Record<string, any> | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [confidence, setConfidence] = useState<string | null>(null);
  
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [isSheetOverviewOpen, setIsSheetOverviewOpen] = useState(false);

  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateSheetDialogOpen, setIsCreateSheetDialogOpen] = useState(false);
  const [isRenameSheetDialogOpen, setIsRenameSheetDialogOpen] = useState(false);
  const [isDuplicateWarningOpen, setIsDuplicateWarningOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [pendingData, setPendingData] = useState<Record<string, any> | null>(null);


  // Store form context for extraction
  const [extractionContext, setExtractionContext] = useState<{ sparePartCode?: string; productDescription?: string; }>({});


  const { toast } = useToast();

  // Load sheets from local storage on initial render
  useEffect(() => {
    try {
      const savedSheets = localStorage.getItem(STORAGE_KEY);
      if (savedSheets) {
        const parsedSheets: Sheet[] = JSON.parse(savedSheets);
        setSheets(parsedSheets);
        if (parsedSheets.length > 0) {
          // Activate the most recently created sheet
          setActiveSheetId(parsedSheets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load sheets from local storage:", error);
      toast({
        variant: 'destructive',
        title: 'Could not load data',
        description: 'There was an error loading your saved sheets.',
      });
    }
  }, [toast]);

  // Save sheets to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
    } catch (error) {
      console.error("Failed to save sheets to local storage:", error);
      toast({
        variant: 'destructive',
        title: 'Could not save data',
        description: 'Your changes might not be saved across sessions.',
      });
    }
  }, [sheets, toast]);
  

  const handleImageReady = async (dataUrl: string) => {
    // Clear previous extraction results when a new image is uploaded
    setCurrentExtractedData(null);
    setUsedFallback(false);
    setConfidence(null);
    
    if (!dataUrl) return;

    setIsLoading(true);

    if (sheets.length === 0 || !activeSheetId) {
       handleOpenCreateSheetDialog();
       toast({ title: 'No Active Sheet', description: 'Please create a sheet to continue.'});
       setIsLoading(false);
       return;
    }

    const result = await extractDataFromImage({
      photoDataUri: dataUrl,
      sparePartCode: extractionContext?.sparePartCode,
      productDescription: extractionContext?.productDescription,
    });
    
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Extraction Failed',
        description: result.error,
      });
    } else {
      setCurrentExtractedData(result.data);
      const fallback = result.usedFallback ?? false;
      setUsedFallback(fallback);
      const conf = (result.data as any)?._confidence ?? null;
      setConfidence(conf);

      if (fallback) {
        toast({
          title: 'Switching to backup AI key...',
          description: 'Primary extraction failed. Backup AI was used successfully.',
        });
      } else {
        toast({
          title: 'Extraction Successful',
          description: 'Data has been extracted. Review and add to the active Excel sheet.',
        });
      }
    }
    
    setIsLoading(false);
  };
  
  const handleAddToSheet = (data: Record<string, any>) => {
    if (!activeSheetId) {
      toast({
        variant: 'destructive',
        title: 'No Active Sheet',
        description: 'Please create or select a sheet first.',
      });
      return;
    }

    const activeSheet = sheets.find(s => s.id === activeSheetId);
    const isDuplicate = activeSheet?.data.some(
      item => item.productSrNo && item.productSrNo === data.productSrNo
    );

    if (isDuplicate) {
      setPendingData(data);
      setIsDuplicateWarningOpen(true);
    } else {
      addConfirmedData(data);
    }
  };

  const addConfirmedData = (data: Record<string, any>) => {
    setSheets(prevSheets => 
      prevSheets.map(sheet => 
        sheet.id === activeSheetId 
          ? { ...sheet, data: [...sheet.data, data] }
          : sheet
      )
    );
    setCurrentExtractedData(null); // Clear the form after adding
    toast({
      title: 'Form Added',
      description: `The form data has been added to the sheet: ${activeSheet?.name}.`,
    });
  };

  const confirmAddDuplicate = () => {
    if (pendingData) {
      addConfirmedData(pendingData);
    }
    setIsDuplicateWarningOpen(false);
    setPendingData(null);
  };

  const handleOpenCreateSheetDialog = () => {
    setNewSheetName(`Sheet ${sheets.length + 1}`);
    setIsCreateSheetDialogOpen(true);
  };
  
  const handleCreateNewSheet = () => {
    if (!newSheetName.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Name', description: 'Sheet name cannot be empty.' });
      return;
    }
    const newSheet: Sheet = {
      id: `sheet-${Date.now()}`,
      name: newSheetName,
      data: [],
      createdAt: new Date().toISOString(),
    };
    setSheets(prev => [newSheet, ...prev]);
    setActiveSheetId(newSheet.id);
    setIsCreateSheetDialogOpen(false);
    setNewSheetName('');
    toast({
      title: 'New Sheet Created',
      description: `"${newSheet.name}" is now the active sheet.`,
    });
  };

  const handleOpenRenameSheetDialog = () => {
    const activeSheet = sheets.find(s => s.id === activeSheetId);
    if (activeSheet) {
      setNewSheetName(activeSheet.name);
      setIsRenameSheetDialogOpen(true);
    }
  };

  const handleRenameSheet = () => {
    if (!newSheetName.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Name', description: 'Sheet name cannot be empty.' });
      return;
    }
    setSheets(prevSheets =>
      prevSheets.map(sheet =>
        sheet.id === activeSheetId ? { ...sheet, name: newSheetName } : sheet
      )
    );
    setIsRenameSheetDialogOpen(false);
    setNewSheetName('');
    toast({ title: 'Sheet Renamed', description: `Sheet successfully renamed to "${newSheetName}".` });
  };
  
  const handleDeleteSheet = () => {
    if (!activeSheetId) return;

    const sheetToDelete = sheets.find(s => s.id === activeSheetId);
    if (!sheetToDelete) return;
    
    setSheets(prev => prev.filter(s => s.id !== activeSheetId));
    
    // Set new active sheet
    const remainingSheets = sheets.filter(s => s.id !== activeSheetId);
    if (remainingSheets.length > 0) {
      setActiveSheetId(remainingSheets[0].id);
    } else {
      setActiveSheetId(null);
    }
    
    toast({
      variant: 'destructive',
      title: 'Sheet Deleted',
      description: `"${sheetToDelete.name}" has been removed.`,
    });
    setIsDeleteDialogOpen(false);
  };

  const exportToCSV = () => {
    const activeSheet = sheets.find(s => s.id === activeSheetId);
    if (!activeSheet || activeSheet.data.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'There is no data in the active Excel sheet to export.',
      });
      return;
    }

    const headers = ['Sr. No.', ...Object.keys(activeSheet.data[0]).filter(key => key !== 'others')].join(',');
    
    const values = activeSheet.data.map((item, index) => {
      const rowData = Object.entries(item)
        .filter(([key]) => key !== 'others')
        .map(([, val]) => `"${String(val ?? '').replace(/"/g, '""')}"`)
        .join(',');
      return `${index + 1},${rowData}`;
    }).join('\n');

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + values;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeSheet.name.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Successful',
      description: `The sheet "${activeSheet.name}" has been exported to CSV.`,
    });
  };

  const handleUpdateSheetData = (rowIndex: number, columnId: string, value: any) => {
    setSheets(prevSheets =>
      prevSheets.map(sheet => {
        if (sheet.id === activeSheetId) {
          const newData = [...sheet.data];
          if (newData[rowIndex]) {
            newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
          }
          return { ...sheet, data: newData };
        }
        return sheet;
      })
    );
  };
  
  const handleRemoveRow = (rowIndex: number) => {
    setSheets(prevSheets =>
      prevSheets.map(sheet =>
        sheet.id === activeSheetId
          ? { ...sheet, data: sheet.data.filter((_, index) => index !== rowIndex) }
          : sheet
      )
    );
    toast({ title: 'Row Removed', description: 'The selected entry has been removed from the sheet.' });
  };
  
  const activeSheet = sheets.find(s => s.id === activeSheetId);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ── Header ── */}
      <header className="h-14 px-4 border-b bg-card/50 backdrop-blur-lg sticky top-0 z-20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ScanText className="w-8 h-8 text-primary"/>
          <h1 className="text-2xl font-bold font-headline text-primary">NexScan</h1>
        </div>
        <div className="flex items-center gap-2">
          {(usedFallback || confidence) && (
            <div className="hidden md:flex items-center gap-1.5">
              {usedFallback && <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600"><ShieldAlert className="h-3 w-3" /> Backup AI</Badge>}
              {confidence === 'HIGH' && <Badge variant="outline" className="gap-1 border-green-500 text-green-600"><CheckCircle2 className="h-3 w-3" /> HIGH</Badge>}
              {confidence === 'MEDIUM' && <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600"><AlertTriangle className="h-3 w-3" /> MEDIUM</Badge>}
              {confidence === 'LOW' && <Badge variant="outline" className="gap-1 border-red-500 text-red-600"><AlertTriangle className="h-3 w-3" /> LOW</Badge>}
            </div>
          )}
          <Button variant="outline" onClick={() => setIsSheetOverviewOpen(true)} disabled={!activeSheet || activeSheet.data.length === 0}>
            <History className="mr-2 h-4 w-4" /> View Excel Sheet ({activeSheet?.data.length || 0})
          </Button>
          <Button onClick={exportToCSV} disabled={!activeSheet || activeSheet.data.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sheet Management</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleOpenCreateSheetDialog}><Plus className="mr-2 h-4 w-4" /> Create New Sheet</DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenRenameSheetDialog} disabled={!activeSheet}><Edit className="mr-2 h-4 w-4" /> Rename Current Sheet</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={sheets.length === 0}>Switch Sheet</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuLabel>Select a sheet</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {sheets.map(s => (
                      <DropdownMenuItem key={s.id} onClick={() => setActiveSheetId(s.id)} disabled={s.id === activeSheetId}>{s.name}</DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} disabled={!activeSheet} className="text-red-500 focus:text-red-500">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Current Sheet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── Main 2-column grid — fills remaining height ── */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        <div className="lg:col-span-1 min-h-0 flex flex-col">
          <ImageUploader
            onImageReady={handleImageReady}
            isLoading={isLoading}
            onError={(msg) => toast({ variant: 'destructive', title: 'Unsupported File', description: msg })}
          />
        </div>
        <div className="lg:col-span-1 min-h-0 flex flex-col">
          <DataForm
            initialData={currentExtractedData}
            isLoading={isLoading}
            onSave={handleAddToSheet}
            sheetActive={!!activeSheet}
            onFormChange={setExtractionContext}
            usedFallback={usedFallback}
          />
        </div>
      </main>

      {activeSheet && (
        <SheetOverview 
          isOpen={isSheetOverviewOpen} 
          onOpenChange={setIsSheetOverviewOpen}
          sheetData={activeSheet.data}
          onUpdateData={handleUpdateSheetData}
          onRemoveRow={handleRemoveRow}
          onClearSheet={() => {
            setSheets(prev => prev.map(s => s.id === activeSheetId ? {...s, data: []} : s));
            setIsSheetOverviewOpen(false);
            toast({ title: 'Excel Sheet Cleared' });
          }}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete "{activeSheet?.name}" and all its data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSheet} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isCreateSheetDialogOpen} onOpenChange={setIsCreateSheetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Sheet</AlertDialogTitle>
            <AlertDialogDescription>Enter a name for your new sheet.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-3">
            <Input id="sheet-name" value={newSheetName} onChange={(e) => setNewSheetName(e.target.value)}
              placeholder="Sheet name..." autoFocus onKeyDown={(e) => e.key === 'Enter' && handleCreateNewSheet()} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateNewSheet}>Create</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRenameSheetDialogOpen} onOpenChange={setIsRenameSheetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Sheet</AlertDialogTitle>
            <AlertDialogDescription>New name for "{sheets.find(s => s.id === activeSheetId)?.name}".</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-3">
            <Input id="rename-sheet-name" value={newSheetName} onChange={(e) => setNewSheetName(e.target.value)}
              autoFocus onKeyDown={(e) => e.key === 'Enter' && handleRenameSheet()} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRenameSheet}>Rename</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDuplicateWarningOpen} onOpenChange={setIsDuplicateWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Entry Warning</AlertDialogTitle>
            <AlertDialogDescription>Product Sr No. "{pendingData?.productSrNo}" already exists. Add anyway?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsDuplicateWarningOpen(false); setPendingData(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddDuplicate}>Add Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
