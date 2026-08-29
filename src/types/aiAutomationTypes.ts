// Event-Driven AI Automation Engine Types

export type AutomationTriggerEventType =
  | 'driver_approaching_recipient' // Driver < X km from destination
  | 'driver_approaching_sender'    // Driver < X km from pickup/sender
  | 'driver_arrived'               // Driver clicked "Llegué"
  | 'driver_no_response'           // Driver clicked "Cliente no responde"
  | 'driver_needs_reference'       // Driver clicked "Necesito referencia / Dirección difícil"
  | 'approaching_cod_delivery'     // COD shipment & Driver approaching (< X km)
  | 'delivery_failed_absent'       // Driver selected "Cliente ausente" / Failed attempt
  | 'pickup_not_ready'             // Driver clicked "Paquete no está listo"
  | 'route_delayed'                // ETA delay > threshold minutes
  | 'manual_driver_voice_request'; // Driver pressed manual AI voice assistance

export type AutomationActionType =
  | 'call_recipient_voice_ai'
  | 'call_sender_voice_ai'
  | 'send_whatsapp'
  | 'send_sms'
  | 'send_push'
  | 'notify_driver_app'
  | 'notify_branch'
  | 'update_delivery_notes'
  | 'create_incident'
  | 'reschedule_delivery';

export interface RuleCondition {
  distanceKmLessThan?: number;
  isCodDelivery?: boolean;
  minCodAmountDop?: number;
  waitTimeSeconds?: number;
  delayThresholdMinutes?: number;
  packageServiceType?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggerEvent: AutomationTriggerEventType;
  condition: RuleCondition;
  primaryAction: AutomationActionType;
  voiceAiScriptPrompt: string; // The script prompt used ONLY by Voice AI to converse
  fallbackAction?: AutomationActionType;
  fallbackAfterSeconds?: number;
  postActionNotifyDriver: boolean;
  driverNotificationTemplate: string;
  executionCount: number;
  lastExecutedAt?: string;
  category: 'proximity' | 'arrival' | 'incident' | 'cod' | 'delay';
}

export interface AiAutomationExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  triggerEvent: AutomationTriggerEventType;
  trackingNumber: string;
  targetPerson: 'destinatario' | 'remitente' | 'driver';
  personName: string;
  personPhone: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'fallback_triggered' | 'failed' | 'no_answer';
  customerSpeechResponse?: string;
  aiExtractedSummary: string;
  driverNotified: boolean;
  driverMessageDelivered?: string;
  channelUsed: 'voice_ai' | 'whatsapp' | 'sms' | 'push';
  durationSeconds?: number;
  callRecordingTranscript?: string;
  actionTakenResult?: string;
}
