"use client";

import { useCallback, useEffect, useState } from "react";

export type OverwatchGameIconSpriteFrame = "start" | "end";

type OverwatchGameIconProps = {
  src: string;
  alt?: string;
  size?: number;
  /**
   * 가로 2프레임 스프라이트(탭 아이콘)일 때 한 칸만 표시. 박스는 항상 size×size 정사각.
   */
  spriteFrame?: OverwatchGameIconSpriteFrame;
};

const WIDE_ASPECT = 1.15;
const SPRITE_FRAME_COUNT = 2;

/**
 * Blizzard CDN 아이콘 — 정사각 박스 안에 표시.
 * 가로 스프라이트는 background-position으로 좌/우 프레임만 보여 줌.
 */
export function OverwatchGameIcon({
  src,
  alt = "",
  size = 56,
  spriteFrame = "start",
}: OverwatchGameIconProps) {
  const [wide, setWide] = useState<boolean | null>(null);

  useEffect(() => {
    setWide(null);
  }, [src, spriteFrame]);

  const onMeasure = useCallback((img: HTMLImageElement) => {
    setWide(img.naturalWidth / img.naturalHeight > WIDE_ASPECT);
  }, []);

  const boxClass =
    "relative shrink-0 overflow-hidden rounded-md bg-neutral-800 dark:bg-neutral-700";

  if (wide === null) {
    return (
      <div className={boxClass} style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          aria-hidden
          className="size-full opacity-0"
          onLoad={(e) => onMeasure(e.currentTarget)}
        />
      </div>
    );
  }

  if (wide) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={boxClass}
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${SPRITE_FRAME_COUNT * 100}% 100%`,
          backgroundPosition: spriteFrame === "end" ? "100% 0" : "0 0",
        }}
      />
    );
  }

  return (
    <div className={boxClass} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        decoding="async"
        className="size-full object-contain p-1.5"
      />
    </div>
  );
}
