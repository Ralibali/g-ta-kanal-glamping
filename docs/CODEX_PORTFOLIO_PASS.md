# Visa bokningens faktiska laddningsstatus och återförsök

6 september 2026. Utvecklingsförslag; inte publicerat.

Bokningsrutan slutade visa laddning efter 600 ms oavsett om Sirvoy hade laddats. Den väntar nu på Sirvoys dokumenterade callback för en visad bokningssida. Vid långsam eller misslyckad laddning finns ett återförsök och befintlig telefonkontakt. Statusmeddelandena ligger utanför Sirvoys DOM så att React inte tar bort formuläret. Språk följer svenska, engelska eller tyska.

Verifiering: 46 tester i 7 filer, typkontroll och produktionsbygge passerar. Ändrade filer passerar ESLint. Full lint har 239 befintliga fel i andra filer; dessa kontroller har inte stängts av. Testerna täcker fördröjd callback, StrictMode, återförsök, timeout och sen återhämtning.

Lokalt webbläsarprov verifierar timeout, telefonlänk och återförsök. Sirvoys egen inläsning gav Failed to fetch från localhost; lyckad extern laddning och bokning behöver därför verifieras på en tillåten previewdomän före publicering. Inga bokningar eller betalningar utförda. Befintlig Sirvoy-integration och form-id behålls.

Källa för callback-kontrakt: [Sirvoys dokumentation](https://help.sirvoy.com/tracking/controlling-the-triggering-of-third-party-tracking-in-the-booking-engine-and-the-review-booking-form).

