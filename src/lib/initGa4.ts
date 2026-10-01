import { initGa4 } from './ga4Runtime';
initGa4({
  "measurementId": "G-408J0E1ESF",
  "hosts": [
    "goglampingsweden.se",
    "www.goglampingsweden.se"
  ],
  "excluded": [
    "/admin",
    "/stad",
    "/cleaning",
    "/frukost",
    "/breakfast",
    "/jobb",
    "/chat",
    "/stay",
    "/en/stay",
    "/de/stay",
    "/s",
    "/check-in",
    "/checked-in",
    "/unsubscribe", "/checkin", "/checka-in", "/en/checkin", "/de/checkin", "/incheckad", "/en/checked-in", "/de/eingecheckt"
  ],
  "consentKey": "glamping_ga4_consent_v2"
});
