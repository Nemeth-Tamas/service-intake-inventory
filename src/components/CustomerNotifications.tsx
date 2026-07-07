'use client';

import { useState, useEffect } from 'react';
import { Mail, MessageSquare, Copy, Check, ChevronDown } from 'lucide-react';
import { sendNotificationEmailAction, sendNotificationSMSAction, getSMSBalanceAction } from '@/lib/actions';
import { NOTIFICATION_TEMPLATES, compileTemplate } from '@/lib/notificationTemplates';

interface Props {
  workOrder: {
    id: string;
    customerName: string | null;
    customerContact: string | null;
    deviceType: string | null;
  };
  settings: {
    baseUrl: string;
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUser: string | null;
    smtpPass: string | null;
    smsApiUrl: string | null;
    smsApiKey: string | null;
    smsSender: string | null;
    workshopName: string;
  };
  smsGateways?: {
    id: string;
    name: string;
    smsApiUrl: string;
    smsApiKey: string;
    smsSender: string | null;
  }[];
}

export default function CustomerNotifications({ workOrder, settings, smsGateways = [] }: Props) {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<keyof typeof NOTIFICATION_TEMPLATES>('intake');
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingSMS, setSendingSMS] = useState(false);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [showSMSDropdown, setShowSMSDropdown] = useState(false);
  const [smsBalance, setSmsBalance] = useState<{ balance: number | string; currency: string; isLow: boolean } | null>(null);

  const contactText = workOrder.customerContact || '';
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(?:\+?)[0-9\s-]{7,15}/;

  const hasEmail = emailRegex.test(contactText);
  const hasPhone = phoneRegex.test(contactText);

  const isEmailConfigured = !!(settings.smtpHost && settings.smtpPort && settings.smtpUser && settings.smtpPass);
  const isSMSConfigured = !!settings.smsApiUrl;

  useEffect(() => {
    if (isSMSConfigured) {
      const fetchBalance = async () => {
        try {
          const res = await getSMSBalanceAction();
          if (res && res.success) {
            setSmsBalance({
              balance: res.balance!,
              currency: res.currency!,
              isLow: res.isLow!
            });
          }
        } catch (err) {
          console.error('Failed to load SMS balance:', err);
        }
      };
      fetchBalance();
    }
  }, [isSMSConfigured]);

  const template = NOTIFICATION_TEMPLATES[selectedTemplateKey];
  const compiledText = compileTemplate(template.text, workOrder, settings);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(compiledText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await sendNotificationEmailAction(workOrder.id, selectedTemplateKey);
      if (res && !res.success) {
        alert(res.error || 'Sikertelen email küldés.');
      } else {
        alert('Email értesítés sikeresen elküldve!');
      }
    } catch (err: any) {
      alert(err.message || 'Sikertelen email küldés.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendSMS = async (gatewayId?: string) => {
    setSendingSMS(true);
    try {
      const res = await sendNotificationSMSAction(workOrder.id, selectedTemplateKey, gatewayId);
      if (res && !res.success) {
        alert(res.error || 'Sikertelen SMS küldés.');
      } else {
        alert('SMS értesítés sikeresen elküldve!');
        // Refresh balance
        try {
          const balanceRes = await getSMSBalanceAction();
          if (balanceRes && balanceRes.success) {
            setSmsBalance({
              balance: balanceRes.balance!,
              currency: balanceRes.currency!,
              isLow: balanceRes.isLow!
            });
          }
        } catch (err) {
          console.error('Failed to refresh SMS balance:', err);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Sikertelen SMS küldés.');
    } finally {
      setSendingSMS(false);
    }
  };

  if (!hasEmail && !hasPhone) return null;

  return (
    <section className="bg-white border p-6 rounded-2xl shadow-sm space-y-4">
      <h2 className="flex items-center gap-2 font-bold text-lg text-gray-800 border-b pb-3">
        <Mail size={20} className="text-blue-500" /> Ügyfél Értesítés
      </h2>

      {/* Template selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sablon Kiválasztása</label>
        <select
          value={selectedTemplateKey}
          onChange={(e) => setSelectedTemplateKey(e.target.value as any)}
          className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 font-medium text-gray-700"
        >
          {Object.entries(NOTIFICATION_TEMPLATES).map(([key, value]) => (
            <option key={key} value={key}>{value.title}</option>
          ))}
        </select>
      </div>

      {/* Message Preview */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Üzenet Előnézet</label>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition"
          >
            {copied ? <><Check size={12} /> Másolva!</> : <><Copy size={12} /> Másolás</>}
          </button>
        </div>
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 leading-relaxed font-medium whitespace-pre-wrap select-text">
          {compiledText}
        </div>
      </div>

      {/* Notification Actions */}
      <div className="flex flex-col gap-2.5 pt-2">
        {/* Email action */}
        {hasEmail && (
          <div className="relative flex w-full">
            {isEmailConfigured ? (
              <>
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-l-xl font-bold text-sm transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Mail size={16} /> {sendingEmail ? 'Küldés...' : 'Email Küldése'}
                </button>
                <button
                  onClick={() => setShowEmailDropdown(!showEmailDropdown)}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-3.5 rounded-r-xl transition border-l border-blue-500 flex items-center justify-center cursor-pointer"
                >
                  <ChevronDown size={16} />
                </button>
                {showEmailDropdown && (
                  <div className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                    <button
                      onClick={() => {
                        setShowEmailDropdown(false);
                        handleCopy();
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer border-0 bg-transparent"
                    >
                      <Copy size={14} /> Sablon másolása
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 rounded-xl font-bold text-sm transition border border-blue-100 shadow-sm cursor-pointer"
              >
                <Mail size={16} /> Email sablon másolása
              </button>
            )}
          </div>
        )}

        {/* SMS action */}
        {hasPhone && (
          <div className="space-y-1.5 w-full">
            <div className="relative flex w-full">
              {(isSMSConfigured || smsGateways.length > 0) ? (
                <>
                  <button
                    onClick={() => isSMSConfigured && handleSendSMS()}
                    disabled={sendingSMS || !isSMSConfigured}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-l-xl font-bold text-sm transition shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <MessageSquare size={16} /> {sendingSMS ? 'Küldés...' : (isSMSConfigured ? 'SMS Küldése' : 'Válassz átjárót')}
                  </button>
                  <button
                    onClick={() => setShowSMSDropdown(!showSMSDropdown)}
                    disabled={sendingSMS}
                    className="bg-purple-700 hover:bg-purple-800 text-white px-3.5 rounded-r-xl transition border-l border-purple-500 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    <ChevronDown size={16} />
                  </button>
                  {showSMSDropdown && (
                    <div className="absolute right-0 bottom-full mb-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-gray-100">
                      <button
                        onClick={() => {
                          setShowSMSDropdown(false);
                          handleCopy();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer border-0 bg-transparent"
                      >
                        <Copy size={14} /> Sablon másolása
                      </button>

                      {smsGateways.map((gw) => (
                        <button
                          key={gw.id}
                          onClick={() => {
                            setShowSMSDropdown(false);
                            handleSendSMS(gw.id);
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-purple-50 flex items-center gap-2 cursor-pointer border-0 bg-transparent"
                        >
                          <MessageSquare size={14} className="text-purple-500" /> Küldés: {gw.name}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 rounded-xl font-bold text-sm transition border border-purple-100 shadow-sm cursor-pointer"
                >
                  <MessageSquare size={16} /> SMS sablon másolása
                </button>
              )}
            </div>
            {isSMSConfigured && smsBalance && (
              <div className="flex justify-between items-center px-1 text-xs text-gray-500">
                <span>SMS egyenleg/státusz:</span>
                {smsBalance.isLow ? (
                  <span className="text-rose-600 font-extrabold animate-pulse bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                    ⚠️ {typeof smsBalance.balance === 'number' ? `Alacsony: ${smsBalance.balance} ${smsBalance.currency}` : smsBalance.balance}
                  </span>
                ) : (
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {smsBalance.balance} {smsBalance.currency}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
