import { Info } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

const ConstructionNotice = () => {
  const lang = useLang();

  return (
    <div className="bg-secondary border border-border/50 rounded-xl p-5 flex gap-4 items-start">
      <Info className="text-accent shrink-0 mt-0.5" size={20} />
      <div>
        <p className="font-semibold text-foreground text-sm mb-1">
          {lang === "en" ? "Information about ongoing construction" : "Information om pågående bygge"}
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {lang === "en"
            ? "Göta Kanal is currently building a new visitor centre near the glamping site. The view may temporarily be limited by a road, but the work itself does not disturb your stay."
            : "Just nu bygger Göta Kanal ett nytt besökscentrum i närheten av glampingen. Utsikten kan tillfälligt vara begränsad av en väg, men arbetet i sig stör inte din vistelse."}
        </p>
      </div>
    </div>
  );
};

export default ConstructionNotice;
