import { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFPageProxy } from 'pdfjs-dist';
import { getEffectiveRotation } from '../../src/utils/pdfUtils';
import './TextLayer.css';

interface TextLayerProps {
  page: PDFPageProxy;
  scale: number;
  rotation: number;
  searchQuery?: string;
  activeMatchPage?: number;
  activeMatchIndex?: number;
}

export function TextLayer({
  page,
  scale,
  rotation,
  searchQuery,
  activeMatchPage,
  activeMatchIndex,
}: TextLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textContentRef = useRef<any>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !page) return;

    let cancelled = false;

    const renderText = async () => {
      try {
        // Clear previous content
        container.innerHTML = '';

        // Calculate effective rotation
        const effectiveRotation = getEffectiveRotation(page, rotation);
        const viewport = page.getViewport({ scale, rotation: effectiveRotation });

        // Set container dimensions
        container.style.width = `${viewport.width}px`;
        container.style.height = `${viewport.height}px`;

        // Fetch text content if we haven't already
        if (!textContentRef.current) {
          textContentRef.current = await page.getTextContent();
        }

        if (cancelled) return;

        // Render text layer
        const textLayer = new (pdfjsLib as any).TextLayer({
          textContentSource: textContentRef.current,
          container,
          viewport,
        });

        await textLayer.render();

        if (cancelled) return;

        // Apply search highlights if needed
        if (searchQuery && searchQuery.trim() !== '') {
          highlightSearchTerms(container, searchQuery, page.pageNumber === activeMatchPage ? activeMatchIndex : -1);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error rendering text layer:', error);
        }
      }
    };

    renderText();

    return () => {
      cancelled = true;
    };
  }, [page, scale, rotation, searchQuery, activeMatchPage, activeMatchIndex]);

  // Highlight search terms in the rendered text layer
  const highlightSearchTerms = (container: HTMLDivElement, query: string, activeIndex: number = -1) => {
    if (!query) return;

    const textNodes = Array.from(container.childNodes);
    const searchRegex = new RegExp(query, 'gi');
    let matchCount = 0;

    textNodes.forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const element = node as HTMLElement;
      const text = element.textContent || '';

      if (!text) return;

      const matches = Array.from(text.matchAll(searchRegex));
      if (matches.length === 0) return;

      // Clear existing content
      element.textContent = '';
      let lastIndex = 0;

      matches.forEach((match) => {
        const matchStart = match.index!;
        const matchEnd = matchStart + match[0].length;

        // Add text before match
        if (matchStart > lastIndex) {
          element.appendChild(document.createTextNode(text.substring(lastIndex, matchStart)));
        }

        // Add highlighted match
        const highlightSpan = document.createElement('span');
        highlightSpan.textContent = match[0];
        highlightSpan.className = `highlight ${matchCount === activeIndex ? 'active' : ''}`;
        element.appendChild(highlightSpan);

        lastIndex = matchEnd;
        matchCount++;
      });

      // Add remaining text
      if (lastIndex < text.length) {
        element.appendChild(document.createTextNode(text.substring(lastIndex)));
      }
    });
  };

  return <div ref={containerRef} className="text-layer-container" />;
}
