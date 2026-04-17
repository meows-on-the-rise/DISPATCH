import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.dispatch.ride",
  appName: "Dispatch",
  webDir: "dist",
  server: {
    // Remove this block when building for production
    // url: "http://192.168.x.x:5173", // your dev machine IP for live reload
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0d1b3e",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  android: {
    buildOptions: {
      keystorePath: "dispatch.keystore",
      keystoreAlias: "dispatch",
    },
  },
};

export default config;
