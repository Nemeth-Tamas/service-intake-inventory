import { getSettings, getStorageUsage } from '@/lib/actions';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [settings, storage] = await Promise.all([
    getSettings(),
    getStorageUsage()
  ]);

  return <SettingsClient settings={settings} storage={storage} />;
}
