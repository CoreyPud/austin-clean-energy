import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, CheckCircle, XCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onResult: (monthlyKwh: number[]) => void;
}

type UploadState = "idle" | "parsing" | "done" | "error";

const BillUpload = ({ onResult }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [summary, setSummary] = useState<{ months: number; avgKwh: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      setState("error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large (max 5 MB).");
      setState("error");
      return;
    }

    setState("parsing");
    setError(null);
    setSummary(null);

    try {
      const base64 = await fileToBase64(file);
      const { data, error: fnError } = await supabase.functions.invoke("parse-bill", {
        body: { file: base64, filename: file.name },
      });

      if (fnError) {
        // Extract the actual error from the function body (Supabase wraps non-2xx responses)
        let msg = fnError.message;
        try {
          const body = typeof fnError.context?.body === "string"
            ? JSON.parse(fnError.context.body)
            : fnError.context?.body;
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      if (!Array.isArray(data?.months) || data.months.length === 0) {
        throw new Error("No monthly usage data found in the bill.");
      }

      // Take the most recent 12 months
      const recent: { kwh: number }[] = data.months.slice(-12);
      const monthlyKwh = recent.map((m: { kwh: number }) => m.kwh);

      setSummary({
        months: monthlyKwh.length,
        avgKwh: Math.round(monthlyKwh.reduce((s, v) => s + v, 0) / monthlyKwh.length),
      });
      setState("done");
      onResult(monthlyKwh);
    } catch (err: any) {
      setError(err.message || "Failed to parse bill.");
      setState("error");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const reset = () => {
    setState("idle");
    setSummary(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={onFileChange}
      />

      {state === "idle" && (
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drop your Austin Energy bill PDF here
          </p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
        </div>
      )}

      {state === "parsing" && (
        <div className="border rounded-lg p-4 text-center">
          <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Reading your bill…</p>
        </div>
      )}

      {state === "done" && summary && (
        <div className="border rounded-lg p-3 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                Found {summary.months} months · avg {summary.avgKwh} kWh/mo
              </p>
              <p className="text-xs text-muted-foreground">Calculator updated with your real usage</p>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={reset}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="border rounded-lg p-3 bg-destructive/5 border-destructive/20">
          <div className="flex items-start gap-2">
            <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={reset}>
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default BillUpload;
