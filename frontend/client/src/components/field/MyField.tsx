import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import MapView from "./MapView";

export function MyField() {
  const { t } = useTranslation();
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedIrrigation, setSelectedIrrigation] = useState("");
  const [selectedSoil, setSelectedSoil] = useState("");

  const crops = [
    { value: "rice", label: "Rice / चावल / ଚାଉଳ / চাল / ਚੌਲ / బియ్యం" },
    { value: "wheat", label: "Wheat / गेहूँ / ଗହମ / গম / ਕਣਕ / గోధుమ" },
    { value: "maize", label: "Maize / मक्का / ମକା / ভুট্টা / ਮੱਕੀ / మొక్కజొన్న" },
    { value: "sugarcane", label: "Sugarcane / गन्ना / ଆଖୁ / আখ / ਗੰਨਾ / చెరకు" },
    { value: "cotton", label: "Cotton / कपास / କପା / তুলা / ਕਪਾਹ / పత్తి" },
    { value: "soybean", label: "Soybean / सोयाबीन / ସୋୟାବିନ / সয়াবিন / ਸੋਇਆਬੀਨ / సోయాబీన్" },
    { value: "groundnut", label: "Groundnut / मूँगफली / ବାଦାମ / চীনাবাদাম / ਮੂੰਗਫਲੀ / వేరుశెనగ" },
    { value: "mustard", label: "Mustard / सरसों / ସୋରିଷ / সরিষা / ਸਰ੍ਹੋਂ / ఆవాలు" },
    { value: "potato", label: "Potato / आलू / ଆଳୁ / আলু / ਆਲੂ / బంగాళదుంప" },
    { value: "tomato", label: "Tomato / टमाटर / ଟମାଟୋ / টমেটো / ਟਮਾਟਰ / టొమాటో" },
    { value: "onion", label: "Onion / प्याज / ପିଆଜ / পেঁয়াজ / ਪਿਆਜ਼ / ఉల్లిపాయ" },
    { value: "banana", label: "Banana / केला / କଦଳୀ / কলা / ਕੇਲਾ / అరటి" },
    { value: "coconut", label: "Coconut / नारियल / ନଡ଼ିଆ / নারকেল / ਨਾਰੀਅਲ / కొబ్బరి" },
    { value: "tea", label: "Tea / चाय / ଚା / চা / ਚਾਹ / తేయాకు" },
    { value: "coffee", label: "Coffee / कॉफ़ी / କଫି / কফি / ਕੌਫੀ / కాఫీ" },
    { value: "turmeric", label: "Turmeric / हल्दी / ହଳଦୀ / হলুদ / ਹਲਦੀ / పసుపు" },
    { value: "ginger", label: "Ginger / अदरक / ଅଦା / আদা / ਅਦਰਕ / అల్లం" },
    { value: "black_pepper", label: "Black Pepper / काली मिर्च / ଗୋଲମରିଚ / গোলমরিচ / ਕਾਲੀ ਮਿਰਚ / మిరియాలు" },
  ];

  const soilTypes = [
    { value: "loamy", label: "Loamy / दोमट / ଦୋରସା / দোয়াঁশ / ਦੋਮਟ / గరప" },
    { value: "clay", label: "Clay / चिकनी मिट्टी / ଚିକ୍ମାଟି / এঁটেল / ਚਿਕਨੀ ਮਿੱਟੀ / బంకమట్టి" },
    { value: "sandy", label: "Sandy / रेतीली / ବାଲୁକା / বেলে / ਰੇਤਲੀ / ఇసుక" },
    { value: "laterite", label: "Laterite / लैटेराइट / ଲାଟେରାଇଟ / ল্যাটেরাইট / ਲੈਟੇਰਾਈਟ / లాటరైట్" },
    { value: "alluvial", label: "Alluvial / जलोढ़ / ପଟୁ / পলিমাটি / ਜਲੋਢ / ఒండ్రుమట్టి" },
    { value: "black", label: "Black Soil / काली मिट्टी / କଳାମାଟି / কালো মাটি / ਕਾਲੀ ਮਿੱਟੀ / నల్లరేగడి" },
    { value: "red", label: "Red Soil / लाल मिट्टी / ଲାଲ ମାଟି / লাল মাটি / ਲਾਲ ਮਿੱਟੀ / ఎర్రమట్టి" },
  ];

  const irrigationTypes = [
    { value: "drip", label: "Drip / ड्रिप / ଡ୍ରିପ / ড্রিপ / ਡ੍ਰਿਪ / బిందు" },
    { value: "sprinkler", label: "Sprinkler / स्प्रिंकलर / ସ୍ପ୍ରିଙ୍କଲର / স্প্রিংকলার / ਸਪ੍ਰਿੰਕਲਰ / తుంపర" },
    { value: "flood", label: "Flood / बाढ़ / ବନ୍ୟା / বন্যা / ਹੜ੍ਹ / వరద" },
    { value: "canal", label: "Canal / नहर / ନହର / খাল / ਨਹਿਰ / కాలువ" },
    { value: "tubewell", label: "Tubewell / ट्यूबवेल / ନଳକୂପ / টিউবওয়েল / ਟਿਊਬਵੈੱਲ / బోరుబావి" },
    { value: "rainfed", label: "Rainfed / वर्षा सिंचित / ବର୍ଷାଧାର / বৃষ্টিনির্ভর / ਮੀਂਹ ਆਧਾਰਿਤ / వర్షాధారం" },
    { value: "manual", label: "Manual / हस्तचालित / ହସ୍ତଚାଳିତ / হস্তচালিত / ਹੱਥੀ / చేతి" },
  ];

  return (
    <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-0 h-auto lg:h-[calc(100vh-8rem)] xl:h-[calc(100vh-9rem)] lg:rounded-[1.5rem] lg:overflow-hidden lg:border lg:border-border/40 shadow-sm relative">
      {/* ─── Map Area (takes majority of space) ─── */}
      <div className="w-full h-[65vh] lg:h-full lg:flex-1 shrink-0 flex flex-col bg-card/60 rounded-2xl lg:rounded-none overflow-y-auto overflow-x-hidden border border-border/40 lg:border-0 relative">
        <MapView
          cropType={selectedCrop}
          soilType={selectedSoil}
          irrigationType={selectedIrrigation}
        />
      </div>

      {/* ─── Control Panel (right side on desktop, bottom on mobile) ─── */}
      <aside className="w-full lg:w-[320px] xl:w-[360px] shrink-0 bg-card/80 backdrop-blur-sm lg:overflow-y-auto rounded-2xl lg:rounded-none border border-border/40 lg:border-0 lg:border-l lg:border-border/40 pb-6 lg:pb-0">
        <div className="p-4 lg:p-6 space-y-5 lg:space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="inline-flex items-center justify-center size-8 rounded-lg bg-emerald-500/15">
                <span className="material-symbols-outlined text-lg text-emerald-500">landscape</span>
              </span>
              {t("my_field")}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Draw your field boundary on the map. Select crop details below for accurate analysis.
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/50" />

          {/* Selectable Options */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("crop_type")}
              </label>
              <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                <SelectTrigger data-testid="select-crop-type" className="bg-background/60 h-10 border-border/50 hover:border-border transition-colors">
                  <SelectValue placeholder={t("select_crop")} />
                </SelectTrigger>
                <SelectContent>
                  {crops.map((crop) => (
                    <SelectItem key={crop.value} value={crop.value}>{crop.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("soil_type")}
              </label>
              <Select value={selectedSoil} onValueChange={setSelectedSoil}>
                <SelectTrigger data-testid="select-soil-type" className="bg-background/60 h-10 border-border/50 hover:border-border transition-colors">
                  <SelectValue placeholder={t("soil_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {soilTypes.map((soil) => (
                    <SelectItem key={soil.value} value={soil.value}>{soil.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("irrigation_type")}
              </label>
              <Select value={selectedIrrigation} onValueChange={setSelectedIrrigation}>
                <SelectTrigger data-testid="select-irrigation-type" className="bg-background/60 h-10 border-border/50 hover:border-border transition-colors">
                  <SelectValue placeholder={t("irrigation_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {irrigationTypes.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tips section */}
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">tips_and_updates</span>
              Quick Tips
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>
                Click <strong>Start</strong> then tap points on the map
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>
                Need 3+ points to form a boundary
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>
                Click <strong>Finish</strong> to close the polygon
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">•</span>
                Use <strong>📍 My Location</strong> to center the map
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}
