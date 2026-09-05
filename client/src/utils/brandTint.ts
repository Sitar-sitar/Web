/** ブランドごとのバッジ配色。全ブランドの網羅性はテストで担保する。 */
import type { Rubber } from "@/lib/rubberData";

export const brandTint: Record<Rubber["brand"], string> = {
  Butterfly: "bg-[#fff0ec] text-[#a53d30]",
  Nittaku: "bg-[#fceded] text-[#a63d3d]",
  VICTAS: "bg-[#edf4ff] text-[#28588f]",
  Yasaka: "bg-[#eff9fb] text-[#26718a]",
  TIBHAR: "bg-[#eef8f2] text-[#2e7554]",
  XIOM: "bg-[#fff6e8] text-[#805b20]",
  STIGA: "bg-[#edf4ff] text-[#245aaa]",
  DONIC: "bg-[#eef2ff] text-[#2e4d94]",
  andro: "bg-[#f6efff] text-[#704b9e]",
  JOOLA: "bg-[#f2f4e9] text-[#4f6428]",
  JUIC: "bg-[#fff4df] text-[#8a5a18]",
};
