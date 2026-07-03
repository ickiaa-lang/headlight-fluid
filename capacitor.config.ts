import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hlfe.escapepod',
  appName: 'HLF Escape Pod',
  webDir: 'www',
  android: {
    // Landscape space-survival game — lock orientation at the Android level too.
    // (Also set in AndroidManifest.xml after `cap add android`, see README.)
  },
  server: {
    androidScheme: 'https'
  },
  plugins: {
    // Add plugin configs here as needed.
  }
};

export default config;
