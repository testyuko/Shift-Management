import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";

interface PrintPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: React.ReactNode;
  onSplitPrint?: (half: 'first' | 'second') => React.ReactNode;
}

const PrintPreviewDialog = ({ open, onOpenChange, title, content, onSplitPrint }: PrintPreviewDialogProps) => {
  const { t } = useTranslation();
  const [printMode, setPrintMode] = useState<'full' | 'first' | 'second'>('full');

  const handlePrint = (mode: 'full' | 'first' | 'second' = 'full') => {
    // プレビュー部分のみを印刷
    let printElement = document.getElementById('print-preview-content');
    if (mode === 'first') {
      printElement = document.getElementById('print-preview-first-half');
    } else if (mode === 'second') {
      printElement = document.getElementById('print-preview-second-half');
    }
    if (!printElement) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              padding: 20px;
              background: white;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 2px solid #000;
              padding: 8px;
              text-align: center;
              font-size: 12px;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .weekend {
              background-color: #e5e5e5;
            }
            .sunday {
              color: #dc2626;
            }
            .saturday {
              color: #2563eb;
            }
            h2 {
              text-align: center;
              margin-bottom: 20px;
              font-size: 24px;
            }
            @media print {
              body {
                padding: 0;
              }
              @page {
                size: A4 landscape;
                margin: 10mm;
              }
            }
          </style>
        </head>
        <body>
          ${printElement.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // 少し待ってから印刷ダイアログを表示
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">{t('printPreview')}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          {printMode === 'full' && (
            <div className="bg-white shadow-lg mx-auto max-w-[1200px] p-8" id="print-preview-content">
              {content}
            </div>
          )}
          {printMode === 'first' && onSplitPrint && (
            <div className="bg-white shadow-lg mx-auto max-w-[1200px] p-8" id="print-preview-first-half">
              {onSplitPrint('first')}
            </div>
          )}
          {printMode === 'second' && onSplitPrint && (
            <div className="bg-white shadow-lg mx-auto max-w-[1200px] p-8" id="print-preview-second-half">
              {onSplitPrint('second')}
            </div>
          )}
        </div>

        <div className="border-t p-4 flex flex-col gap-4">
          {onSplitPrint && (
            <div className="flex justify-center gap-2">
              <Button
                onClick={() => setPrintMode('full')}
                variant={printMode === 'full' ? 'default' : 'outline'}
                className="py-2 px-4"
              >
                {t('monthly')}
              </Button>
              <Button
                onClick={() => setPrintMode('first')}
                variant={printMode === 'first' ? 'default' : 'outline'}
                className="py-2 px-4"
              >
                {t('firstHalf')}
              </Button>
              <Button
                onClick={() => setPrintMode('second')}
                variant={printMode === 'second' ? 'default' : 'outline'}
                className="py-2 px-4"
              >
                {t('secondHalf')}
              </Button>
            </div>
          )}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => handlePrint(printMode)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 text-lg"
            >
              <Printer className="mr-2 h-5 w-5" />
              {t('print')}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="py-3 px-8 text-lg"
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreviewDialog;
