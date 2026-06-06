import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Check, Download, Image as ImageIcon, Palette, ShieldCheck, Upload, X } from "lucide-react";

interface QRCodeDisplayProps {
  shortUrl: string;
  slug: string;
}

const CORRECTION_LEVELS: Array<"L" | "M" | "Q" | "H"> = ["L", "M", "Q", "H"];

export default function QRCodeDisplay({ shortUrl, slug }: QRCodeDisplayProps) {
  const [foregroundColor, setForegroundColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
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
    if (!canvas) {
      return;
    }

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
    if (!svgElement) {
      return;
    }

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
    <div className="grid w-full gap-6 rounded-[2rem] border border-soft-500/15 bg-dark-900/80 p-5 backdrop-blur-2xl lg:grid-cols-[auto,1fr]">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-[1.5rem] border border-soft-500/20 bg-white p-5 shadow-2xl shadow-black/25">
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

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span className="rounded-full border border-soft-500/20 bg-white/5 px-3 py-1">Live preview</span>
          <span className="rounded-full border border-soft-500/20 bg-white/5 px-3 py-1 font-mono">{shortUrl}</span>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-soft-200">QR code</p>
          <h3 className="mt-2 text-2xl font-display font-bold text-white">Customize and download</h3>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Update the foreground, background, and error correction level in real time. Add a logo overlay to keep the QR
            aligned with your brand.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <Palette className="h-4 w-4 text-soft-200" />
              Foreground
            </span>
            <div className="flex items-center gap-3 rounded-2xl border border-soft-500/15 bg-[#050407] px-3 py-2.5">
              <input
                id="qr-fg-color"
                type="color"
                value={foregroundColor}
                onChange={(event) => setForegroundColor(event.target.value)}
                className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="font-mono text-xs uppercase text-slate-300">{foregroundColor}</span>
            </div>
          </label>

          <label className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <Palette className="h-4 w-4 text-soft-200" />
              Background
            </span>
            <div className="flex items-center gap-3 rounded-2xl border border-soft-500/15 bg-[#050407] px-3 py-2.5">
              <input
                id="qr-bg-color"
                type="color"
                value={backgroundColor}
                onChange={(event) => setBackgroundColor(event.target.value)}
                className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="font-mono text-xs uppercase text-slate-300">{backgroundColor}</span>
            </div>
          </label>
        </div>

        <div className="space-y-2">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-soft-300" />
            Error correction
          </span>
          <div className="grid grid-cols-4 gap-2">
            {CORRECTION_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setErrorCorrectionLevel(level)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  errorCorrectionLevel === level
                    ? "border-primary-500/40 bg-primary-600 text-white"
                    : "border-soft-500/15 bg-white/5 text-slate-300 hover:border-primary-500/20 hover:bg-white/10"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <ImageIcon className="h-4 w-4 text-soft-300" />
            Logo overlay
          </span>
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
              className="inline-flex items-center gap-2 rounded-xl border border-soft-500/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-primary-500/25 hover:bg-white/10"
            >
              <Upload className="h-4 w-4" />
              Upload Logo
            </button>
            {logoUrl ? (
              <button
                type="button"
                onClick={removeLogo}
                className="inline-flex items-center gap-2 rounded-xl border border-soft-500/20 bg-primary-950/30 px-4 py-2 text-xs font-semibold text-light-200 transition hover:bg-primary-950/50"
              >
                <X className="h-4 w-4" />
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
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-accent-500 hover:to-primary-500"
          >
            {downloadState === "png" ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {downloadState === "png" ? "Downloaded PNG" : "Download PNG"}
          </button>
          <button
            type="button"
            onClick={downloadSVG}
            id="download-svg-btn"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-soft-500/15 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-primary-500/20 hover:bg-white/10"
          >
            {downloadState === "svg" ? <Check className="h-4 w-4 text-soft-300" /> : <Download className="h-4 w-4" />}
            {downloadState === "svg" ? "Downloaded SVG" : "Download SVG"}
          </button>
        </div>
      </div>
    </div>
  );
}
