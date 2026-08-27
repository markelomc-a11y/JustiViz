import { buildClauseTraceSet, generateStaticTrace } from './staticTraceGenerator';
import { buildClauseTraceSetPt, generateStaticTracePt } from './staticTraceGeneratorPt';
import type { ContractTrace } from '../types';

export interface ClauseSegment {
  index?: number;
  title?: string;
  text?: string;
}

const PORTUGUESE_LANGUAGE_MARKERS = [
  'dl 446/85',
  'código',
  'rgpd',
  'cláusula',
  'prestador',
  'indemniz',
  'concorrência',
];

export const normalizeContractText = (text: string): string => text.trim();

export const isPortugueseContract = (category: string, contractText: string): boolean => {
  const normalizedCategory = category.toLowerCase();
  const normalizedText = contractText.toLowerCase();

  return PORTUGUESE_LANGUAGE_MARKERS.some((marker) =>
    normalizedCategory.includes(marker) || normalizedText.includes(marker)
  );
};

export const parseUploadedFile = async (file: File): Promise<string> => {
  const name = file.name.toLowerCase();

  if (name.endsWith('.txt')) {
    return file.text();
  }

  if (name.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value || '';
  }

  if (name.endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    let fullText = '';

    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
      const page = await pdf.getPage(pageIndex);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (pageText) {
        fullText += `${pageText}\n`;
      }
    }

    return fullText.trim();
  }

  throw new Error('Unsupported file type. Please upload a .txt, .docx, or .pdf file.');
};

export const buildTraceFromContractText = ({
  contractTitle,
  category,
  contractText,
  segmentList,
}: {
  contractTitle: string;
  category: string;
  contractText: string;
  segmentList?: ClauseSegment[];
}): ContractTrace => {
  return buildClauseTraceSetPt({
    contractTitle,
    category,
    contractText,
    clauseSegments: segmentList ?? [],
  });
};

export const buildFallbackTrace = ({
  contractTitle,
  category,
  contractText,
}: {
  contractTitle: string;
  category: string;
  contractText: string;
}): ContractTrace => {
  return generateStaticTracePt({ contractTitle, category, contractText });
};
