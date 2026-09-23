import { Smartphone } from "lucide-react";

const APK_URL = "https://expo.dev/artifacts/eas/Lxi7UM4W6nSvzCXVPb4MprBbmFzRHbw94J8VnDSmqqo.apk";

/** Direct Android APK download shortcut. */
const AppDownloadFab = () => (
  <a
    href={APK_URL}
    download="AgriSense.apk"
    aria-label="Download the AgriSense Android app"
    title="Download the AgriSense Android app"
    className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#2C6E49] text-white shadow-md transition-all hover:bg-[#245a3c] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C6E49] focus-visible:ring-offset-2"
  >
    <Smartphone className="h-5 w-5" aria-hidden="true" />
  </a>
);

export default AppDownloadFab;
