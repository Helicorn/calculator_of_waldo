"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { ddragonChampionSplashUrl } from "@/lib/lolDdragon";

export type LolChampionSkinsGallerySkin = {
  id: number;
  num: number;
  name: string;
};

type LolChampionSkinsGalleryProps = {
  championId: string;
  championName: string;
  skins: LolChampionSkinsGallerySkin[];
};

function skinDisplayName(name: string): string {
  return name === "default" ? "기본" : name;
}

export function LolChampionSkinsGallery({
  championId,
  championName,
  skins,
}: LolChampionSkinsGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close]);

  useEffect(() => {
    if (openIndex === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openIndex]);

  const openSkin = openIndex !== null ? skins[openIndex] : null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        스플래시 아트 ({skins.length}종, 크로마 제외){" "}
        <span className="text-xs text-neutral-400 dark:text-neutral-500">
          — 썸네일을 누르면 크게 볼 수 있습니다.
        </span>
      </p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skins.map((skin, index) => (
          <li
            key={skin.id}
            className="flex flex-col gap-1 overflow-hidden rounded-lg border border-black/[.08] dark:border-white/[.12]"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group relative block w-full cursor-zoom-in overflow-hidden rounded-t-lg border-0 bg-transparent p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
              aria-label={`${championName} ${skinDisplayName(skin.name)} 스플래시 크게 보기`}
            >
              <div className="relative aspect-[1215/717] w-full bg-neutral-100 dark:bg-neutral-900">
                <Image
                  src={ddragonChampionSplashUrl(championId, skin.num)}
                  alt=""
                  fill
                  className="object-cover object-top transition-transform duration-200 group-hover:scale-[1.02]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            </button>
            <p className="px-2 py-1.5 text-xs text-neutral-600 dark:text-neutral-400">
              {skinDisplayName(skin.name)}
            </p>
          </li>
        ))}
      </ul>

      {openSkin !== null && openIndex !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="skin-lightbox-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-[2px]"
            aria-label="배경을 눌러 닫기"
            onClick={close}
          />
          <div className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-[min(96vw,1400px)] flex-col gap-3">
            <div className="flex items-center justify-between gap-3 text-sm text-neutral-100">
              <p id="skin-lightbox-title" className="min-w-0 truncate font-medium">
                {championName} — {skinDisplayName(openSkin.name)}
              </p>
              <button
                type="button"
                onClick={close}
                className="shrink-0 rounded-md border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
              >
                닫기
              </button>
            </div>
            <div className="relative min-h-0 w-full flex-1 overflow-auto rounded-lg border border-white/15 bg-black/40 shadow-2xl">
              <div className="relative mx-auto flex max-h-[min(80vh,820px)] w-full items-center justify-center p-1 sm:p-2">
                <Image
                  src={ddragonChampionSplashUrl(championId, openSkin.num)}
                  alt={`${championName} ${skinDisplayName(openSkin.name)} 스플래시`}
                  width={1215}
                  height={717}
                  className="h-auto max-h-[min(80vh,820px)] w-auto max-w-full object-contain"
                  sizes="(max-width: 1400px) 96vw, 1400px"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
