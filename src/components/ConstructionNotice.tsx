import { Info } from "lucide-react";

const ConstructionNotice = () => {
  return (
    <div className="bg-secondary border border-border/50 rounded-xl p-5 flex gap-4 items-start">
      <Info className="text-accent shrink-0 mt-0.5" size={20} />
      <div>
        <p className="font-semibold text-foreground text-sm mb-1">Information om pågående bygge</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Just nu bygger Göta Kanal ett nytt besökscentrum i närheten av glampingen. Utsikten kan tillfälligt
          vara begränsad av en väg, men arbetet i sig stör inte din vistelse.
        </p>
      </div>
    </div>
  );
};

export default ConstructionNotice;
