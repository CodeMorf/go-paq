import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { ClientProfile } from '../../../types';
import {
  CreditCard,
  X,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Building2,
  Percent
} from 'lucide-react';
import { Button } from '../../ui/DesignSystem';

interface CreditAdjustmentModalProps {
  client: ClientProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CreditAdjustmentModal: React.FC<CreditAdjustmentModalProps> = ({ client, isOpen, onClose }) => {
  const { formatMoney, adjustClientCreditLimit, addToast } = useApp();

  if (!isOpen || !client) return null;

  const [newLimit, setNewLimit] = useState<number>(client.creditLimitDop || 100000);
  const [creditDays, setCreditDays] = useState<number>(client.creditDays || 30);
  const [reason, setReason] = useState<string>('Evaluación periódica de volumen y récord crediticio intachable');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLimit < 0) {
      addToast('error', 'Límite Inválido', 'El límite de crédito no puede ser negativo.');
      return;
    }

    adjustClientCreditLimit(client.id, newLimit, creditDays);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Ajustar Línea de Crédito Comercial
              </h3>
              <p className="text-xs text-slate-500">
                {client.companyName || client.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 flex justify-between items-center">
            <span className="text-slate-500">Límite Actual:</span>
            <strong className="font-mono text-sm text-slate-900 dark:text-white font-bold">
              {formatMoney(client.creditLimitDop)}
            </strong>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Nuevo Límite de Crédito Aprobado (RD$)
            </label>
            <input
              type="number"
              step="10000"
              min="0"
              required
              value={newLimit}
              onChange={(e) => setNewLimit(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-lg font-black text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Plazo de Pago Autorizado
            </label>
            <select
              value={creditDays}
              onChange={(e) => setCreditDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
            >
              <option value={15}>15 Días (Quincenal)</option>
              <option value={30}>30 Días (Mensual Regular)</option>
              <option value={45}>45 Días (Corporativo Preferencial)</option>
              <option value={60}>60 Días (Enterprise & Multinacional)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Motivo del Ajuste / Aprobación Comité de Riesgo
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={<CreditCard className="w-4 h-4" />}>
              Aprobar Nuevo Límite
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
};
