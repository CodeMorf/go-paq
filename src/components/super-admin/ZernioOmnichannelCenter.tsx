import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  MessageSquare, 
  PhoneCall, 
  Bot, 
  Terminal, 
  Radio, 
  Send, 
  Sparkles, 
  CheckCheck, 
  Check, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  Volume2, 
  Copy, 
  AlertCircle, 
  Play, 
  FileText, 
  UserCheck, 
  Sliders, 
  Globe, 
  Zap, 
  Plus, 
  Phone,
  Activity,
  Layers,
  ChevronRight,
  User,
  Paperclip,
  Smile,
  Mic,
  Share2,
  Lock,
  Search,
  ExternalLink,
  Info,
  CheckCircle2,
  XCircle,
  Key,
  Shield,
  Smartphone,
  Eye,
  EyeOff,
  Settings,
  Flame,
  CornerDownRight
} from 'lucide-react';
import { Button, Card, MetricCard, StatusBadge, Modal } from '../ui/DesignSystem';
import { ZernioMessage, MessagingChannelType, SocialOAuthConnection } from '../../types';

export const ZernioOmnichannelCenter: React.FC = () => {
  const { 
    zernioConfig, 
    updateZernioConfig, 
    zernioMessages, 
    sendZernioMessage, 
    zernioCalls, 
    triggerVoiceBotCall, 
    socialConnections,
    toggleSocialOAuth,
    updateSocialOAuthCredentials,
    testSocialOAuthPing,
    pusherConfig, 
    updatePusherConfig, 
    pusherEvents, 
    broadcastPusherEvent,
    shipments,
    addToast,
    formatMoney
  } = useApp();

  const [activeTab, setActiveTab] = useState<'chat' | 'voice_calls' | 'social_oauth' | 'pusher_monitor'>('chat');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<'all' | 'whatsapp' | 'instagram' | 'facebook'>('all');
  const [selectedChatTracking, setSelectedChatTracking] = useState<string>('NX-8924-DO');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showSecretToken, setShowSecretToken] = useState(false);

  // Selected Connection for Editing Credentials Modal
  const [editingConnection, setEditingConnection] = useState<SocialOAuthConnection | null>(null);
  const [tempCredentials, setTempCredentials] = useState<Record<string, string>>({});

  // Voice Call Modal state
  const [isTestCallModalOpen, setIsTestCallModalOpen] = useState(false);
  const [testCallTracking, setTestCallTracking] = useState('NX-8930-DO');

  // Pusher Live Event Simulation
  const [pusherTestChannel, setPusherTestChannel] = useState('presence-fleet-live');
  const [pusherTestEvent, setPusherTestEvent] = useState('custom.announcement');
  const [pusherTestPayload, setPusherTestPayload] = useState('{"message": "Aviso de despacho Ola Mañana activo"}');

  // Quick reply canned templates
  const quickReplies = [
    { label: '🚚 En camino', text: 'Estimado cliente, su conductor asignado va en camino hacia su dirección. Tiempo estimado de arribo: ~20 minutos.' },
    { label: '💵 Recordar COD', text: 'Le recordamos tener disponible el monto exacto de cobro contra entrega (COD) en efectivo para agilizar la recepción.' },
    { label: '📍 Solicitar Ubicación', text: 'Por favor confírmenos si la entrega es en recepción/portería o si requiere que el conductor suba al apartamento/oficina.' },
    { label: '🏢 En Recepción', text: 'El conductor se encuentra actualmente en la entrada del edificio solicitando acceso con su paquete.' }
  ];

  // Conversations Directory
  const conversations = [
    {
      tracking: 'NX-8924-DO',
      name: 'Dra. María Elena Rodríguez',
      channel: 'whatsapp' as MessagingChannelType,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      lastMsg: 'Sí por favor, mi secretaria Maritza tiene el pago COD en efectivo listo.',
      time: '02:18 PM',
      badge: 'COD RD$2,850',
      unread: 0,
      sentiment: 'positive' as const
    },
    {
      tracking: 'GPQ-4491-DO',
      name: 'Laura Castillo (@laurac_boutique)',
      channel: 'instagram' as MessagingChannelType,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      lastMsg: 'Llegará a Santiago mañana a primera hora (09:30 AM).',
      time: '02:06 PM',
      badge: 'Boutique Santiago',
      unread: 1,
      sentiment: 'positive' as const
    },
    {
      tracking: 'NX-8930-DO',
      name: 'Lic. Andrés Brea',
      channel: 'whatsapp' as MessagingChannelType,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      lastMsg: 'Confirmación por llamada telefónica IA completada exitosamente.',
      time: '02:00 PM',
      badge: 'Naco • Torre Empresarial',
      unread: 0,
      sentiment: 'neutral' as const
    },
    {
      tracking: 'NX-8955-DO',
      name: 'Juan Carlos Peña (Facebook Page)',
      channel: 'facebook' as MessagingChannelType,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      lastMsg: 'Tarifa corporativa estimada: RD$ 18,500 para 4 pallets en camión cerrado.',
      time: '01:51 PM',
      badge: 'Cotización Carga Pesada',
      unread: 0,
      sentiment: 'neutral' as const
    }
  ];

  const filteredConversations = conversations.filter((c) => {
    const matchesChannel = selectedChannelFilter === 'all' || c.channel === selectedChannelFilter;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.tracking.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.lastMsg.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const activeShipment = shipments.find((s) => s.trackingNumber === selectedChatTracking) || shipments[0];

  const currentMessages = zernioMessages.filter(
    (m) => m.trackingNumber === selectedChatTracking || (!m.trackingNumber && selectedChatTracking === 'NX-8924-DO')
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const currentConv = conversations.find(c => c.tracking === selectedChatTracking);
    const channel = currentConv?.channel || 'whatsapp';

    sendZernioMessage({
      channel: channel,
      senderRole: 'human_agent',
      senderName: 'Central GoPaq Soporte',
      senderMaskedId: 'GoPaq Central Relay (+1 809 555-7271)',
      recipientMaskedId: `Cliente (${currentConv?.name || 'Destinatario'})`,
      text: messageInput.trim(),
      trackingNumber: selectedChatTracking,
      sentiment: 'positive'
    });

    setMessageInput('');
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast('info', 'Copiado al Portapapeles', text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTriggerTestCall = () => {
    triggerVoiceBotCall(testCallTracking);
    setIsTestCallModalOpen(false);
  };

  const handleEmitPusherTest = () => {
    try {
      const parsed = JSON.parse(pusherTestPayload);
      broadcastPusherEvent(pusherTestChannel, pusherTestEvent, parsed);
      addToast('success', 'Evento Pusher Transmitido', `Canal: ${pusherTestChannel} | Evento: ${pusherTestEvent}`);
    } catch {
      broadcastPusherEvent(pusherTestChannel, pusherTestEvent, { raw: pusherTestPayload });
      addToast('success', 'Evento Pusher Transmitido', `Enviado como payload texto`);
    }
  };

  const handleOpenEditModal = (conn: SocialOAuthConnection) => {
    setEditingConnection(conn);
    setTempCredentials({
      appId: conn.credentials.appId || '',
      accountId: conn.credentials.accountId || '',
      accessToken: conn.credentials.accessToken || '',
      secretKey: conn.credentials.secretKey || '',
      proxyNumber: conn.credentials.proxyNumber || '',
      callbackUrl: conn.credentials.callbackUrl || ''
    });
  };

  const handleSaveCredentials = () => {
    if (!editingConnection) return;
    updateSocialOAuthCredentials(editingConnection.id, {
      credentials: {
        ...editingConnection.credentials,
        ...tempCredentials
      }
    });
    setEditingConnection(null);
  };

  const getChannelBadge = (channel: MessagingChannelType) => {
    switch (channel) {
      case 'whatsapp':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            WhatsApp Cloud
          </span>
        );
      case 'instagram':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-800 dark:bg-pink-950/70 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
            Instagram Direct
          </span>
        );
      case 'facebook':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Facebook Messenger
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            GoPaq Relay
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-xs">
              <MessageSquare className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Centro de Mensajería Omnicanal & IA</span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Meta OAuth & WebSockets Activos
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                WhatsApp Business Cloud, Instagram Direct, Facebook Messenger, Agente de Voz GoPaq AI y Relay Seguro Masked
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            icon={<PhoneCall className="w-4 h-4 text-emerald-500" />}
            onClick={() => setIsTestCallModalOpen(true)}
          >
            Llamada IA de Voz
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={<Key className="w-4 h-4" />}
            onClick={() => setActiveTab('social_oauth')}
          >
            Conexiones & OAuth Global
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Línea Oficial WhatsApp"
          value={zernioConfig.whatsappCloudConfig.businessProxyNumber}
          subtitle="Meta Cloud API • Cuenta Verificada"
          icon={<MessageSquare className="w-5 h-5 text-emerald-600" />}
          accent="emerald"
        />
        <MetricCard
          title="Asistente GoPaq AI"
          value={zernioConfig.aiEngineConfig.autoReplyEnabled ? 'AUTO-PILOT ACTIVO' : 'PAUSADO'}
          subtitle={`${Math.round(zernioConfig.aiEngineConfig.confidenceThreshold * 100)}% umbral de confianza`}
          icon={<Bot className="w-5 h-5 text-indigo-600" />}
          accent="indigo"
        />
        <MetricCard
          title="Confirmaciones de Voz IA"
          value={`${zernioCalls.filter(c => c.status === 'completed').length} Completadas`}
          subtitle="100% éxito en pre-despacho"
          icon={<PhoneCall className="w-5 h-5 text-blue-600" />}
          accent="blue"
        />
        <MetricCard
          title="WebSockets Pusher Live"
          value={pusherConfig.connectionStatus.toUpperCase()}
          subtitle={`${pusherConfig.lastPingMs}ms latencia • ${pusherConfig.activeSocketsCount} sockets`}
          icon={<Radio className="w-5 h-5 text-amber-600" />}
          accent="amber"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'chat'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat Omnicanal en Vivo</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {zernioMessages.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('voice_calls')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'voice_calls'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Llamadas Telefónicas IA (Voice Bot)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white">
            VOICE
          </span>
        </button>

        <button
          onClick={() => setActiveTab('social_oauth')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'social_oauth'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Conexiones Globales & OAuth</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>

        <button
          onClick={() => setActiveTab('pusher_monitor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'pusher_monitor'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Monitor WebSockets & Webhooks</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OMNICHANNEL LIVE CHAT */}
      {/* ========================================================================= */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Conversations Directory */}
          <div className="lg:col-span-4 space-y-3">
            <Card className="p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Conversaciones Activas
                </h3>
                <span className="text-[11px] font-bold text-slate-500 font-mono">
                  {filteredConversations.length} chats
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, guía o texto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Channel Filters */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-[11px] font-bold">
                <button
                  onClick={() => setSelectedChannelFilter('all')}
                  className={`py-1.5 rounded-lg transition-all text-center ${
                    selectedChannelFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setSelectedChannelFilter('whatsapp')}
                  className={`py-1.5 rounded-lg transition-all text-center ${
                    selectedChannelFilter === 'whatsapp'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => setSelectedChannelFilter('instagram')}
                  className={`py-1.5 rounded-lg transition-all text-center ${
                    selectedChannelFilter === 'instagram'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-pink-600'
                  }`}
                >
                  Instagram
                </button>
                <button
                  onClick={() => setSelectedChannelFilter('facebook')}
                  className={`py-1.5 rounded-lg transition-all text-center ${
                    selectedChannelFilter === 'facebook'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-blue-600'
                  }`}
                >
                  Facebook
                </button>
              </div>

              {/* AI Auto-Pilot Switch Banner */}
              <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white block leading-tight">
                      GoPaq AI Asistente
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Respuestas de rastreo en tiempo real
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={zernioConfig.aiEngineConfig.autoReplyEnabled}
                    onChange={(e) =>
                      updateZernioConfig({
                        aiEngineConfig: {
                          ...zernioConfig.aiEngineConfig,
                          autoReplyEnabled: e.target.checked
                        }
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>

              {/* Conversations Feed */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredConversations.map((conv) => {
                  const isSelected = selectedChatTracking === conv.tracking;
                  return (
                    <button
                      key={conv.tracking}
                      onClick={() => setSelectedChatTracking(conv.tracking)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/20 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={conv.avatar}
                            alt={conv.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[8px]">
                            {conv.channel === 'whatsapp' && '🟢'}
                            {conv.channel === 'instagram' && '🟣'}
                            {conv.channel === 'facebook' && '🔵'}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {conv.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {conv.time}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                              {conv.tracking}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {conv.badge}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-1">
                            {conv.lastMsg}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Center Column: Clean Live Chat Stream & Composer */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="p-0 overflow-hidden flex flex-col h-[700px] border border-slate-200 dark:border-slate-800">
              {/* Chat Top Bar */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={conversations.find(c => c.tracking === selectedChatTracking)?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                      alt="Chat Contact"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                        {conversations.find(c => c.tracking === selectedChatTracking)?.name || 'Cliente GoPaq'}
                      </h4>
                      {getChannelBadge(conversations.find(c => c.tracking === selectedChatTracking)?.channel || 'whatsapp')}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>Guía Oficial: <strong className="text-slate-700 dark:text-slate-300">{selectedChatTracking}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3 h-3" /> Relay Enmascarado
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Phone className="w-3.5 h-3.5 text-emerald-500" />}
                    onClick={() => triggerVoiceBotCall(selectedChatTracking)}
                  >
                    Llamar con IA
                  </Button>
                </div>
              </div>

              {/* Guía Summary Bar */}
              <div className="px-4 py-2 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    Destino: <strong className="text-slate-900 dark:text-white">{activeShipment.destination.sector || activeShipment.destination.city}</strong>
                  </span>
                  {activeShipment.codAmount && activeShipment.codAmount > 0 ? (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold font-mono text-[10px]">
                      Cobro COD: {formatMoney(activeShipment.codAmount)}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">Conductor:</span>
                  <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                    {activeShipment.driverName || 'Carlos Méndez'}
                  </span>
                </div>
              </div>

              {/* Chat Stream Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-100/60 dark:bg-slate-950/40">
                {currentMessages.map((msg) => {
                  const isAgent = msg.senderRole === 'human_agent' || msg.senderRole === 'driver';
                  const isAI = msg.senderRole === 'ai_agent';
                  const isCustomer = msg.senderRole === 'customer';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                        {isAI ? (
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <Bot className="w-3 h-3" /> GoPaq AI Asistente
                          </span>
                        ) : (
                          <span className="font-bold text-slate-600 dark:text-slate-400">
                            {msg.senderName}
                          </span>
                        )}
                        <span>•</span>
                        <span className="font-mono">{msg.timestamp}</span>
                      </div>

                      <div
                        className={`max-w-[78%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isCustomer
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-tl-sm'
                            : isAI
                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm shadow-indigo-500/10'
                            : 'bg-slate-800 dark:bg-indigo-900 text-white rounded-tr-sm'
                        }`}
                      >
                        <p>{msg.text}</p>

                        <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] opacity-80">
                          <span>{msg.timestamp}</span>
                          {isCustomer ? null : (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Reply Template Chips */}
              <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0 mr-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" /> Plantillas:
                </span>
                {quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMessageInput(qr.text)}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 shrink-0 transition-colors"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>

              {/* Clean Message Composer */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
              >
                <button
                  type="button"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Adjuntar archivo o imagen de entrega"
                  onClick={() => addToast('info', 'Adjuntar Archivo', 'Selección de fotos de entrega o recibos disponible')}
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder="Escribe un mensaje oficial al cliente (se envía vía canal enmascarado)..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!messageInput.trim()}
                  icon={<Send className="w-4 h-4" />}
                >
                  Enviar
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VOICE CALLS BOT */}
      {/* ========================================================================= */}
      {activeTab === 'voice_calls' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-indigo-600" />
                  <span>Historial de Llamadas Telefónicas Automatizadas (Voice Bot)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Llamadas por voz sintetizada en tiempo real para pre-confirmación de entregas, montos COD y reprogramaciones
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                icon={<Phone className="w-4 h-4" />}
                onClick={() => setIsTestCallModalOpen(true)}
              >
                Disparar Llamada Manual
              </Button>
            </div>

            <div className="space-y-3">
              {zernioCalls.map((call) => (
                <div
                  key={call.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                        <Volume2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {call.calleeMasked}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {call.status.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          Línea Emisora: {call.callerMasked} • Duración: {call.durationSeconds}s • {call.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {call.trackingNumber}
                      </span>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white block mb-1">
                      Resumen Ejecutivo de la IA:
                    </strong>
                    {call.aiSummary}
                  </div>

                  {/* Transcript Preview */}
                  <div className="text-[11px] text-slate-500 font-mono bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl whitespace-pre-line border border-slate-200 dark:border-slate-800">
                    {call.transcript}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GLOBAL AUTH & SOCIAL CONNECTIONS (WhatsApp, Instagram, Facebook, Engine, Pusher) */}
      {/* ========================================================================= */}
      {activeTab === 'social_oauth' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                <span>Conexiones Globales OAuth & Canales de Redes Sociales</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Autenticación centralizada con Meta Graph API (WhatsApp, Instagram Direct, Facebook Messenger), Motor Cloud y Pusher
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={() => addToast('success', 'Tokens Verificados', 'Todas las firmas y llaves OAuth están vigentes.')}
              >
                Refrescar Estados
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {socialConnections.map((conn) => {
              const isWhatsApp = conn.provider === 'whatsapp';
              const isInstagram = conn.provider === 'instagram';
              const isFacebook = conn.provider === 'facebook';
              const isEngine = conn.provider === 'zernio';
              const isPusher = conn.provider === 'pusher';

              return (
                <Card
                  key={conn.id}
                  className="p-5 space-y-4 border border-slate-200 dark:border-slate-800 relative overflow-hidden"
                >
                  {/* Top Provider Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${
                        isWhatsApp ? 'bg-emerald-500 text-white' :
                        isInstagram ? 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white' :
                        isFacebook ? 'bg-blue-600 text-white' :
                        isEngine ? 'bg-indigo-600 text-white' :
                        'bg-amber-500 text-white'
                      }`}>
                        {isWhatsApp && <MessageSquare className="w-6 h-6" />}
                        {isInstagram && <Smartphone className="w-6 h-6" />}
                        {isFacebook && <Share2 className="w-6 h-6" />}
                        {isEngine && <Bot className="w-6 h-6" />}
                        {isPusher && <Radio className="w-6 h-6" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {conn.name}
                          </h4>
                          {conn.connected ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Conectado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Desconectado
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium mt-0.5">
                          {conn.accountIdentifier}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleSocialOAuth(conn.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        conn.connected
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                      }`}
                    >
                      {conn.connected ? 'Desconectar' : 'Conectar OAuth'}
                    </button>
                  </div>

                  {/* Scopes and Status info */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>Estado Webhook:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {conn.webhookStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>Validez del Token:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {conn.tokenExpiresIn || 'Vigente'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Permisos & Scopes Autorizados:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {conn.scopes.map((scope, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>

                    {conn.credentials.callbackUrl && (
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Callback Webhook Endpoint:
                        </span>
                        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                          <span className="truncate flex-1 text-slate-700 dark:text-slate-300">
                            {conn.credentials.callbackUrl}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(conn.credentials.callbackUrl!, conn.id)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600"
                          >
                            {copiedKey === conn.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => testSocialOAuthPing(conn.id)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Activity className="w-3.5 h-3.5" /> Probar Ping Diagnóstico
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(conn)}
                      className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-1"
                    >
                      <Settings className="w-3.5 h-3.5" /> Configurar Credenciales
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WEBSOCKETS & WEBHOOKS MONITOR */}
      {/* ========================================================================= */}
      {activeTab === 'pusher_monitor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Events Stream */}
            <div className="lg:col-span-8 space-y-4">
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Radio className="w-5 h-5 text-indigo-600" />
                    <span>Transmisión en Vivo de WebSockets (Pusher Realtime)</span>
                  </h3>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Listening en 142 conexiones
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[480px] overflow-y-auto">
                  {pusherEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {evt.channel}
                        </span>
                        <span className="text-slate-400">{evt.timestamp}</span>
                      </div>
                      <div className="text-slate-800 dark:text-slate-200 font-bold">
                        Evento: <span className="text-emerald-600 dark:text-emerald-400">{evt.event}</span>
                      </div>
                      <pre className="text-[10px] p-2 rounded bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 overflow-x-auto">
                        {JSON.stringify(evt.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Test Event Broadcaster */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Emitir Evento en Tiempo Real</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Canal Pusher</label>
                    <input
                      type="text"
                      value={pusherTestChannel}
                      onChange={(e) => setPusherTestChannel(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Nombre del Evento</label>
                    <input
                      type="text"
                      value={pusherTestEvent}
                      onChange={(e) => setPusherTestEvent(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Payload JSON</label>
                    <textarea
                      rows={4}
                      value={pusherTestPayload}
                      onChange={(e) => setPusherTestPayload(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    icon={<Send className="w-4 h-4" />}
                    onClick={handleEmitPusherTest}
                  >
                    Transmitir Evento
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIGURAR CREDENCIALES DE CONEXIÓN */}
      {/* ========================================================================= */}
      {editingConnection && (
        <Modal
          isOpen={!!editingConnection}
          onClose={() => setEditingConnection(null)}
          title={`Configuración de Credenciales • ${editingConnection.name}`}
          description="Edite las llaves de acceso, IDs de aplicación y secretos de verificación para este canal."
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                App ID / Client ID
              </label>
              <input
                type="text"
                value={tempCredentials.appId || ''}
                onChange={(e) => setTempCredentials({ ...tempCredentials, appId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono"
                placeholder="109284910294819"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                Account ID / WABA / Page ID
              </label>
              <input
                type="text"
                value={tempCredentials.accountId || ''}
                onChange={(e) => setTempCredentials({ ...tempCredentials, accountId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono"
                placeholder="waba_acc_gopaq_rd"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                Access Token / Llave Secreta
              </label>
              <input
                type="password"
                value={tempCredentials.accessToken || tempCredentials.secretKey || ''}
                onChange={(e) => setTempCredentials({ ...tempCredentials, accessToken: e.target.value, secretKey: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono"
                placeholder="EAAYb7... / secret"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                Callback Webhook URL
              </label>
              <input
                type="text"
                value={tempCredentials.callbackUrl || ''}
                onChange={(e) => setTempCredentials({ ...tempCredentials, callbackUrl: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono"
                placeholder="https://api.gopaq.com.do/api/v1/webhooks/whatsapp"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setEditingConnection(null)}>
                Cancelar
              </Button>
              <Button variant="primary" size="md" onClick={handleSaveCredentials}>
                Guardar Credenciales
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TEST VOICE CALL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isTestCallModalOpen}
        onClose={() => setIsTestCallModalOpen(false)}
        title="Iniciar Llamada de Voz Telefónica con IA"
        description="El agente de voz oficial de GoPaq llamará al destinatario para confirmar entrega y monto COD."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              Seleccionar Guía de Envío a Confirmar
            </label>
            <select
              value={testCallTracking}
              onChange={(e) => setTestCallTracking(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono"
            >
              {shipments.map((s) => (
                <option key={s.id} value={s.trackingNumber}>
                  {s.trackingNumber} • {s.destination.name} ({s.destination.sector || s.destination.city})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1.5">
            <span className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4" /> Línea Oficial Enmascarada
            </span>
            <p className="text-slate-600 dark:text-slate-300">
              La llamada saldrá desde el número de la empresa <strong>+1 (809) 555-7271</strong>. El agente con IA conversará de manera fluida con el cliente y guardará la transcripción en el panel.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="ghost" size="sm" onClick={() => setIsTestCallModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Phone className="w-4 h-4" />}
              onClick={handleTriggerTestCall}
            >
              Llamar Ahora
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
