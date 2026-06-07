import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  shortUrl: string;
  slug: string;
}

const CORRECTION_LEVELS: Array<"L" | "M" | "Q" | "H"> = ["L", "M", "Q", "H"];

export default function QRCodeDisplay({ shortUrl, slug }: QRCodeDisplayProps) {
  const [foregroundColor, setForegroundColor] = useState("#783f8e");
  const [backgroundColor, setBackgroundColor] = useState("#f8f5fd");
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<"L" | "M" | "Q" | "H">("H");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<"png" | "svg" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      if (logoUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(logoUrl);
      }
    };
  }, [logoUrl]);

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (logoUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(logoUrl);
    }

    setLogoUrl(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    if (logoUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(logoUrl);
    }
    setLogoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerDownload = (mime: "png" | "svg") => {
    setDownloadState(mime);
    window.setTimeout(() => setDownloadState(null), 1800);
  };

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `scissor-qr-${slug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerDownload("png");
  };

  const downloadSVG = () => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const svgText = serializer.serializeToString(svgElement);
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scissor-qr-${slug}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerDownload("svg");
  };

  return (
    <div className="grid w-full gap-6 rounded-[2rem] border border-[#d8cfee] bg-white/65 p-5 backdrop-blur-2xl lg:grid-cols-[auto,1fr]">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-[1.5rem] border border-[#d8cfee] bg-[#f8f5fd] p-5 shadow-2xl shadow-[#b79bdb]/10">
          <QRCodeSVG
            ref={svgRef}
            value={shortUrl}
            size={220}
            level={errorCorrectionLevel}
            fgColor={foregroundColor}
            bgColor={backgroundColor}
            imageSettings={
              logoUrl
                ? {
                    src: logoUrl,
                    height: 42,
                    width: 42,
                    excavate: true,
                  }
                : undefined
            }
          />
        </div>

        <div className="hidden">
          <QRCodeCanvas
            ref={canvasRef}
            value={shortUrl}
            size={1024}
            level={errorCorrectionLevel}
            fgColor={foregroundColor}
            bgColor={backgroundColor}
            imageSettings={
              logoUrl
                ? {
                    src: logoUrl,
                    height: 192,
                    width: 192,
                    excavate: true,
                  }
                : undefined
            }
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#5b4c73]">
          <span className="rounded-full border border-[#d8cfee] bg-white/70 px-3 py-1">Live preview</span>
          <span className="rounded-full border border-[#d8cfee] bg-white/70 px-3 py-1 font-mono">{shortUrl}</span>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#783f8e]">QR code</p>
          <h3 className="mt-2 text-2xl font-display font-bold text-[#3d245d]">Customize and download</h3>
          <p className="mt-2 text-sm leading-7 text-[#5b4c73]">
            Update the foreground, background, and error correction level in real time. Add a logo overlay to keep the QR
            aligned with your brand.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#5b4c73]">Foreground</span>
            <div className="flex items-center gap-3 rounded-2xl border border-[#d8cfee] bg-[#f8f5fd] px-3 py-2.5">
              <input
                id="qr-fg-color"
                type="color"
                value={foregroundColor}
                onChange={(event) => setForegroundColor(event.target.value)}
                className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="font-mono text-xs uppercase text-[#3d245d]">{foregroundColor}</span>
            </div>
          </label>

          <label className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#5b4c73]">Background</span>
            <div className="flex items-center gap-3 rounded-2xl border border-[#d8cfee] bg-[#f8f5fd] px-3 py-2.5">
              <input
                id="qr-bg-color"
                type="color"
                value={backgroundColor}
                onChange={(event) => setBackgroundColor(event.target.value)}
                className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="font-mono text-xs uppercase text-[#3d245d]">{backgroundColor}</span>
            </div>
          </label>
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#5b4c73]">Error correction</span>
          <div className="grid grid-cols-4 gap-2">
            {CORRECTION_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setErrorCorrectionLevel(level)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  errorCorrectionLevel === level
                    ? "border-[#783f8e] bg-[#783f8e] text-white"
                    : "border-[#d8cfee] bg-white/70 text-[#5b4c73] hover:bg-white"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#5b4c73]">Logo overlay</span>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="qr-logo-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center rounded-xl border border-[#d8cfee] bg-white/70 px-4 py-2 text-xs font-semibold text-[#3d245d] transition hover:bg-white"
            >
              Upload Logo
            </button>
            {logoUrl ? (
              <button
                type="button"
                onClick={removeLogo}
                className="inline-flex items-center justify-center rounded-xl border border-[#d8cfee] bg-[#f8f5fd] px-4 py-2 text-xs font-semibold text-[#783f8e] transition hover:bg-white"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={downloadPNG}
            id="download-png-btn"
            className="inline-flex items-center justify-center rounded-2xl bg-[#783f8e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#652f79]"
          >
            {downloadState === "png" ? "Downloaded PNG" : "Download PNG"}
          </button>
          <button
            type="button"
            onClick={downloadSVG}
            id="download-svg-btn"
            className="inline-flex items-center justify-center rounded-2xl border border-[#d8cfee] bg-white/70 px-4 py-3 text-sm font-semibold text-[#3d245d] transition hover:bg-white"
          >
            {downloadState === "svg" ? "Downloaded SVG" : "Download SVG"}
          </button>
        </div>
      </div>
    </div>
  );
}
