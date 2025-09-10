import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportDialog({ scriptDoc, onClose }) {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      // This would integrate with a PDF generation library
      // For now, we'll use the browser's print functionality
      const printWindow = window.open('', '_blank');
      
      const content = generatePrintableHTML(scriptDoc);
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
      
      toast.success('PDF export prepared');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
    setIsExporting(false);
  };

  const exportToFountain = () => {
    const fountainContent = generateFountainFormat(scriptDoc);
    
    // Copy to clipboard
    navigator.clipboard.writeText(fountainContent).then(() => {
      toast.success('Fountain format copied to clipboard');
    });

    // Also trigger download
    const blob = new Blob([fountainContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scriptDoc.title || 'script'}.fountain`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Script</DialogTitle>
          <DialogDescription>
            Choose your export format and options.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={exportFormat} onValueChange={setExportFormat}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pdf">PDF</TabsTrigger>
            <TabsTrigger value="fountain">Fountain</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pdf" className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">PDF Export</h4>
              <p className="text-sm text-gray-600">
                Standard screenplay format with proper margins, fonts, and page numbering.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">US Letter</Badge>
                <Badge variant="outline">Courier Prime</Badge>
                <Badge variant="outline">Industry Standard</Badge>
              </div>
            </div>
            
            <Button 
              onClick={exportToPDF} 
              disabled={isExporting}
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isExporting ? 'Preparing PDF...' : 'Export PDF'}
            </Button>
          </TabsContent>
          
          <TabsContent value="fountain" className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Fountain Format</h4>
              <p className="text-sm text-gray-600">
                Plain text markup format that can be imported into any screenwriting software.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">Plain Text</Badge>
                <Badge variant="outline">Universal</Badge>
                <Badge variant="outline">Version Control Friendly</Badge>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={exportToFountain}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  const content = generateFountainFormat(scriptDoc);
                  navigator.clipboard.writeText(content);
                  toast.success('Copied to clipboard');
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Generate printable HTML for PDF export
const generatePrintableHTML = (scriptDoc) => {
  const { titlePage } = scriptDoc.settings || {};
  
  let html = `
    <html>
      <head>
        <title>${scriptDoc.title || 'Script'}</title>
        <style>
          @page {
            size: letter;
            margin: 1in 1in 1in 1.5in;
          }
          body {
            font-family: "Courier New", Courier, monospace;
            font-size: 12pt;
            line-height: 1.2;
            margin: 0;
            padding: 0;
          }
          .title-page {
            text-align: center;
            page-break-after: always;
            padding-top: 2in;
          }
          .title { font-size: 24pt; font-weight: bold; margin-bottom: 1in; }
          .author { font-size: 14pt; margin-bottom: 2in; }
          .contact { font-size: 12pt; text-align: left; position: absolute; bottom: 1in; }
          .scene { font-weight: bold; text-align: left; margin: 1em 0; }
          .character { text-align: center; margin: 1em 2.5in 0 2.5in; font-weight: bold; }
          .dialogue { margin: 0 2.5in 0 1in; }
          .parenthetical { text-align: center; margin: 0 2in; font-style: italic; }
          .transition { text-align: right; font-weight: bold; margin: 1em 0; }
          .action { margin: 1em 0; }
          .shot { font-weight: bold; margin: 1em 0; }
        </style>
      </head>
      <body>`;

  // Title page
  if (titlePage && (titlePage.title || titlePage.author)) {
    html += `
      <div class="title-page">
        <div class="title">${titlePage.title || ''}</div>
        <div class="author">Written by<br/>${titlePage.author || ''}</div>
        <div class="contact">${titlePage.contact || ''}<br/>${titlePage.draftDate || ''}</div>
      </div>`;
  }

  // Script content
  scriptDoc.lines.forEach(line => {
    const className = line.type === 'scene' ? 'scene' :
                     line.type === 'character' ? 'character' :
                     line.type === 'dialogue' ? 'dialogue' :
                     line.type === 'parenthetical' ? 'parenthetical' :
                     line.type === 'transition' ? 'transition' :
                     line.type === 'shot' ? 'shot' : 'action';
    
    html += `<div class="${className}">${line.text}</div>`;
  });

  html += `
      </body>
    </html>`;

  return html;
};

// Generate Fountain format
const generateFountainFormat = (scriptDoc) => {
  let fountain = '';

  // Title page
  const { titlePage } = scriptDoc.settings || {};
  if (titlePage) {
    if (titlePage.title) fountain += `Title: ${titlePage.title}\n`;
    if (titlePage.author) fountain += `Author: ${titlePage.author}\n`;
    if (titlePage.contact) fountain += `Contact: ${titlePage.contact}\n`;
    if (titlePage.draftDate) fountain += `Draft date: ${titlePage.draftDate}\n`;
    fountain += '\n';
  }

  // Script content
  scriptDoc.lines.forEach(line => {
    switch (line.type) {
      case 'scene':
        fountain += `${line.text}\n\n`;
        break;
      case 'character':
        fountain += `${line.text}\n`;
        break;
      case 'parenthetical':
        fountain += `(${line.text})\n`;
        break;
      case 'dialogue':
        fountain += `${line.text}\n\n`;
        break;
      case 'transition':
        fountain += `${line.text}\n\n`;
        break;
      case 'shot':
        fountain += `${line.text}\n\n`;
        break;
      default:
        fountain += `${line.text}\n\n`;
    }
  });

  return fountain;
};