import React, { useMemo, useState } from 'react';
import { Camera, CheckCircle2, ImagePlus, ShieldCheck, UploadCloud } from 'lucide-react';
import { ApiClient } from '../../api/client';
import { GoPaqLogo } from '../ui/GoPaqLogo';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function readAndOptimize(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No fue posible leer la imagen.'));
    reader.onload = () => {
      const source = String(reader.result || '');
      const image = new Image();
      image.onerror = () => reject(new Error('El archivo no contiene una imagen válida.'));
      image.onload = () => {
        const maxSide = 1400;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) { resolve(source); return; }
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        let quality = 0.86;
        let optimized = canvas.toDataURL('image/jpeg', quality);
        while (optimized.length * 0.75 > MAX_IMAGE_BYTES && quality > 0.5) {
          quality -= 0.08;
          optimized = canvas.toDataURL('image/jpeg', quality);
        }
        if (optimized.length * 0.75 > MAX_IMAGE_BYTES) reject(new Error('La foto sigue superando el límite de 2 MB. Toma una imagen más sencilla.'));
        else resolve(optimized);
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}

export const DriverPhotoUpload: React.FC = () => {
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token') || '', []);
  const [preview, setPreview] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [card, setCard] = useState<any | null>(null);

  const choosePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setCard(null);
    if (!file.type.startsWith('image/')) { setError('Selecciona una imagen JPG, PNG o WEBP.'); return; }
    if (file.size > 12 * 1024 * 1024) { setError('La foto original es demasiado grande. Selecciona una imagen de máximo 12 MB.'); return; }
    try {
      const optimized = await readAndOptimize(file);
      setPhotoDataUrl(optimized);
      setPreview(optimized);
      setFileName(file.name);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible preparar la foto.');
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) { setError('Este enlace no es válido. Solicita al administrador un enlace nuevo.'); return; }
    if (!photoDataUrl) { setError('Selecciona una foto antes de continuar.'); return; }
    setLoading(true);
    setError('');
    const result = await ApiClient.uploadDriverPhoto(token, photoDataUrl);
    setLoading(false);
    if (!result.success) { setError(result.error || 'El enlace no pudo procesar la foto.'); return; }
    setCard(result.card);
  };

  return <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-900 sm:px-6 sm:py-10"><div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-[.82fr_1.18fr]"><aside className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between"><div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" /><div className="relative"><GoPaqLogo variant="horizontal" size="sm" showSlogan={false} theme="dark" /><p className="mt-12 text-xs font-black uppercase tracking-[.2em] text-orange-300">Identificación operativa</p><h1 className="mt-4 text-4xl font-black leading-tight">Completa tu foto para tu carnet GoPaq.</h1><p className="mt-5 text-sm leading-7 text-slate-300">La imagen se envía por un enlace temporal y seguro. No necesitas crear una cuenta para completar este paso.</p></div><div className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300"><ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" /><span>Enlace de un solo uso · datos protegidos</span></div></aside><section className="p-5 sm:p-10"><div className="flex items-center justify-between gap-4 lg:hidden"><GoPaqLogo variant="horizontal" size="sm" showSlogan={false} theme="light" /><span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-indigo-700">Foto de conductor</span></div>{card ? <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-9 w-9" /></div><h2 className="mt-6 text-2xl font-black text-slate-950">Foto recibida correctamente</h2><p className="mt-3 text-sm leading-6 text-slate-500">El carnet quedó generado y persistido en GoPaq. El administrador podrá verlo e imprimirlo desde Conductores y flota.</p><div className="mt-6 w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Número de carnet</p><p className="mt-2 font-mono text-2xl font-black text-emerald-950">{card.cardNumber}</p></div></div> : <div className="mx-auto max-w-md py-8"><p className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">Paso final</p><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Sube una foto clara</h2><p className="mt-3 text-sm leading-6 text-slate-500">Usa una foto de frente, con buena luz y sin filtros. El servidor la optimizará para el carnet.</p>{!token && <div role="alert" className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Este enlace no contiene un token válido. Solicita uno nuevo al administrador.</div>}<form onSubmit={submit} className="mt-7 space-y-5"><label className="group flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-indigo-200 bg-indigo-50/60 p-5 text-center transition hover:border-indigo-400 hover:bg-indigo-50">{preview ? <img src={preview} alt="Vista previa de la foto seleccionada" className="h-56 w-full rounded-2xl object-contain" /> : <><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm"><Camera className="h-8 w-8" /></div><span className="mt-4 text-sm font-black text-indigo-950">Tomar o seleccionar foto</span><span className="mt-1 text-xs text-slate-500">JPG, PNG o WEBP · máximo 2 MB procesados</span></>}<input className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => void choosePhoto(event)} /></label>{fileName && <p className="flex items-center gap-2 text-xs text-slate-500"><ImagePlus className="h-4 w-4 text-indigo-600" />{fileName}</p>}{error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}<button disabled={loading || !photoDataUrl || !token} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Enviando foto…' : <><UploadCloud className="h-4 w-4" />Enviar foto y generar carnet</>}</button></form><p className="mt-6 flex items-start gap-2 text-[11px] leading-5 text-slate-400"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Este enlace vence automáticamente y solo puede utilizarse una vez.</p></div>}</section></div></main>;
};
