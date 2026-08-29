import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { ClientProfile } from '../../../types';
import {
  Building2,
  X,
  Plus,
  CreditCard,
  Percent,
  Banknote,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Button } from '../../ui/DesignSystem';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose }) => {
  const { addClient, addToast } = useApp();

  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    rncOrDni: '',
    clientType: 'corporate' as ClientProfile['clientType'],
    email: '',
    phone: '',
    lockerCode: `GP-${Math.floor(10000 + Math.random() * 90000)}`,
    accountExecutive: 'Lic. Laura Benítez',
    creditLimitDop: 100000,
    creditDays: 30,
    ncfType: 'B01' as 'B01' | 'B02' | 'B14' | 'B15',
    discountRatePercent: 10,
    street: '',
    sector: '',
    city: 'Santo Domingo',
    province: 'Distrito Nacional',
    bankName: 'Banco Popular Dominicano',
    accountType: 'corriente' as 'corriente' | 'ahorros',
    accountNumber: '',
    holderName: '',
    freePickups: true
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name && !formData.companyName) {
      addToast('error', 'Campos Requeridos', 'Por favor ingrese el nombre del contacto o la empresa.');
      return;
    }

    const newClient: ClientProfile = {
      id: `cli-${Date.now().toString().slice(-4)}`,
      name: formData.name || formData.companyName,
      companyName: formData.companyName,
      rncOrDni: formData.rncOrDni,
      clientType: formData.clientType,
      status: 'active',
      email: formData.email,
      phone: formData.phone,
      lockerCode: formData.lockerCode,
      accountExecutive: formData.accountExecutive,
      activeShipments: 0,
      balanceDop: 0,
      creditLimitDop: Number(formData.creditLimitDop) || 0,
      creditUsedDop: 0,
      creditDays: Number(formData.creditDays) || 30,
      ncfType: formData.ncfType,
      codPendingPayoutDop: 0,
      discountRatePercent: Number(formData.discountRatePercent) || 0,
      addressesCount: 1,
      registeredDate: new Date().toISOString().split('T')[0],
      bankInfo: formData.accountNumber
        ? {
            bankName: formData.bankName,
            accountType: formData.accountType,
            accountNumber: formData.accountNumber,
            holderName: formData.holderName || formData.companyName || formData.name,
            rnc: formData.rncOrDni
          }
        : undefined,
      apiKey: {
        liveKey: `gpq_live_${Math.random().toString(36).substring(2, 14)}${Date.now().toString(36)}`,
        testKey: `gpq_test_${Math.random().toString(36).substring(2, 14)}${Date.now().toString(36)}`,
        createdAt: new Date().toISOString().split('T')[0],
        isRevoked: false
      },
      webhookUrl: '',
      customRates: {
        baseUrbanDiscount: Number(formData.discountRatePercent) || 0,
        baseInterprovincialDiscount: Number(formData.discountRatePercent) || 0,
        freePickups: formData.freePickups
      },
      billingAddress: formData.street
        ? {
            street: formData.street,
            sector: formData.sector,
            city: formData.city,
            province: formData.province
          }
        : undefined,
      branchesList: [
        {
          id: `br-${Date.now()}`,
          name: 'Sede Principal Registrada',
          contactPerson: formData.name,
          phone: formData.phone,
          address: formData.street || 'Dirección de facturación',
          sector: formData.sector || 'Distrito',
          city: formData.city || 'Santo Domingo',
          isPrimary: true
        }
      ],
      invoices: [],
      codPayoutsHistory: []
    };

    addClient(newClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Registrar Nuevo Cliente / Cuenta Corporativa B2B</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configuración de RNC fiscal, línea de crédito comercial, tarifas negociadas y cuenta COD
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Section 1: General & Fiscal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              1. Identidad Corporativa & Fiscal
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Razón Social / Empresa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Distribuidora Nacional SRL"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Persona de Contacto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lic. Carlos Gómez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  RNC o Cédula Fiscal Dominicana
                </label>
                <input
                  type="text"
                  placeholder="Ej: 131-09482-1"
                  value={formData.rncOrDni}
                  onChange={(e) => setFormData({ ...formData, rncOrDni: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Tipo de Cuenta
                </label>
                <select
                  value={formData.clientType}
                  onChange={(e) => setFormData({ ...formData, clientType: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                >
                  <option value="enterprise">Enterprise (Grandes Corporaciones & Zonas Francas)</option>
                  <option value="corporate">Corporativo (Pymes y Empresas)</option>
                  <option value="ecommerce">E-commerce / Tienda Online (Alto Volumen COD)</option>
                  <option value="individual">Persona Individual (Casillero)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Email Corporativo
                </label>
                <input
                  type="email"
                  required
                  placeholder="logistica@empresa.com.do"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Teléfono Directo / WhatsApp
                </label>
                <input
                  type="text"
                  required
                  placeholder="+1 (809) 555-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Credit & Commercial Terms */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              2. Línea de Crédito & Facturación Fiscal (NCF)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Límite de Crédito (RD$)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={formData.creditLimitDop}
                  onChange={(e) => setFormData({ ...formData, creditLimitDop: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Plazo de Crédito
                </label>
                <select
                  value={formData.creditDays}
                  onChange={(e) => setFormData({ ...formData, creditDays: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value={15}>15 Días (Quincenal)</option>
                  <option value={30}>30 Días (Mensual)</option>
                  <option value={45}>45 Días</option>
                  <option value={60}>60 Días (Enterprise)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Tipo de NCF Predeterminado
                </label>
                <select
                  value={formData.ncfType}
                  onChange={(e) => setFormData({ ...formData, ncfType: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="B01">Crédito Fiscal (B01 / E31)</option>
                  <option value="B02">Consumidor Final (B02)</option>
                  <option value="B14">Régimen Especial / ZF (B14)</option>
                  <option value="B15">Gubernamental (B15)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Descuento Comercial Acordado (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.discountRatePercent}
                  onChange={(e) => setFormData({ ...formData, discountRatePercent: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Ejecutivo de Cuenta Asignado
                </label>
                <input
                  type="text"
                  value={formData.accountExecutive}
                  onChange={(e) => setFormData({ ...formData, accountExecutive: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={formData.freePickups}
                    onChange={(e) => setFormData({ ...formData, freePickups: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>Recogidas B2B Gratuitas</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Bank Details for COD */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5" />
              3. Datos Bancarios para Desembolso COD (Contra Entrega)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Entidad Bancaria
                </label>
                <select
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="Banco Popular Dominicano">Banco Popular Dominicano</option>
                  <option value="Banco BHD">Banco BHD</option>
                  <option value="Banreservas">Banreservas</option>
                  <option value="Banco Santa Cruz">Banco Santa Cruz</option>
                  <option value="Scotiabank República Dominicana">Scotiabank RD</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Tipo de Cuenta
                </label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="corriente">Cuenta Corriente</option>
                  <option value="ahorros">Cuenta de Ahorros</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Número de Cuenta
                </label>
                <input
                  type="text"
                  placeholder="Ej: 7920194821"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Address */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              4. Dirección de Facturación & Sede Principal
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Calle, Número, Edificio o Suite
                </label>
                <input
                  type="text"
                  placeholder="Av. Winston Churchill #1099, Torre Acrópolis Piso 14"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Sector
                </label>
                <input
                  type="text"
                  placeholder="Piantini, Naco, Bella Vista..."
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Ciudad & Provincia
                </label>
                <input
                  type="text"
                  value={`${formData.city}, ${formData.province}`}
                  onChange={(e) => {
                    const parts = e.target.value.split(',');
                    setFormData({ ...formData, city: parts[0]?.trim() || '', province: parts[1]?.trim() || '' });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={<Plus className="w-4 h-4" />}>
              Crear Cuenta Corporativa
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
};
