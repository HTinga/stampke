import { StampConfig, StampShape, BorderStyle } from '../types';

/**
 * Renders a StampConfig to a PNG data URL.
 * Used for generating unique stamps for each page in sequential numbering.
 * This is a standalone DOM-based renderer that mimics SVGPreview.tsx.
 */
export async function renderStampToPng(config: StampConfig, size: number = 600): Promise<string> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  try {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", size.toString());
    svg.setAttribute("height", size.toString());
    svg.setAttribute("viewBox", `0 0 600 600`);
    
    // Add filters
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <filter id="distressFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="3" seed="${Math.random()}" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="wetInkFilter">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="${Math.random()}" result="noise" />
        <feDisplacementMap in="blur" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    `;
    svg.appendChild(defs);

    const cx = 300;
    const cy = 300;
    const finalColor = config.isVintage ? '#111827' : (config.borderColor || '#1e3a8a');
    const filter = config.wetInk ? "url(#wetInkFilter)" : "url(#distressFilter)";

    // 1. Draw Shape & Borders
    const r = (600 / 2) - 60;
    const borderR = r + (config.borderOffset || 0);

    const drawBorder = (radius: number, thickness: number, color: string, style: BorderStyle, isInner = false) => {
      let el: SVGElement;
      if (config.shape === 'ROUND' || config.shape === 'OVAL') {
        el = document.createElementNS("http://www.w3.org/2000/svg", config.shape === 'ROUND' ? "circle" : "ellipse");
        el.setAttribute("cx", cx.toString());
        el.setAttribute("cy", cy.toString());
        if (config.shape === 'ROUND') {
          el.setAttribute("r", radius.toString());
        } else {
          el.setAttribute("rx", (radius * 1.25).toString());
          el.setAttribute("ry", (radius * 0.85).toString());
        }
      } else {
        const rw = (600 * 0.85) + (config.borderOffset || 0) * 2 - (isInner ? 20 : 0);
        const rh = (config.shape === 'SQUARE' ? 510 : 300) + (config.borderOffset || 0) * 2 - (isInner ? 20 : 0);
        el = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        el.setAttribute("x", (cx - rw/2).toString());
        el.setAttribute("y", (cy - rh/2).toString());
        el.setAttribute("width", rw.toString());
        el.setAttribute("height", rh.toString());
        el.setAttribute("rx", "4");
      }
      
      el.setAttribute("fill", "none");
      el.setAttribute("stroke", color);
      el.setAttribute("stroke-width", thickness.toString());
      if (style === BorderStyle.DOTTED) el.setAttribute("stroke-dasharray", "2, 4");
      if (style === BorderStyle.DASHED) el.setAttribute("stroke-dasharray", "8, 4");
      el.setAttribute("filter", filter);
      svg.appendChild(el);
    };

    drawBorder(borderR, config.borderWidth || 3, finalColor, config.borderStyle || BorderStyle.SINGLE);
    
    if (config.doubleBorder) {
      const dbOffset = config.doubleBorderOffset || 10;
      const dbR = borderR + (config.doubleBorderIsOuter ? dbOffset : -dbOffset);
      drawBorder(dbR, config.doubleBorderThickness || 1.5, config.doubleBorderColor || finalColor, config.doubleBorderStyle || BorderStyle.SINGLE);
    }

    if (config.showInnerLine) {
      drawBorder(borderR - (config.innerLineOffset || 15), config.innerLineWidth || 2, finalColor, BorderStyle.SINGLE, true);
    }

    // 2. Paths for curved text
    const rx = (config.shape === 'ROUND' ? r : r * 1.25) - (config.fontSize * 0.4);
    const ry = (config.shape === 'ROUND' ? r : r * 0.85) - (config.fontSize * 0.4);
    
    const pathTop = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathTop.setAttribute("id", "pathTop");
    pathTop.setAttribute("d", `M ${cx - rx},${cy} A ${rx},${ry} 0 1,1 ${cx + rx},${cy}`);
    pathTop.setAttribute("fill", "none");
    svg.appendChild(pathTop);

    const pathBottom = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathBottom.setAttribute("id", "pathBottom");
    pathBottom.setAttribute("d", `M ${cx - rx},${cy} A ${rx},${ry} 0 1,0 ${cx + rx},${cy}`);
    pathBottom.setAttribute("fill", "none");
    svg.appendChild(pathBottom);

    const addText = (content: string, pathId: string | null, yPos: number, cProps: any) => {
      if (!content) return;
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      const fSize = cProps.fontSize || config.fontSize || 24;
      
      t.setAttribute("fill", cProps.color || finalColor);
      t.setAttribute("font-family", cProps.fontFamily || config.fontFamily || "Arial");
      t.setAttribute("font-size", fSize.toString());
      t.setAttribute("font-weight", cProps.bold ? "bold" : "normal");
      t.setAttribute("filter", filter);

      if (pathId && (config.shape === 'ROUND' || config.shape === 'OVAL')) {
        const tp = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
        tp.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `#${pathId}`);
        tp.setAttribute("startOffset", "50%");
        tp.setAttribute("text-anchor", "middle");
        if (pathId === 'pathBottom') tp.setAttribute("dominant-baseline", "hanging");
        tp.textContent = content;
        t.appendChild(tp);
      } else {
        t.setAttribute("x", cx.toString());
        t.setAttribute("y", yPos.toString());
        t.setAttribute("text-anchor", "middle");
        t.textContent = content;
      }
      svg.appendChild(t);
    };

    // 3. Render Texts
    const rh = config.shape === 'SQUARE' ? 510 : 300;
    addText(config.primaryText, "pathTop", cy - rh/2 + 45, { fontSize: config.primaryFontSize, bold: config.primaryBold, color: config.primaryColor });
    addText(config.secondaryText, "pathBottom", cy + rh/2 - 25, { fontSize: config.secondaryFontSize, bold: config.secondaryBold, color: config.secondaryColor });
    
    // Center texts
    const centerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    centerGroup.setAttribute("transform", `translate(${cx + (config.centerXOffset || 0)}, ${cy + (config.centerYOffset || 0)})`);
    
    if (config.showDateLine || config.centerSubText) {
      const sub = document.createElementNS("http://www.w3.org/2000/svg", "text");
      sub.setAttribute("y", (-(config.centerSubFontSize || 18)).toString());
      sub.setAttribute("text-anchor", "middle");
      sub.setAttribute("fill", config.centerSubColor || finalColor);
      sub.setAttribute("font-size", (config.centerSubFontSize || 18).toString());
      sub.setAttribute("font-family", config.centerSubFontFamily || config.fontFamily);
      sub.textContent = config.selectedDate || config.centerSubText;
      centerGroup.appendChild(sub);
    }

    const main = document.createElementNS("http://www.w3.org/2000/svg", "text");
    main.setAttribute("y", "10");
    main.setAttribute("text-anchor", "middle");
    main.setAttribute("fill", config.centerColor || finalColor);
    main.setAttribute("font-size", (config.centerFontSize || 32).toString());
    main.setAttribute("font-weight", config.centerBold ? "bold" : "normal");
    main.setAttribute("font-family", config.centerFontFamily || config.fontFamily);
    main.textContent = config.centerText;
    centerGroup.appendChild(main);

    svg.appendChild(centerGroup);

    // 4. Custom Elements (Images only supported if URL is data URL)
    if (config.customElements) {
       config.customElements.forEach(el => {
          if (el.type === 'text') {
             const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
             t.setAttribute("x", el.x.toString());
             t.setAttribute("y", el.y.toString());
             t.setAttribute("fill", el.color || finalColor);
             t.setAttribute("font-size", (el.fontSize || 24).toString());
             t.setAttribute("font-weight", el.isBold ? "bold" : "normal");
             t.setAttribute("font-family", el.fontFamily || config.fontFamily);
             t.setAttribute("transform", `rotate(${el.rotation || 0}, ${el.x}, ${el.y})`);
             t.textContent = el.content;
             svg.appendChild(t);
          }
       });
    }

    container.appendChild(svg);

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    const img = new Image();
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    return new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
        document.body.removeChild(container);
      };
      img.onerror = (e) => {
        console.error("Image load error", e);
        URL.revokeObjectURL(url);
        resolve("");
        document.body.removeChild(container);
      };
      img.src = url;
    });
  } catch (err) {
    console.error("Stamp rendering failed:", err);
    if (container.parentNode) document.body.removeChild(container);
    return "";
  }
}
