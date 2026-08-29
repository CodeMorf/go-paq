import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { ClientProfile } from '../../../types';
import {
  Banknote,
  X,
  Send,
  CheckCircle2,
  Building2,
  CreditCard,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../ui/DesignSystem';

interface CodPayoutModalProps {
  client: ClientProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CodPayoutModal: React.FC<CodPayoutModalProps> = ({ client, isOpen, onClose }) => {
  const { formatMoney, payoutClientCod, addToast } = useApp();

  if (!isOpen || !client) return null;

  const [payoutAmount, setPayoutAmount] = useState<number>(client.codPendingPayoutDop || 0);
  const [bankName, setBankName] = useState<string>(client.bankInfo?.bankName || 'Banco Popular Dominicano');
  const [accountNumber, setAccountNumber] = useState<string>(client.bankInfo?.accountNumber || '7920194821');
  const [referenceNumber, setReferenceNumber] = useState<string>(
    `TRF-ACH-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [notes, setNotes] = useState<string>('Liquidación quincenal de recaudos COD paquetería express');

  const handleProcessPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutAmount <= 0) {
      addToast('error', 'Monto Inválido', 'El monto a desembolsar debe ser mayor a RD$ 0.');
      return;
    }
    if (payoutAmount > client.codPendingPayoutDop) {
      addToast('error', 'Exceso de Fondos', 'El monto no puede exceder el balance COD pendiente acumulado.');
      return;
    }

    payoutClientCod(client.id, payoutAmount, referenceNumber, bankName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Liquidar Fondos COD (Contra Entrega)
              </h3>
              <p className="text-xs text-slate-500">
                {client.companyName || client.name} • {client.lockerCode}
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
        <form onSubmit={handleProcessPayout} className="p-6 space-y-4 text-xs">
          
          {/* Balance info */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Balance COD Acumulado</span>
              <strong className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {formatMoney(client.codPendingPayoutDop)}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => setPayoutAmount(client.codPendingPayoutDop)}
              className="text-[11px] font-bold px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 transition"
            >
              Liquidar Total
            </button>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Monto a Transferir (RD$)
            </label>
            <input
              type="number"
              max={client.codPendingPayoutDop}
              min={1}
              step="100"
              required
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-base font-black text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Banco Receptor
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                No. Cuenta Destino
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Número de Referencia Bancaria / Comprobante ACH
            </label>
            <input
              type="text"
              required
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Concepto / Notas
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={<Send className="w-4 h-4" />}>
              Confirmar Transferencia Bancaria
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
};
