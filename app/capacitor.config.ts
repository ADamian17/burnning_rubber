import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adonismartin.burningrubber',
  appName: 'Burning Rubber',
  webDir: 'dist',
  // matches --ink so there is never a white flash between splash and first frame
  backgroundColor: '#0A0806',
  ios: {
    // the game paints its own safe-area padding; let the webview span the notch
    contentInset: 'never'
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#0A0806',
      launchAutoHide: false,
      showSpinner: false
    }
  }
};

export default config;
