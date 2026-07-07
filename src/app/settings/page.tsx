import { getSettings, getStorageUsage, getSmsGateways } from '@/lib/actions';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [settings, storage, smsGateways] = await Promise.all([
    getSettings(),
    getStorageUsage(),
    getSmsGateways()
  ]);

  return <SettingsClient settings={settings} storage={storage} smsGateways={smsGateways} />;
}
