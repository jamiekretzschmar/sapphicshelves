import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sapphicshelves.app',
  appName: 'SapphicShelves',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;