import { useState, useRef } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { Download, Upload, Palette, ShieldCheck, Image as ImageIcon, Check } from "lucide-react";

interface QRCodeDisplayProps {
  shortUrl: string;
  slug: string;
}

export default function QRCodeDisplay({ shortUrl, slug }: QRCodeDisplayProps) {
  const [fgColor, setFgColor] = useState("#8b5cf6"); // default brand color
  const [bgColor, setBgColor] = useState("#ffffff");
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("Q");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerDownloadNotification = (type: string) => {
    setDownloadSuccess(type);
    setTimeout(() => setDownloadSuccess(null), 2000);
  };

  const downloadPNG = () => {
    const canvas = document.getElementById("scissor-qr-canvas") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `scissor-qr-${slug}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      triggerDownloadNotification("PNG");
    }
  };

  const downloadSVG = () => {
    const svgEl = document.getElementById("scissor-qr-svg");
    if (svgEl) {
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svgEl);
      const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = `scissor-qr-${slug}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
      triggerDownloadNotification("SVG");
    }
  };

  const removeLogo = () => {
    setLogoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-6 glass-card rounded-2xl w-full max-w-3xl mx-auto my-4">
      {/* Visual QR Code Wrapper */}
      <div className="relative p-6 bg-white rounded-xl shadow-xl flex items-center justify-center border border-slate-100 min-w-[200px]">
        {/* Render Canvas for PNG export (hidden but used for canvas export) */}
        <div className="hidden">
          <QRCodeCanvas
            id="scissor-qr-canvas"
            value={shortUrl}
            size={512}
            level={level}
            fgColor={fgColor}
            bgColor={bgColor}
            imageSettings={
              logoUrl
                ? {
                    src: logoUrl,
                    x: undefined,
                    y: undefined,
                    height: 96,
                    width: 96,
                    excavate: true,
                  }
                : undefined
            }
          />
        </div>

        {/* Render SVG for visual display and SVG export */}
        <QRCodeSVG
          id="scissor-qr-svg"
          value={shortUrl}
          size={200}
          level={level}
          fgColor={fgColor}
          bgColor={bgColor}
          imageSettings={
            logoUrl
              ? {
                  src: logoUrl,
                  x: undefined,
                  y: undefined,
                  height: 38,
                  width: 38,
                  excavate: true,
                }
              : undefined
          }
        />
      </div>

      {/* Configuration controls */}
      <div className="flex-1 flex flex-col gap-4 w-full">
        <div>
          <h3 className="text-xl font-bold font-display text-purple-300">Customize QR Code</h3>
          <p className="text-sm text-slate-400">Branded short links are more trusted and increase scan rates.</p>
        </div>

        {/* Color pickers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="qr-fg-color" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              Foreground Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="w-10 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                id="qr-fg-color"
              />
              <span className="text-xs font-mono text-slate-300 uppercase">{fgColor}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="qr-bg-color" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              Background Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-10 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                id="qr-bg-color"
              />
              <span className="text-xs font-mono text-slate-300 uppercase">{bgColor}</span>
            </div>
          </div>
        </div>

        {/* Logo overlay settings */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
            Center Logo Overlay
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              ref={fileInputRef}
              className="hidden"
              id="qr-logo-upload"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-2 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Logo
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={removeLogo}
                className="text-xs text-red-400 hover:text-red-300 font-semibold"
              >
                Remove Logo
              </button>
            )}
          </div>
        </div>

        {/* Error correction levels */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
            Error Correction Density (Reliability)
          </label>
          <div className="flex gap-2">
            {(["L", "M", "Q", "H"] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition ${
                  level === lvl
                    ? "bg-purple-600 border-purple-500 text-white"
                    : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {lvl === "L" && "Low (7%)"}
                {lvl === "M" && "Medium (15%)"}
                {lvl === "Q" && "Quartile (25%)"}
                {lvl === "H" && "High (30%)"}
              </button>
            ))}
          </div>
        </div>

        {/* Action Downloads */}
        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={downloadPNG}
            className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-purple-900/30 active:scale-95 duration-150 glow-button"
            id="download-png-btn"
          >
            {downloadSuccess === "PNG" ? <Check className="w-4 h-4 text-green-300" /> : <Download className="w-4 h-4" />}
            {downloadSuccess === "PNG" ? "Downloaded PNG!" : "Download PNG"}
          </button>
          <button
            type="button"
            onClick={downloadSVG}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition active:scale-95 duration-150"
            id="download-svg-btn"
          >
            {downloadSuccess === "SVG" ? <Check className="w-4 h-4 text-green-300" /> : <Download className="w-4 h-4" />}
            {downloadSuccess === "SVG" ? "Downloaded SVG!" : "Download SVG"}
          </button>
        </div>
      </div>
    </div>
  );
}
