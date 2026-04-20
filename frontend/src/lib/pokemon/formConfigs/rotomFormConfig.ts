export type RotomFormKey = "base" | "heat" | "wash" | "frost" | "fan" | "mow";

export const ROTOM_FORM_OPTIONS: Array<{
  key: RotomFormKey;
  label: string;
  types: string[];
}> = [
  { key: "base", label: "기본", types: ["electric", "ghost"] },
  { key: "heat", label: "히트", types: ["electric", "fire"] },
  { key: "wash", label: "워시", types: ["electric", "water"] },
  { key: "frost", label: "프로스트", types: ["electric", "ice"] },
  { key: "fan", label: "스핀", types: ["electric", "flying"] },
  { key: "mow", label: "커트", types: ["electric", "grass"] },
];

export function isRotomName(name: string): boolean {
  const n = name.trim();
  return n === "로토무" || n.startsWith("로토무(");
}

export function getRotomFormTypes(form: RotomFormKey): string[] {
  return ROTOM_FORM_OPTIONS.find((f) => f.key === form)?.types ?? ["electric", "ghost"];
}
